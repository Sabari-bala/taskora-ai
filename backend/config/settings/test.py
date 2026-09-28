"""Test settings — fast, no external services."""

from .base import *  # noqa: F403

DEBUG = False

# Use in-memory SQLite for speed. Overridden by DATABASE_URL in CI if needed.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Disable throttling so tests can hammer endpoints
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []  # noqa: F405

# Faster password hashing
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# Silent logging
LOGGING["root"]["level"] = "CRITICAL"  # noqa: F405
