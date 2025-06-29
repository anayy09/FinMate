from django.contrib import admin
from .models import User, UserSession, Category, Account, Transaction, Budget, RecurringTransaction

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'name', 'is_active', 'email_verified', 'two_factor_enabled', 'created_at']
    list_filter = ['is_active', 'email_verified', 'two_factor_enabled', 'created_at']
    search_fields = ['email', 'name']
    readonly_fields = ['verification_token', 'two_factor_secret']

@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'session_id', 'ip_address', 'device_info', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'session_id', 'ip_address']

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'category_type', 'color', 'is_default', 'created_at']
    list_filter = ['category_type', 'is_default', 'created_at']
    search_fields = ['name', 'description']

@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'account_type', 'balance', 'currency', 'is_active', 'created_at']
    list_filter = ['account_type', 'currency', 'is_active', 'created_at']
    search_fields = ['name', 'user__email']

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['description', 'user', 'amount', 'transaction_type', 'category', 'account', 'transaction_date', 'created_at']
    list_filter = ['transaction_type', 'category', 'account', 'transaction_date', 'created_at']
    search_fields = ['description', 'merchant_name', 'user__email']
    date_hierarchy = 'transaction_date'

@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ['user', 'category', 'amount', 'spent_amount', 'remaining_amount', 'month']
    list_filter = ['category', 'month']
    search_fields = ['user__email', 'category__name']

@admin.register(RecurringTransaction)
class RecurringTransactionAdmin(admin.ModelAdmin):
    list_display = ['description', 'user', 'amount', 'frequency', 'next_due_date', 'is_active']
    list_filter = ['frequency', 'transaction_type', 'is_active']
    search_fields = ['description', 'user__email']
