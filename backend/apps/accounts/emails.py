"""Email helpers for the accounts app."""
import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger("taskora")


def send_email_change_verification(user, new_email, token):
    """Send a verification link to the new email address.

    In dev (console backend) the email prints to the Django terminal.
    In prod (SMTP backend) it's delivered by the configured provider.
    """
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
    verify_url = f"{frontend_url}/verify-email-change?token={token}"

    subject = "Confirm your new email address — Taskora"
    message = (
        f"Hi {user.display_name},\n\n"
        f"You requested to change your Taskora email to {new_email}.\n\n"
        f"Click the link below to confirm. It expires in 24 hours.\n\n"
        f"{verify_url}\n\n"
        f"If you didn't request this, you can safely ignore this email."
    )

    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [new_email],
            fail_silently=False,
        )
        logger.info("Email change verification sent to %s", new_email)
    except Exception:
        logger.exception("Failed to send verification email to %s", new_email)
        raise
