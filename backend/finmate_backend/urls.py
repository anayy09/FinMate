from django.contrib import admin
from django.urls import path
from api.views import SignupView, LoginView, LogoutView, VerifyEmailView, ActiveSessionsView, LogoutDeviceView, PasswordResetView, PasswordResetRequestView

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
]
