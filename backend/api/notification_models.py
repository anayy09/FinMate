"""
Notification and alert models for budget tracking and AI insights.
"""
from django.db import models
from django.contrib.auth import get_user_model
from decimal import Decimal

User = get_user_model()


class NotificationPreference(models.Model):
    """User preferences for notifications."""
    
    NOTIFICATION_TYPES = [
        ('budget_alert', 'Budget Alert'),
        ('overspending', 'Overspending Warning'),
        ('weekly_summary', 'Weekly Summary'),
        ('monthly_report', 'Monthly Report'),
        ('ai_insights', 'AI Insights'),
        ('anomaly_detection', 'Unusual Spending Alert'),
        ('goal_achievement', 'Goal Achievement'),
    ]
    
    DELIVERY_METHODS = [
        ('email', 'Email'),
        ('in_app', 'In-App Notification'),
        ('both', 'Email and In-App'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notification_preferences')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    is_enabled = models.BooleanField(default=True)
    delivery_method = models.CharField(max_length=10, choices=DELIVERY_METHODS, default='both')
    
    # Threshold settings
    budget_alert_threshold = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('80.00'),
        help_text="Percentage of budget used before alert (default 80%)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'notification_type']
        
    def __str__(self):
        return f"{self.user.email} - {self.get_notification_type_display()}"


class Notification(models.Model):
    """Individual notifications sent to users."""
    
    NOTIFICATION_TYPES = [
        ('budget_warning', 'Budget Warning'),
        ('budget_exceeded', 'Budget Exceeded'),
        ('weekly_summary', 'Weekly Summary'),
        ('monthly_report', 'Monthly Report'),
        ('ai_insight', 'AI Insight'),
        ('anomaly_alert', 'Anomaly Alert'),
        ('goal_achievement', 'Goal Achievement'),
        ('saving_suggestion', 'Saving Suggestion'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('read', 'Read'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Status tracking
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    sent_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Related objects
    budget = models.ForeignKey(
        'Budget', on_delete=models.CASCADE, null=True, blank=True,
        help_text="Related budget if this is a budget alert"
    )
    transaction = models.ForeignKey(
        'Transaction', on_delete=models.CASCADE, null=True, blank=True,
        help_text="Related transaction if this is an anomaly alert"
    )
    
    # Additional data
    data = models.JSONField(default=dict, help_text="Additional notification data")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.user.email} - {self.title}"
    
    def mark_as_read(self):
        """Mark notification as read."""
        if not self.read_at:
            from django.utils import timezone
            self.read_at = timezone.now()
            self.status = 'read'
            self.save()


class BudgetAlert(models.Model):
    """Track budget alerts to prevent spam."""
    
    ALERT_TYPES = [
        ('warning', 'Warning (80% spent)'),
        ('critical', 'Critical (100% spent)'),
        ('exceeded', 'Exceeded (>100% spent)'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budget_alerts')
    budget = models.ForeignKey('Budget', on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField(max_length=10, choices=ALERT_TYPES)
    
    # Prevent duplicate alerts
    month = models.DateField()
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['budget', 'alert_type', 'month']
        
    def __str__(self):
        return f"{self.budget} - {self.get_alert_type_display()}"


class AIInsight(models.Model):
    """Store AI-generated insights for users."""
    
    INSIGHT_TYPES = [
        ('spending_pattern', 'Spending Pattern'),
        ('budget_suggestion', 'Budget Suggestion'),
        ('savings_opportunity', 'Savings Opportunity'),
        ('prediction', 'Expense Prediction'),
        ('anomaly', 'Anomaly Detection'),
        ('goal_recommendation', 'Goal Recommendation'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_insights')
    insight_type = models.CharField(max_length=20, choices=INSIGHT_TYPES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    # Insight data
    data = models.JSONField(default=dict, help_text="Structured insight data")
    confidence_score = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text="AI confidence score (0-100)"
    )
    
    # Action tracking
    is_actionable = models.BooleanField(default=True)
    action_taken = models.BooleanField(default=False)
    action_date = models.DateTimeField(null=True, blank=True)
    
    # Relevance tracking
    is_relevant = models.BooleanField(null=True, blank=True, help_text="User feedback on relevance")
    feedback = models.TextField(blank=True, help_text="User feedback on the insight")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.user.email} - {self.title}"


class SavingsGoal(models.Model):
    """User savings goals for tracking and motivation."""
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('paused', 'Paused'),
        ('cancelled', 'Cancelled'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='savings_goals')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Goal details
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    current_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    target_date = models.DateField()
    
    # Categories to save from
    target_categories = models.ManyToManyField(
        'Category', blank=True,
        help_text="Categories where savings will come from"
    )
    
    # Tracking
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    progress_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('0.00')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.user.email} - {self.title}"
    
    def calculate_progress(self):
        """Calculate and update progress percentage."""
        if self.target_amount > 0:
            self.progress_percentage = min(
                (self.current_amount / self.target_amount) * 100,
                Decimal('100.00')
            )
        else:
            self.progress_percentage = Decimal('0.00')
        
        # Check if goal is completed
        if self.progress_percentage >= 100 and self.status == 'active':
            self.status = 'completed'
        
        self.save()
        return self.progress_percentage
    
    def add_savings(self, amount):
        """Add money to the savings goal."""
        self.current_amount += Decimal(str(amount))
        return self.calculate_progress()
