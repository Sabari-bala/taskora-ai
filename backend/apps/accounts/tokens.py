"""Stateless, signed tokens for email change verification.

We use Django's `signing` module — no database row needed. The token
contains {user_id, new_email} and is signed with SECRET_KEY. It expires
automatically after 24 hours.
"""
from django.core import signing

EMAIL_CHANGE_SALT = "taskora.email-change"
EMAIL_CHANGE_MAX_AGE = 60 * 60 * 24  # 24 hours


def make_email_change_token(user, new_email):
    return signing.dumps(
        {"user_id": str(user.id), "new_email": new_email.lower()},
        salt=EMAIL_CHANGE_SALT,
        compress=True,
    )


def read_email_change_token(token):
    return signing.loads(
        token,
        salt=EMAIL_CHANGE_SALT,
        max_age=EMAIL_CHANGE_MAX_AGE,
    )
