from django.core.mail import send_mail
from django.conf import settings

def send_verification_email(user):
    """Send email verification link to the user."""
    subject = "Verify Your FinMate Email"
    message = f"Click the link to verify your email: http://localhost:5175/verify-email/{user.verification_token}/"
    email_from = settings.DEFAULT_FROM_EMAIL
    recipient_list = [user.email]
    send_mail(subject, message, email_from, recipient_list)

def send_password_reset_email(user):
    """Send password reset link to the user."""
    subject = "Reset Your FinMate Password"
    message = f"Click the link to reset your password: http://localhost:5175/password-reset/{user.verification_token}/"
    email_from = settings.DEFAULT_FROM_EMAIL
    recipient_list = [user.email]
    send_mail(subject, message, email_from, recipient_list)
