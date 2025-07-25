from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Category, Account, Transaction, Budget, RecurringTransaction
from .notification_models import (
    NotificationPreference, Notification, BudgetAlert, 
    AIInsight, SavingsGoal
)
from decimal import Decimal

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Serializer for registering users."""
    class Meta:
        model = User
        fields = ["id", "email", "name", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    """Comprehensive serializer for user profile management."""
    date_joined = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'phone', 'bio', 'location', 
            'date_of_birth', 'occupation', 'preferred_currency', 
            'avatar', 'is_premium', 'two_factor_enabled', 
            'created_at', 'date_joined', 'last_login', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'date_joined', 'last_login', 'is_active', 'is_premium']
    
    def validate_email(self, value):
        """Validate email uniqueness for updates."""
        user = self.instance
        if user and User.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_phone(self, value):
        """Basic phone number validation."""
        if value and len(value.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')) < 10:
            raise serializers.ValidationError("Please enter a valid phone number.")
        return value

class LoginSerializer(serializers.Serializer):
    """Serializer for login validation."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class CategorySerializer(serializers.ModelSerializer):
    """Serializer for transaction categories."""
    class Meta:
        model = Category
        fields = ['id', 'name', 'category_type', 'description', 'icon', 'color', 'is_default']

class AccountSerializer(serializers.ModelSerializer):
    """Serializer for user accounts."""
    balance_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Account
        fields = ['id', 'name', 'account_type', 'balance', 'balance_display', 'currency', 'is_active', 'created_at']
        read_only_fields = ['balance', 'created_at']
    
    def get_balance_display(self, obj):
        return f"{obj.currency} {obj.balance:,.2f}"

class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for transactions."""
    category = CategorySerializer(read_only=True)
    account = AccountSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    amount_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'account', 'category', 'amount', 'amount_display', 'transaction_type',
            'description', 'notes', 'transaction_date', 'merchant_name', 'location',
            'categorization_confidence', 'is_recurring', 'category_name', 'account_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['categorization_confidence', 'created_at', 'updated_at']
    
    def get_amount_display(self, obj):
        return f"${obj.amount:,.2f}"
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

class TransactionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating transactions."""
    class Meta:
        model = Transaction
        fields = [
            'account', 'category', 'amount', 'transaction_type',
            'description', 'notes', 'transaction_date', 'merchant_name', 'location'
        ]
        extra_kwargs = {
            'description': {'required': False, 'allow_blank': True},
        }
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value
    
    def create(self, validated_data):
        # Set the user from the request context
        validated_data['user'] = self.context['request'].user
        
        # If no description provided, generate one from merchant_name or category
        if not validated_data.get('description'):
            if validated_data.get('merchant_name'):
                validated_data['description'] = f"Transaction at {validated_data['merchant_name']}"
            elif validated_data.get('category'):
                validated_data['description'] = f"{validated_data['category'].name} transaction"
            else:
                validated_data['description'] = f"{validated_data['transaction_type'].title()} transaction"
        
        return super().create(validated_data)

class BudgetSerializer(serializers.ModelSerializer):
    """Serializer for budgets."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    spent_amount = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()
    percentage_used = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = Budget
        fields = [
            'id', 'category', 'category_name', 'amount', 'spent_amount', 
            'remaining_amount', 'percentage_used', 'status', 'month'
        ]
    
    def get_spent_amount(self, obj):
        from django.db.models import Sum
        from datetime import datetime
        
        # Calculate start and end of the month
        month_start = obj.month
        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1)
        
        # Get total expenses for this category in this month
        spent = Transaction.objects.filter(
            user=obj.user,
            category=obj.category,
            transaction_type='expense',
            transaction_date__gte=month_start,
            transaction_date__lt=month_end
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        return str(spent)
    
    def get_remaining_amount(self, obj):
        spent_decimal = Decimal(self.get_spent_amount(obj))
        remaining = max(obj.amount - spent_decimal, Decimal('0.00'))
        return str(remaining)
    
    def get_percentage_used(self, obj):
        spent_decimal = Decimal(self.get_spent_amount(obj))
        if obj.amount > 0:
            return min(float(spent_decimal / obj.amount * 100), 100)
        return 0
    
    def get_status(self, obj):
        percentage = self.get_percentage_used(obj)
        if percentage >= 100:
            return 'over_budget'
        elif percentage >= 80:
            return 'warning'
        else:
            return 'on_track'

class RecurringTransactionSerializer(serializers.ModelSerializer):
    """Serializer for recurring transactions."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    
    class Meta:
        model = RecurringTransaction
        fields = [
            'id', 'account', 'category', 'amount', 'transaction_type',
            'description', 'frequency', 'start_date', 'end_date', 'next_due_date',
            'is_active', 'category_name', 'account_name'
        ]

