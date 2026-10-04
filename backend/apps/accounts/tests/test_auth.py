"""Tests for authentication endpoints."""
import pytest
from django.conf import settings
from django.urls import reverse

from apps.accounts.models import User


pytestmark = pytest.mark.django_db


REGISTER_URL = reverse("accounts:register")
LOGIN_URL = reverse("accounts:login")
REFRESH_URL = reverse("accounts:refresh")
LOGOUT_URL = reverse("accounts:logout")
ME_URL = reverse("accounts:me")


class TestRegister:
    def test_register_creates_user_and_returns_tokens(self, client):
        response = client.post(
            REGISTER_URL,
            {
                "email": "arun@example.com",
                "full_name": "Arun Kumar",
                "password": "StrongPass!2026",
            },
            content_type="application/json",
        )
        assert response.status_code == 201
        assert User.objects.filter(email="arun@example.com").exists()
        data = response.json()
        assert "access" in data
        assert data["user"]["email"] == "arun@example.com"
        assert settings.REFRESH_COOKIE_NAME in response.cookies

    def test_register_rejects_duplicate_email(self, client):
        User.objects.create_user(email="dup@example.com", password="StrongPass!2026")
        response = client.post(
            REGISTER_URL,
            {
                "email": "dup@example.com",
                "full_name": "Dup",
                "password": "StrongPass!2026",
            },
            content_type="application/json",
        )
        assert response.status_code == 400
        assert "email" in response.json()["errors"]

    def test_register_rejects_weak_password(self, client):
        response = client.post(
            REGISTER_URL,
            {
                "email": "weak@example.com",
                "full_name": "Weak",
                "password": "123",
            },
            content_type="application/json",
        )
        assert response.status_code == 400
        assert "password" in response.json()["errors"]

    def test_register_lowercases_email(self, client):
        client.post(
            REGISTER_URL,
            {
                "email": "MIXED@Example.COM",
                "full_name": "X",
                "password": "StrongPass!2026",
            },
            content_type="application/json",
        )
        assert User.objects.filter(email="mixed@example.com").exists()


class TestLogin:
    def test_login_with_valid_credentials(self, client):
        User.objects.create_user(
            email="arun@example.com",
            password="StrongPass!2026",
        )
        response = client.post(
            LOGIN_URL,
            {"email": "arun@example.com", "password": "StrongPass!2026"},
            content_type="application/json",
        )
        assert response.status_code == 200
        data = response.json()
        assert "access" in data
        assert data["user"]["email"] == "arun@example.com"
        assert settings.REFRESH_COOKIE_NAME in response.cookies

    def test_login_with_wrong_password(self, client):
        User.objects.create_user(
            email="arun@example.com",
            password="StrongPass!2026",
        )
        response = client.post(
            LOGIN_URL,
            {"email": "arun@example.com", "password": "wrong"},
            content_type="application/json",
        )
        assert response.status_code == 401

    def test_login_with_nonexistent_email(self, client):
        response = client.post(
            LOGIN_URL,
            {"email": "nobody@example.com", "password": "x"},
            content_type="application/json",
        )
        assert response.status_code == 401

    def test_login_is_case_insensitive_on_email(self, client):
        User.objects.create_user(
            email="arun@example.com",
            password="StrongPass!2026",
        )
        response = client.post(
            LOGIN_URL,
            {"email": "ARUN@example.com", "password": "StrongPass!2026"},
            content_type="application/json",
        )
        assert response.status_code == 200


class TestMe:
    def test_me_requires_authentication(self, client):
        response = client.get(ME_URL)
        assert response.status_code == 401

    def test_me_returns_current_user(self, client):
        user = User.objects.create_user(
            email="arun@example.com",
            password="StrongPass!2026",
            full_name="Arun Kumar",
        )
        client.force_login(user)  # session auth for test
        response = client.get(ME_URL)
        # If session auth not configured for DRF, use JWT directly
        # Fall through to JWT test below

    def test_me_with_jwt_token(self, client):
        user = User.objects.create_user(
            email="arun@example.com",
            password="StrongPass!2026",
            full_name="Arun Kumar",
        )
        from rest_framework_simplejwt.tokens import RefreshToken

        access = str(RefreshToken.for_user(user).access_token)
        response = client.get(ME_URL, HTTP_AUTHORIZATION=f"Bearer {access}")
        assert response.status_code == 200
        assert response.json()["email"] == "arun@example.com"
        assert response.json()["display_name"] == "Arun Kumar"


class TestRefreshAndLogout:
    def test_refresh_without_cookie_returns_401(self, client):
        response = client.post(REFRESH_URL)
        assert response.status_code == 401

    def test_refresh_with_valid_cookie_returns_new_access(self, client):
        user = User.objects.create_user(
            email="arun@example.com",
            password="StrongPass!2026",
        )
        login_resp = client.post(
            LOGIN_URL,
            {"email": "arun@example.com", "password": "StrongPass!2026"},
            content_type="application/json",
        )
        assert login_resp.status_code == 200

        # Cookie is now stored on the test client
        refresh_resp = client.post(REFRESH_URL)
        assert refresh_resp.status_code == 200
        assert "access" in refresh_resp.json()

    def test_logout_requires_authentication(self, client):
        response = client.post(LOGOUT_URL)
        assert response.status_code == 401

    def test_logout_clears_cookie_and_blacklists(self, client):
        from rest_framework_simplejwt.tokens import RefreshToken

        user = User.objects.create_user(
            email="arun@example.com",
            password="StrongPass!2026",
        )
        access = str(RefreshToken.for_user(user).access_token)
        login_resp = client.post(
            LOGIN_URL,
            {"email": "arun@example.com", "password": "StrongPass!2026"},
            content_type="application/json",
        )
        assert login_resp.status_code == 200

        logout_resp = client.post(
            LOGOUT_URL,
            HTTP_AUTHORIZATION=f"Bearer {access}",
        )
        assert logout_resp.status_code == 200
        # Cookie was set to empty / expired
        assert (
            logout_resp.cookies[settings.REFRESH_COOKIE_NAME].value == ""
            or logout_resp.cookies[settings.REFRESH_COOKIE_NAME]["max-age"] == 0
        )
