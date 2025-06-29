"""
Celery tasks for features: AI insights, notifications, and budget alerts.
"""
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Sum, Avg
from datetime import datetime, timedelta
from decimal import Decimal
import logging

from .models import Transaction, Budget, Category
from .notification_models import (
    Notification, NotificationPreference, BudgetAlert, 
    AIInsight, SavingsGoal
)
from .ml_models import generate_ai_insights, ExpensePredictionModel, AnomalyDetectionModel

User = get_user_model()
logger = logging.getLogger(__name__)


@shared_task
def process_budget_alerts():
    """Check all budgets and send alerts for overspending."""
    logger.info("Starting budget alert processing...")
    
    current_date = timezone.now()
    current_month = current_date.replace(day=1).date()
    
    # Get all active budgets for current month
    budgets = Budget.objects.filter(month=current_month).select_related('user', 'category')
    
    alerts_sent = 0
    
    for budget in budgets:
        try:
            # Calculate current spending
            month_start = current_month
            month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
            
            current_spending = Transaction.objects.filter(
                user=budget.user,
                category=budget.category,
                transaction_type='expense',
                transaction_date__range=[month_start, month_end]
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            
            # Update budget
            budget.spent_amount = current_spending
            budget.calculate_remaining()
            budget.save()
            
            # Calculate percentage used
            if budget.amount > 0:
                percentage_used = float(current_spending / budget.amount * 100)
            else:
                continue
            
            # Check if user wants budget alerts
            pref = NotificationPreference.objects.filter(
                user=budget.user,
                notification_type='budget_alert',
                is_enabled=True
            ).first()
            
            if not pref:
                continue
            
            # Determine alert type
            alert_type = None
            if percentage_used >= 100:
                alert_type = 'exceeded'
            elif percentage_used >= float(pref.budget_alert_threshold):
                alert_type = 'warning'
            
            if alert_type:
                # Check if alert already sent this month
                existing_alert = BudgetAlert.objects.filter(
                    budget=budget,
                    alert_type=alert_type,
                    month=current_month,
                    is_sent=True
                ).exists()
                
                if not existing_alert:
                    # Create and send alert
                    send_budget_alert.delay(budget.id, alert_type, percentage_used)
                    alerts_sent += 1
                    
        except Exception as e:
            logger.error(f"Error processing budget alert for budget {budget.id}: {str(e)}")
    
    logger.info(f"Budget alert processing completed. {alerts_sent} alerts queued.")
    return alerts_sent


@shared_task
def send_budget_alert(budget_id, alert_type, percentage_used):
    """Send individual budget alert."""
    try:
        budget = Budget.objects.select_related('user', 'category').get(id=budget_id)
        
        # Create alert record
        alert, created = BudgetAlert.objects.get_or_create(
            budget=budget,
            alert_type=alert_type,
            month=timezone.now().replace(day=1).date(),
            defaults={
                'user': budget.user,
                'is_sent': False
            }
        )
        
        if alert.is_sent:
            return "Alert already sent"
        
        # Create notification
        if alert_type == 'warning':
            title = f"Budget Alert: {budget.category.name}"
            message = f"You've used {percentage_used:.1f}% of your {budget.category.name} budget (${budget.spent_amount} of ${budget.amount}). Consider reducing spending in this category."
            notification_type = 'budget_warning'
        else:  # exceeded
            title = f"Budget Exceeded: {budget.category.name}"
            message = f"You've exceeded your {budget.category.name} budget by ${budget.spent_amount - budget.amount:.2f} (${budget.spent_amount} of ${budget.amount}). Review your spending to get back on track."
            notification_type = 'budget_exceeded'
        
        notification = Notification.objects.create(
            user=budget.user,
            notification_type=notification_type,
            title=title,
            message=message,
            budget=budget,
            data={
                'percentage_used': percentage_used,
                'spent_amount': float(budget.spent_amount),
                'budget_amount': float(budget.amount),
                'category': budget.category.name
            }
        )
        
        # Send email if enabled
        pref = NotificationPreference.objects.filter(
            user=budget.user,
            notification_type='budget_alert'
        ).first()
        
        if pref and pref.delivery_method in ['email', 'both']:
            send_email_notification.delay(notification.id)
        
        # Mark alert as sent
        alert.is_sent = True
        alert.sent_at = timezone.now()
        alert.save()
        
        # Update notification status
        notification.status = 'sent'
        notification.sent_at = timezone.now()
        notification.save()
        
        logger.info(f"Budget alert sent to {budget.user.email} for {budget.category.name}")
        return "Alert sent successfully"
        
    except Exception as e:
        logger.error(f"Error sending budget alert: {str(e)}")
        return f"Error: {str(e)}"


@shared_task
def send_email_notification(notification_id):
    """Send email notification to user."""
    try:
        notification = Notification.objects.select_related('user').get(id=notification_id)
        
        subject = f"FinMate: {notification.title}"
        message = notification.message
        
        # Add footer
        message += "\n\n---\nThis is an automated message from FinMate. Visit your dashboard for more details."
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL or 'noreply@finmate.com',
            recipient_list=[notification.user.email],
            fail_silently=False
        )
        
        logger.info(f"Email sent to {notification.user.email}: {notification.title}")
        return "Email sent successfully"
        
    except Exception as e:
        logger.error(f"Error sending email notification: {str(e)}")
        return f"Error: {str(e)}"


