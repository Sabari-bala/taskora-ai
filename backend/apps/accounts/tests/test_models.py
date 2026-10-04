"""Tests for the custom User model."""
import pytest
from django.db import IntegrityError

from apps.accounts.models import User


@pytest.mark.django_db
class TestUserModel:
    def test_create_user_with_email(self):
        user = User.objects.create_user(
            email="arun@example.com",
            password="testpass123",
            full_name="Arun Kumar",
        )
        assert user.email == "arun@example.com"
        assert user.full_name == "Arun Kumar"
        assert user.check_password("testpass123")
        assert user.is_active is True
        assert user.is_staff is False
        assert user.is_superuser is False

    def test_create_superuser(self):
        user = User.objects.create_superuser(
            email="admin@example.com",
            password="adminpass123",
        )
        assert user.is_staff is True
        assert user.is_superuser is True

    def test_email_is_required(self):
        with pytest.raises(ValueError, match="email address is required"):
            User.objects.create_user(email="", password="x")

    def test_email_must_be_unique(self):
        User.objects.create_user(email="dup@example.com", password="x")
        with pytest.raises(IntegrityError):
            User.objects.create_user(email="dup@example.com", password="y")

    def test_display_name_uses_full_name_when_set(self):
        user = User.objects.create_user(
            email="arun@example.com", password="x", full_name="Arun Kumar"
        )
        assert user.display_name == "Arun Kumar"

    def test_display_name_falls_back_to_email_prefix(self):
        user = User.objects.create_user(email="arun@example.com", password="x")
        assert user.display_name == "arun"

    def test_str_returns_email(self):
        user = User.objects.create_user(email="arun@example.com", password="x")
        assert str(user) == "arun@example.com"