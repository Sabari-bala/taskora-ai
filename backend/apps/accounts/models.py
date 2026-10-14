import uuid

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model.

    Design decisions:
    - Email is the login identifier (no separate username field).
    - UUID primary key — safer for public APIs than sequential integers.
    - Inherits from AbstractBaseUser + PermissionsMixin so we get
      `is_superuser`, `groups`, and `user_permissions` for free.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    email = models.EmailField(unique=True, db_index=True)
    full_name = models.CharField(max_length=150, blank=True)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "accounts_user"
        ordering = ["-date_joined"]
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return self.email

    @property
    def display_name(self):
        """Human-friendly name, falls back to email prefix."""
        return self.full_name or self.email.split("@")[0]

class EmailChangeRequest(models.Model):
    """
    Pending email change. Short server-stored code, single-use, expires in 24h.

    Why a DB row instead of a signed token in the URL?
    - Long tokens wrap in terminals and become uncopyable in dev.
    - Real products use short codes for the same reason.
    - We can revoke or mark used — signed tokens are unrevocable.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="email_change_requests",
    )
    new_email = models.EmailField()
    code = models.CharField(max_length=32, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "accounts_email_change_request"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["code"]),
            models.Index(fields=["user", "used_at"]),
        ]

    def __str__(self):
        return f"{self.user.email} -> {self.new_email} ({self.code})"

    @property
    def is_valid(self):
        from django.utils import timezone
        return self.used_at is None and self.expires_at > timezone.now()