@shared_task
def generate_weekly_summary():
    """Generate weekly summary for all users."""
    logger.info("Starting weekly summary generation...")
    
    # Get all users who want weekly summaries
    preferences = NotificationPreference.objects.filter(
        notification_type='weekly_summary',
        is_enabled=True
    ).select_related('user')
    
    summaries_sent = 0
    
    for pref in preferences:
        try:
            send_weekly_summary.delay(pref.user.id)
            summaries_sent += 1
        except Exception as e:
            logger.error(f"Error queuing weekly summary for user {pref.user.id}: {str(e)}")
    
    logger.info(f"Weekly summary generation completed. {summaries_sent} summaries queued.")
    return summaries_sent


@shared_task
def send_weekly_summary(user_id):
    """Send weekly summary to a specific user."""
    try:
        user = User.objects.get(id=user_id)
        
        # Calculate date range (last 7 days)
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=7)
        
        # Get weekly transactions
        transactions = Transaction.objects.filter(
            user=user,
            transaction_date__range=[start_date, end_date]
        )
        
        if not transactions.exists():
            return "No transactions this week"
        
        # Calculate summary statistics
        total_income = transactions.filter(transaction_type='income').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        total_expenses = transactions.filter(transaction_type='expense').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        net_cash_flow = total_income - total_expenses
        
        # Get top spending categories
        category_spending = {}
        for transaction in transactions.filter(transaction_type='expense'):
            category_name = transaction.category.name if transaction.category else 'Uncategorized'
            category_spending[category_name] = category_spending.get(category_name, Decimal('0.00')) + transaction.amount
        
        top_categories = sorted(category_spending.items(), key=lambda x: x[1], reverse=True)[:3]
        
        # Create summary message
        title = f"Weekly Summary - {start_date.strftime('%b %d')} to {end_date.strftime('%b %d')}"
        
        message = f"""
        Here's your weekly financial summary:
        
        💰 Total Income: ${total_income:.2f}
        💸 Total Expenses: ${total_expenses:.2f}
        📊 Net Cash Flow: ${net_cash_flow:.2f}
        
        Top Spending Categories:
        """
        
        for i, (category, amount) in enumerate(top_categories, 1):
            message += f"\n{i}. {category}: ${amount:.2f}"
        
        if net_cash_flow < 0:
            message += f"\n\n⚠️ You spent ${abs(net_cash_flow):.2f} more than you earned this week."
        else:
            message += f"\n\n✅ Great job! You saved ${net_cash_flow:.2f} this week."
        
        # Create notification
        notification = Notification.objects.create(
            user=user,
            notification_type='weekly_summary',
            title=title,
            message=message,
            data={
                'total_income': float(total_income),
                'total_expenses': float(total_expenses),
                'net_cash_flow': float(net_cash_flow),
                'top_categories': dict(top_categories),
                'transaction_count': transactions.count()
            }
        )
        
        # Send email if enabled
        pref = NotificationPreference.objects.filter(
            user=user,
            notification_type='weekly_summary'
        ).first()
        
        if pref and pref.delivery_method in ['email', 'both']:
            send_email_notification.delay(notification.id)
        
        notification.status = 'sent'
        notification.sent_at = timezone.now()
        notification.save()
        
        logger.info(f"Weekly summary sent to {user.email}")
        return "Weekly summary sent successfully"
        
    except Exception as e:
        logger.error(f"Error sending weekly summary: {str(e)}")
        return f"Error: {str(e)}"


