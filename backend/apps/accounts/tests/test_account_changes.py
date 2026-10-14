"""Tests for password change and email change flows."""
import pytest
from django.core import mail
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.accounts.tokens import (
    make_email_change_token,
    read_email_change_token,
)


pytestmark = pytest.mark.django_db


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def user():
    return User.objects.create_user(
        email="owner@example.com",
        password="StrongPass!2026",
        full_name="Owner",
    )


@pytest.fixture
def auth(api, user):
    token = str(RefreshToken.for_user(user).access_token)
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return api


CHANGE_PASSWORD_URL = reverse("accounts:change-password")
CHANGE_EMAIL_URL = reverse("accounts:change-email")
VERIFY_EMAIL_URL = reverse("accounts:verify-email-change")


class TestPasswordChange:

    def test_requires_auth(self, api):
        response = api.post(CHANGE_PASSWORD_URL, {}, format="json")
        assert response.status_code == 401

    def test_change_password_success(self, auth, user):
        response = auth.post(
            CHANGE_PASSWORD_URL,
            {
                "old_password": "StrongPass!2026",
                "new_password": "EvenStronger!2026",
            },
            format="json",
        )
        assert response.status_code == 200, response.json()
        user.refresh_from_db()
        assert user.check_password("EvenStronger!2026")
        assert not user.check_password("StrongPass!2026")

    def test_wrong_old_password(self, auth, user):
        response = auth.post(
            CHANGE_PASSWORD_URL,
            {
                "old_password": "WrongPass!2026",
                "new_password": "EvenStronger!2026",
            },
            format="json",
        )
        assert response.status_code == 400
        user.refresh_from_db()
        assert user.check_password("StrongPass!2026")  # unchanged

    def test_same_password_rejected(self, auth):
        response = auth.post(
            CHANGE_PASSWORD_URL,
            {
                "old_password": "StrongPass!2026",
                "new_password": "StrongPass!2026",
            },
            format="json",
        )
        assert response.status_code == 400

    def test_weak_password_rejected(self, auth):
        response = auth.post(
            CHANGE_PASSWORD_URL,
            {
                "old_password": "StrongPass!2026",
                "new_password": "short",
            },
            format="json",
        )
        assert response.status_code == 400


class TestEmailChangeRequest:

    def test_requires_auth(self, api):
        response = api.post(CHANGE_EMAIL_URL, {"new_email": "x@y.com"}, format="json")
        assert response.status_code == 401

    def test_sends_verification_email(self, auth, user):
        mail.outbox = []
        response = auth.post(
            CHANGE_EMAIL_URL,
            {"new_email": "newowner@example.com"},
            format="json",
        )
        assert response.status_code == 200, response.json()
        assert len(mail.outbox) == 1
        assert "newowner@example.com" in mail.outbox[0].to
        assert "/verify-email-change?token=" in mail.outbox[0].body

    def test_rejects_duplicate_email(self, auth, user):
        User.objects.create_user(email="taken@example.com", password="x")
        response = auth.post(
            CHANGE_EMAIL_URL,
            {"new_email": "taken@example.com"},
            format="json",
        )
        assert response.status_code == 400

    def test_rejects_same_email(self, auth, user):
        response = auth.post(
            CHANGE_EMAIL_URL,
            {"new_email": user.email},
            format="json",
        )
        assert response.status_code == 400


class TestEmailChangeVerify:

    def test_verify_success(self, api, user):
        token = make_email_change_token(user, "brandnew@example.com")
        response = api.post(
            VERIFY_EMAIL_URL,
            {"token": token},
            format="json",
        )
        assert response.status_code == 200, response.json()
        user.refresh_from_db()
        assert user.email == "brandnew@example.com"

    def test_verify_invalid_token(self, api, user):
        response = api.post(
            VERIFY_EMAIL_URL,
            {"token": "not-a-real-token"},
            format="json",
        )
        assert response.status_code == 400
        user.refresh_from_db()
        assert user.email == "owner@example.com"  # unchanged

    def test_verify_duplicate_now_taken(self, api, user):
        User.objects.create_user(email="grabbed@example.com", password="x")
        token = make_email_change_token(user, "grabbed@example.com")
        response = api.post(
            VERIFY_EMAIL_URL,
            {"token": token},
            format="json",
        )
        assert response.status_code == 400

    def test_token_roundtrip(self, user):
        token = make_email_change_token(user, "x@example.com")
        data = read_email_change_token(token)
        assert data["user_id"] == str(user.id)
        assert data["new_email"] == "x@example.com"
