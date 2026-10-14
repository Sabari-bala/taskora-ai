"""Tests for password change and email change flows."""
from datetime import timedelta

import pytest
from django.core import mail
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import EmailChangeRequest, User


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

    def test_wrong_old_password(self, auth, user):
        response = auth.post(
            CHANGE_PASSWORD_URL,
            {"old_password": "Wrong!2026", "new_password": "EvenStronger!2026"},
            format="json",
        )
        assert response.status_code == 400
        user.refresh_from_db()
        assert user.check_password("StrongPass!2026")

    def test_same_password_rejected(self, auth):
        response = auth.post(
            CHANGE_PASSWORD_URL,
            {"old_password": "StrongPass!2026", "new_password": "StrongPass!2026"},
            format="json",
        )
        assert response.status_code == 400

    def test_weak_password_rejected(self, auth):
        response = auth.post(
            CHANGE_PASSWORD_URL,
            {"old_password": "StrongPass!2026", "new_password": "short"},
            format="json",
        )
        assert response.status_code == 400


class TestEmailChangeRequest:

    def test_requires_auth(self, api):
        response = api.post(CHANGE_EMAIL_URL, {"new_email": "x@y.com"}, format="json")
        assert response.status_code == 401

    def test_creates_request_and_sends_email(self, auth, user):
        mail.outbox = []
        response = auth.post(
            CHANGE_EMAIL_URL,
            {"new_email": "newowner@example.com"},
            format="json",
        )
        assert response.status_code == 200, response.json()
        assert EmailChangeRequest.objects.filter(user=user).count() == 1

        req = EmailChangeRequest.objects.get(user=user)
        assert len(req.code) == 12  # hex(6) = 12 chars
        assert req.used_at is None
        assert req.expires_at > timezone.now()

        # Email was sent to the NEW address
        assert len(mail.outbox) == 1
        assert "newowner@example.com" in mail.outbox[0].to
        assert f"/verify-email-change?code={req.code}" in mail.outbox[0].body

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

    def test_new_request_invalidates_old(self, auth, user):
        auth.post(CHANGE_EMAIL_URL, {"new_email": "first@example.com"}, format="json")
        auth.post(CHANGE_EMAIL_URL, {"new_email": "second@example.com"}, format="json")

        pending = EmailChangeRequest.objects.filter(user=user, used_at__isnull=True)
        assert pending.count() == 1
        assert pending.first().new_email == "second@example.com"


class TestEmailChangeVerify:

    def _make_request(self, user, new_email="brandnew@example.com", **overrides):
        import secrets
        return EmailChangeRequest.objects.create(
            user=user,
            new_email=new_email,
            code=overrides.get("code", secrets.token_hex(6)),
            expires_at=overrides.get(
                "expires_at", timezone.now() + timedelta(hours=24)
            ),
            used_at=overrides.get("used_at", None),
        )

    def test_verify_success(self, api, user):
        req = self._make_request(user)
        response = api.post(VERIFY_EMAIL_URL, {"code": req.code}, format="json")
        assert response.status_code == 200, response.json()
        user.refresh_from_db()
        assert user.email == "brandnew@example.com"
        req.refresh_from_db()
        assert req.used_at is not None

    def test_verify_invalid_code(self, api, user):
        response = api.post(
            VERIFY_EMAIL_URL, {"code": "deadbeef1234"}, format="json"
        )
        assert response.status_code == 400
        user.refresh_from_db()
        assert user.email == "owner@example.com"

    def test_verify_already_used(self, api, user):
        req = self._make_request(user, used_at=timezone.now())
        response = api.post(VERIFY_EMAIL_URL, {"code": req.code}, format="json")
        assert response.status_code == 400

    def test_verify_expired(self, api, user):
        req = self._make_request(
            user, expires_at=timezone.now() - timedelta(hours=1)
        )
        response = api.post(VERIFY_EMAIL_URL, {"code": req.code}, format="json")
        assert response.status_code == 400

    def test_verify_email_now_taken(self, api, user):
        User.objects.create_user(email="grabbed@example.com", password="x")
        req = self._make_request(user, new_email="grabbed@example.com")
        response = api.post(VERIFY_EMAIL_URL, {"code": req.code}, format="json")
        assert response.status_code == 400