@shared_task
def generate_ai_insights_for_all_users():
    """Generate AI insights for all users."""
    logger.info("Starting AI insights generation for all users...")
    
    # Get users who have enough transaction data
    users_with_data = User.objects.filter(
        transactions__isnull=False
    ).distinct()
    
    insights_generated = 0
    
    for user in users_with_data:
        try:
            # Check if user wants AI insights
            pref = NotificationPreference.objects.filter(
                user=user,
                notification_type='ai_insights',
                is_enabled=True
            ).first()
            
            if pref:
                generate_user_ai_insights.delay(user.id)
                insights_generated += 1
                
        except Exception as e:
            logger.error(f"Error queuing AI insights for user {user.id}: {str(e)}")
    
    logger.info(f"AI insights generation completed. {insights_generated} users queued.")
    return insights_generated


@shared_task
def generate_user_ai_insights(user_id):
    """Generate AI insights for a specific user."""
    try:
        user = User.objects.get(id=user_id)
        
        # Generate insights using ML model
        insights = generate_ai_insights(user_id)
        
        if not insights:
            return "No insights generated"
        
        insights_created = 0
        
        # Process spending patterns
        for pattern in insights.get('spending_patterns', []):
            ai_insight = AIInsight.objects.create(
                user=user,
                insight_type='spending_pattern',
                title=f"Spending Pattern: {pattern.get('type', 'Unknown')}",
                description=pattern.get('message', ''),
                data=pattern,
                confidence_score=Decimal('85.0')  # Default confidence
            )
            
            # Create notification
            Notification.objects.create(
                user=user,
                notification_type='ai_insight',
                title=ai_insight.title,
                message=ai_insight.description,
                data={'insight_id': ai_insight.id}
            )
            
            insights_created += 1
        
        # Process budget suggestions
        for suggestion in insights.get('budget_suggestions', []):
            ai_insight = AIInsight.objects.create(
                user=user,
                insight_type='budget_suggestion',
                title="AI Budget Recommendation",
                description=suggestion.get('message', ''),
                data=suggestion,
                confidence_score=Decimal('90.0'),
                is_actionable=True
            )
            
            insights_created += 1
        
        # Process savings opportunities
        for opportunity in insights.get('savings_opportunities', []):
            ai_insight = AIInsight.objects.create(
                user=user,
                insight_type='savings_opportunity',
                title=f"Savings Opportunity: {opportunity.get('category', 'General')}",
                description=opportunity.get('message', ''),
                data=opportunity,
                confidence_score=Decimal('80.0'),
                is_actionable=True
            )
            
            # Create notification for significant savings opportunities
            if opportunity.get('potential_savings', 0) > 50:
                Notification.objects.create(
                    user=user,
                    notification_type='saving_suggestion',
                    title=ai_insight.title,
                    message=ai_insight.description,
                    data={'insight_id': ai_insight.id, 'potential_savings': opportunity.get('potential_savings')}
                )
            
            insights_created += 1
        
        # Process anomalies
        for anomaly in insights.get('anomalies', []):
            ai_insight = AIInsight.objects.create(
                user=user,
                insight_type='anomaly',
                title="Unusual Spending Detected",
                description=f"Unusual transaction: {anomaly.get('description', 'Unknown')} - ${anomaly.get('amount', 0):.2f}",
                data=anomaly,
                confidence_score=Decimal('75.0')
            )
            
            # Create high-priority notification for large anomalies
            if anomaly.get('amount', 0) > 200:
                Notification.objects.create(
                    user=user,
                    notification_type='anomaly_alert',
                    title="Large Unusual Transaction Detected",
                    message=ai_insight.description,
                    data={'insight_id': ai_insight.id, 'transaction_id': anomaly.get('transaction_id')}
                )
            
            insights_created += 1
        
        # Process predictions
        predictions = insights.get('predictions', {})
        if predictions:
            ai_insight = AIInsight.objects.create(
                user=user,
                insight_type='prediction',
                title="Monthly Expense Prediction",
                description=f"Based on your spending patterns, you're predicted to spend ${predictions.get('total_monthly_prediction', 0):.2f} next month.",
                data=predictions,
                confidence_score=Decimal('85.0')
            )
            
            insights_created += 1
        
        logger.info(f"Generated {insights_created} AI insights for user {user.email}")
        return f"Generated {insights_created} insights"
        
    except Exception as e:
        logger.error(f"Error generating AI insights for user {user_id}: {str(e)}")
        return f"Error: {str(e)}"


