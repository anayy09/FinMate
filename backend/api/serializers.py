from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Category, Account, Transaction, Budget, RecurringTransaction
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
    percentage_used = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = Budget
        fields = [
            'id', 'category', 'category_name', 'amount', 'spent_amount', 
            'remaining_amount', 'percentage_used', 'status', 'month'
        ]
        read_only_fields = ['spent_amount', 'remaining_amount']
    
    def get_percentage_used(self, obj):
        if obj.amount > 0:
            return min(float(obj.spent_amount / obj.amount * 100), 100)
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
