from django.contrib import admin
from django.urls import path
from api.views import (
    SignupView, LoginView, LogoutView, VerifyEmailView, ActiveSessionsView, 
    LogoutDeviceView, PasswordResetView, PasswordResetRequestView,
    Setup2FAView, Verify2FAView, Disable2FAView
)

urlpatterns = [
    path('admin/', admin.site.urls),
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
]
