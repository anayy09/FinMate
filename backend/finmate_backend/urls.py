from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    SignupView, LoginView, LogoutView, VerifyEmailView, ActiveSessionsView, 
    LogoutDeviceView, PasswordResetView, PasswordResetRequestView,
    Setup2FAView, Verify2FAView, Disable2FAView,
    CategoryViewSet, AccountViewSet, TransactionViewSet, BudgetViewSet, RecurringTransactionViewSet,
    NotificationViewSet, NotificationPreferenceViewSet, AIInsightViewSet, 
    SavingsGoalViewSet, ExpensePredictionView, AnomalyDetectionView,
    BudgetInsightsView, WeeklySummaryView, FinancialReportsView, EmailReportsView,
    PlaidAccountSyncView, BankAccountManagementView
)
from api.plaid_views import (
    create_link_token, exchange_public_token, sync_transactions, disconnect_account
)

# Create router for ViewSets
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='categories')
router.register(r'accounts', AccountViewSet, basename='accounts')
router.register(r'transactions', TransactionViewSet, basename='transactions')
router.register(r'budgets', BudgetViewSet, basename='budgets')
router.register(r'recurring-transactions', RecurringTransactionViewSet, basename='recurring-transactions')

# AI and Notifications
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'notification-preferences', NotificationPreferenceViewSet, basename='notification-preferences')
router.register(r'ai-insights', AIInsightViewSet, basename='ai-insights')
router.register(r'savings-goals', SavingsGoalViewSet, basename='savings-goals')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Authentication endpoints
    path("api/auth/signup/", SignupView.as_view(), name="signup"),
    path("api/auth/login/", LoginView.as_view(), name="login"),
    path("api/auth/logout/", LogoutView.as_view(), name="logout"),
    path("api/auth/verify-email/<str:token>/", VerifyEmailView.as_view(), name="verify_email"),
    path("api/user/sessions/", ActiveSessionsView.as_view(), name="active-sessions"),
    path("api/user/logout-device/", LogoutDeviceView.as_view(), name="logout-device"),
    path('api/auth/password-reset-request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('api/auth/password-reset/<str:token>/', PasswordResetView.as_view(), name='password_reset'),
    path('api/auth/setup-2fa/', Setup2FAView.as_view(), name='setup_2fa'),
    path('api/auth/verify-2fa/', Verify2FAView.as_view(), name='verify_2fa'),
    path('api/auth/disable-2fa/', Disable2FAView.as_view(), name='disable_2fa'),
    
    # Plaid integration endpoints
    path('api/plaid/create-link-token/', create_link_token, name='create_link_token'),
    path('api/plaid/exchange-public-token/', exchange_public_token, name='exchange_public_token'),
    path('api/plaid/sync-transactions/', sync_transactions, name='sync_transactions'),
    path('api/plaid/disconnect-account/<int:account_id>/', disconnect_account, name='disconnect_account'),
    
    # Transaction management endpoints
    path('api/', include(router.urls)),
    
    # AI Insights and Analytics endpoints
    path('api/expense-prediction/', ExpensePredictionView.as_view(), name='expense_prediction'),
    path('api/anomaly-detection/', AnomalyDetectionView.as_view(), name='anomaly_detection'),
    path('api/budget-insights/', BudgetInsightsView.as_view(), name='budget_insights'),
    path('api/weekly-summary/', WeeklySummaryView.as_view(), name='weekly_summary'),
    
    # Financial Reports endpoints
    path('api/reports/', FinancialReportsView.as_view(), name='financial_reports'),
    path('api/reports/email/', EmailReportsView.as_view(), name='email_reports'),
    
    # Enhanced Bank Sync endpoints
    path('api/plaid/sync/', PlaidAccountSyncView.as_view(), name='plaid_sync'),
    path('api/bank-accounts/', BankAccountManagementView.as_view(), name='bank_accounts'),
    path('api/bank-accounts/<int:account_id>/', BankAccountManagementView.as_view(), name='bank_account_detail'),
]
