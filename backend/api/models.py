import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from decimal import Decimal
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        """Creates and returns a user with the given email and password."""
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Creates and returns a superuser."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model using email authentication."""
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=False)  # User is inactive until email is verified
    is_staff = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    verification_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    
    # 2FA fields
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=32, blank=True, null=True)
    
    # Sprint 4: Report preferences
    report_email_frequency = models.CharField(max_length=20, choices=[
        ('never', 'Never'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ], default='monthly')

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    objects = UserManager()

    def __str__(self):
        return self.email

class UserSession(models.Model):
    """Stores user session details for device management."""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    session_id = models.CharField(max_length=100, unique=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    device_info = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Session {self.session_id} for {self.user.email}"

class Category(models.Model):
    """Transaction categories for expense classification."""
    CATEGORY_TYPES = [
        ('expense', 'Expense'),
        ('income', 'Income'),
        ('transfer', 'Transfer'),
    ]
    
    name = models.CharField(max_length=100)
    category_type = models.CharField(max_length=10, choices=CATEGORY_TYPES, default='expense')
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True)  # Font Awesome icon class
    color = models.CharField(max_length=7, default='#3182CE')  # Hex color code
    is_default = models.BooleanField(default=False)  # System default categories
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.category_type})"

class Account(models.Model):
    """User's financial accounts (bank accounts, credit cards, etc.)"""
    ACCOUNT_TYPES = [
        ('checking', 'Checking Account'),
        ('savings', 'Savings Account'),
        ('credit_card', 'Credit Card'),
        ('cash', 'Cash'),
        ('investment', 'Investment Account'),
        ('loan', 'Loan Account'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accounts')
    name = models.CharField(max_length=100)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    currency = models.CharField(max_length=3, default='USD')
    
    # Plaid integration fields
    plaid_account_id = models.CharField(max_length=100, blank=True, null=True)
    plaid_access_token = models.CharField(max_length=200, blank=True, null=True)
    plaid_item_id = models.CharField(max_length=100, blank=True, null=True)
    institution_name = models.CharField(max_length=100, blank=True, null=True)
    account_mask = models.CharField(max_length=10, blank=True, null=True)
    last_sync = models.DateTimeField(null=True, blank=True)
    sync_cursor = models.CharField(max_length=200, blank=True, null=True)  # For transaction sync
    
    # Sprint 4: Enhanced Plaid features
    is_plaid_account = models.BooleanField(default=False)
    plaid_institution_name = models.CharField(max_length=200, blank=True, null=True)
    auto_sync_enabled = models.BooleanField(default=False)
    sync_frequency = models.CharField(max_length=20, choices=[
        ('hourly', 'Hourly'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
    ], default='daily')
    last_plaid_sync = models.DateTimeField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_account_type_display()})"

class PlaidItem(models.Model):
    """Stores Plaid item information for connected institutions"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='plaid_items')
    plaid_item_id = models.CharField(max_length=100, unique=True)
    access_token = models.CharField(max_length=200)
    institution_id = models.CharField(max_length=100)
    institution_name = models.CharField(max_length=100)
    
    # Item status
    available_products = models.JSONField(default=list)
    billed_products = models.JSONField(default=list)
    last_webhook = models.DateTimeField(null=True, blank=True)
    
    # Error tracking
    error_type = models.CharField(max_length=100, blank=True, null=True)
    error_code = models.CharField(max_length=100, blank=True, null=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.institution_name} - {self.user.email}"

class Transaction(models.Model):
    """Individual financial transactions."""
    TRANSACTION_TYPES = [
        ('expense', 'Expense'),
        ('income', 'Income'),
        ('transfer', 'Transfer'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='transactions')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    description = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    transaction_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Plaid integration fields
    plaid_transaction_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    merchant_name = models.CharField(max_length=200, blank=True, null=True)
    
    # Sprint 4: Enhanced transaction tracking
    is_plaid_transaction = models.BooleanField(default=False)
    
    # Location data
    location = models.CharField(max_length=255, blank=True, null=True)
    
    # Auto-categorization confidence score
    categorization_confidence = models.FloatField(default=0.0)
    is_recurring = models.BooleanField(default=False)

    class Meta:
        ordering = ['-transaction_date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'transaction_date']),
            models.Index(fields=['user', 'category']),
            models.Index(fields=['plaid_transaction_id']),
        ]

    def __str__(self):
        return f"{self.description} - ${self.amount} ({self.transaction_date})"

class Budget(models.Model):
    """Monthly budgets for categories."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    month = models.DateField()  # First day of the month
    
    # Budget tracking
    spent_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    remaining_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'category', 'month']
        ordering = ['-month', 'category__name']

    def __str__(self):
        return f"{self.user.email} - {self.category.name} - {self.month.strftime('%B %Y')}"

    def calculate_remaining(self):
        """Calculate remaining budget amount."""
        self.remaining_amount = self.amount - self.spent_amount
        return self.remaining_amount

class RecurringTransaction(models.Model):
    """Template for recurring transactions (subscriptions, bills, etc.)"""
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recurring_transactions')
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=10, choices=Transaction.TRANSACTION_TYPES)
    description = models.CharField(max_length=255)
    
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    next_due_date = models.DateField()
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['next_due_date']

    def __str__(self):
        return f"{self.description} - ${self.amount} ({self.frequency})"

# Signal to create default account for new users
@receiver(post_save, sender=User)
def create_default_account(sender, instance, created, **kwargs):
    """Create a default account when a new user is created."""
    if created:
        Account.objects.create(
            user=instance,
            name="Default Account",
            account_type="checking",
            balance=Decimal('0.00'),
            currency="USD"
        )

# Import notification models
from .notification_models import (
    NotificationPreference, Notification, BudgetAlert, 
    AIInsight, SavingsGoal
)