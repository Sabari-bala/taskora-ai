"""Production settings."""
from .base import *  # noqa: F403

DEBUG = False

# Security hardening — production only
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Ensure DATABASE_URL is set in production
DATABASES["default"] = env.db("DATABASE_URL")  # noqa: F405
DATABASES["default"]["CONN_MAX_AGE"] = 600