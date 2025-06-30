from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings

def send_verification_email(user):
    """Send email verification link to the user."""
    subject = "Verify Your FinMate Email"
    text_message = (
        f"Click the link to verify your email: "
        f"http://localhost:5173/verify-email/{user.verification_token}"
    )
    html_message = render_to_string(
        "email/verification_email.html",
        {"user": user},
    )
    email_from = settings.DEFAULT_FROM_EMAIL
    msg = EmailMultiAlternatives(subject, text_message, email_from, [user.email])
    msg.attach_alternative(html_message, "text/html")
    msg.send()

def send_password_reset_email(user):
    """Send password reset link to the user."""
    subject = "Reset Your FinMate Password"
    text_message = (
        f"Click the link to reset your password: "
        f"http://localhost:5173/password-reset/{user.verification_token}"
    )
    html_message = render_to_string(
        "email/password_reset_email.html",
        {"user": user},
    )
    email_from = settings.DEFAULT_FROM_EMAIL
    msg = EmailMultiAlternatives(subject, text_message, email_from, [user.email])
    msg.attach_alternative(html_message, "text/html")
    msg.send()