@shared_task
def detect_anomalies_for_user(user_id):
    """Detect spending anomalies for a specific user."""
    try:
        user = User.objects.get(id=user_id)
        
        # Initialize anomaly detection model
        anomaly_model = AnomalyDetectionModel()
        
        # Train model
        success, result = anomaly_model.train(user_id)
        if not success:
            return f"Training failed: {result}"
        
        # Detect anomalies
        anomalies, error = anomaly_model.detect_anomalies(user_id, days_back=7)
        if error:
            return f"Detection failed: {error}"
        
        if not anomalies:
            return "No anomalies detected"
        
        # Process each anomaly
        for anomaly in anomalies[:3]:  # Top 3 anomalies
            try:
                transaction = Transaction.objects.get(id=anomaly['transaction_id'])
                
                # Create notification
                Notification.objects.create(
                    user=user,
                    notification_type='anomaly_alert',
                    title="Unusual Spending Detected",
                    message=f"We detected an unusual transaction: {anomaly['description']} for ${anomaly['amount']:.2f} on {anomaly['date']}. This is significantly different from your normal spending patterns.",
                    transaction=transaction,
                    data=anomaly
                )
                
            except Transaction.DoesNotExist:
                continue
        
        logger.info(f"Processed {len(anomalies)} anomalies for user {user.email}")
        return f"Processed {len(anomalies)} anomalies"
        
    except Exception as e:
        logger.error(f"Error detecting anomalies for user {user_id}: {str(e)}")
        return f"Error: {str(e)}"


@shared_task
def update_savings_goals():
    """Update progress for all active savings goals."""
    logger.info("Starting savings goals update...")
    
    active_goals = SavingsGoal.objects.filter(status='active')
    updated_count = 0
    
    for goal in active_goals:
        try:
            # Calculate savings based on category spending reduction
            if goal.target_categories.exists():
                # Get current month spending in target categories
                current_month = timezone.now().replace(day=1).date()
                
                current_spending = Transaction.objects.filter(
                    user=goal.user,
                    category__in=goal.target_categories.all(),
                    transaction_type='expense',
                    transaction_date__gte=current_month
                ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
                
                # Get average spending for comparison (last 3 months)
                three_months_ago = (current_month - timedelta(days=90)).replace(day=1)
                avg_spending = Transaction.objects.filter(
                    user=goal.user,
                    category__in=goal.target_categories.all(),
                    transaction_type='expense',
                    transaction_date__range=[three_months_ago, current_month]
                ).aggregate(avg=Avg('amount'))['avg'] or Decimal('0.00')
                
                # Calculate savings (if spending less than average)
                if avg_spending > current_spending:
                    monthly_savings = avg_spending - current_spending
                    goal.current_amount += monthly_savings
                    goal.calculate_progress()
                    
                    # Check if goal is completed
                    if goal.progress_percentage >= 100:
                        Notification.objects.create(
                            user=goal.user,
                            notification_type='goal_achievement',
                            title=f"Savings Goal Achieved: {goal.title}",
                            message=f"Congratulations! You've reached your savings goal of ${goal.target_amount:.2f} for {goal.title}!",
                            data={'goal_id': goal.id, 'amount_saved': float(goal.current_amount)}
                        )
                
                updated_count += 1
                
        except Exception as e:
            logger.error(f"Error updating savings goal {goal.id}: {str(e)}")
    
    logger.info(f"Updated {updated_count} savings goals")
    return updated_count