class TransactionAnalyticsSerializer(serializers.Serializer):
    """Serializer for transaction analytics data."""
    total_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    net_worth = serializers.DecimalField(max_digits=12, decimal_places=2)
    transaction_count = serializers.IntegerField()
    
    # Category breakdown
    category_breakdown = serializers.ListField(child=serializers.DictField())
    
    # Monthly trends
    monthly_trends = serializers.ListField(child=serializers.DictField())
    
    # Recent transactions
    recent_transactions = TransactionSerializer(many=True)

class CategoryAnalyticsSerializer(serializers.Serializer):
    """Serializer for category-wise analytics."""
    category_id = serializers.IntegerField()
    category_name = serializers.CharField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    transaction_count = serializers.IntegerField()
    percentage = serializers.FloatField()
    color = serializers.CharField()

# Notification and AI Insight Serializers
class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for notification preferences."""
    
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'notification_type', 'is_enabled', 'delivery_method',
            'budget_alert_threshold', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications."""
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message', 'status',
            'sent_at', 'read_at', 'data', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'sent_at']

class AIInsightSerializer(serializers.ModelSerializer):
    """Serializer for AI insights."""
    
    class Meta:
        model = AIInsight
        fields = [
            'id', 'insight_type', 'title', 'description', 'data',
            'confidence_score', 'is_actionable', 'action_taken',
            'action_date', 'is_relevant', 'feedback', 'created_at'
        ]
        read_only_fields = ['created_at']

class SavingsGoalSerializer(serializers.ModelSerializer):
    """Serializer for savings goals."""
    target_categories = CategorySerializer(many=True, read_only=True)
    target_category_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )
    
    class Meta:
        model = SavingsGoal
        fields = [
            'id', 'title', 'description', 'target_amount', 'current_amount',
            'target_date', 'target_categories', 'target_category_ids',
            'status', 'progress_percentage', 'created_at', 'updated_at'
        ]
        read_only_fields = ['progress_percentage', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        target_category_ids = validated_data.pop('target_category_ids', [])
        goal = SavingsGoal.objects.create(**validated_data)
        
        if target_category_ids:
            categories = Category.objects.filter(id__in=target_category_ids)
            goal.target_categories.set(categories)
        
        return goal
    
    def update(self, instance, validated_data):
        target_category_ids = validated_data.pop('target_category_ids', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if target_category_ids is not None:
            categories = Category.objects.filter(id__in=target_category_ids)
            instance.target_categories.set(categories)
        
        return instance

class BudgetAlertSerializer(serializers.ModelSerializer):
    """Serializer for budget alerts."""
    budget_category = serializers.CharField(source='budget.category.name', read_only=True)
    
    class Meta:
        model = BudgetAlert
        fields = [
            'id', 'alert_type', 'month', 'is_sent', 'sent_at',
            'budget_category', 'created_at'
        ]
        read_only_fields = ['created_at', 'is_sent', 'sent_at']

class ExpensePredictionSerializer(serializers.Serializer):
    """Serializer for expense predictions."""
    total_monthly_prediction = serializers.DecimalField(max_digits=12, decimal_places=2)
    daily_predictions = serializers.ListField(child=serializers.DictField())
    category = serializers.CharField()
    confidence_score = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)

class SpendingInsightSerializer(serializers.Serializer):
    """Serializer for spending insights."""
    insight_type = serializers.CharField()
    title = serializers.CharField()
    message = serializers.CharField()
    data = serializers.DictField()
    confidence_score = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)

class WeeklySummarySerializer(serializers.Serializer):
    """Serializer for weekly summary data."""
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    total_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    net_cash_flow = serializers.DecimalField(max_digits=12, decimal_places=2)
    top_categories = serializers.DictField()
    transaction_count = serializers.IntegerField()
    comparison_previous_week = serializers.DictField(required=False)
