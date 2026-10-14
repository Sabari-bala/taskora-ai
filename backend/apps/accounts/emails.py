"""Email helpers for the accounts app."""
import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger("taskora")


def send_email_change_verification(user, new_email, code):
    """Send a verification link containing a short code to the new email.

    In dev (console backend) the email prints to the Django terminal,
    and we ALSO log a dedicated, easy-to-find block with the code.
    In prod (SMTP backend) it is delivered by the configured provider.
    """
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
    verify_url = f"{frontend_url}/verify-email-change?code={code}"

    subject = "Confirm your new email address — Taskora"
    message = (
        f"Hi {user.display_name},\n\n"
        f"You requested to change your Taskora email to {new_email}.\n\n"
        f"Click the link below to confirm. It expires in 24 hours.\n\n"
        f"{verify_url}\n\n"
        f"If you didn't request this, you can safely ignore this email.\n\n"
        f"— Taskora"
    )

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [new_email],
        fail_silently=False,
    )

    # Dedicated log block — easy to grep, easy to copy in dev.
    logger.info("=" * 72)
    logger.info("EMAIL VERIFICATION CODE: %s", code)
    logger.info("Open this URL in your browser:")
    logger.info("  %s", verify_url)
    logger.info("=" * 72)
