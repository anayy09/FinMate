from django.core.mail import send_mail
from django.conf import settings

def send_verification_email(user):
    """Send email verification link to the user."""
    subject = "Verify Your Email"
    message = f"Click the link to verify your email: http://localhost:8000/api/auth/verify-email/{user.verification_token}/"
    email_from = settings.EMAIL_HOST_USER
    recipient_list = [user.email]
    send_mail(subject, message, email_from, recipient_list)

def send_password_reset_email(user):
    """Send password reset link to the user."""
    subject = "Reset Your Password"
    message = f"Click the link to reset your password: http://localhost:8000/api/auth/password-reset/{user.verification_token}/"
    email_from = settings.EMAIL_HOST_USER
    recipient_list = [user.email]
    send_mail(subject, message, email_from, recipient_list)
