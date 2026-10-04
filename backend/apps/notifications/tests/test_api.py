"""Tests for notifications API."""
import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.notifications.models import Notification


pytestmark = pytest.mark.django_db


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def user():
    return User.objects.create_user(email="user@example.com", password="x")


@pytest.fixture
def other_user():
    return User.objects.create_user(email="other@example.com", password="x")


@pytest.fixture
def auth(api, user):
    access = str(RefreshToken.for_user(user).access_token)
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    return api


def _n(user, verb=Notification.Verb.TASK_COMMENTED, is_read=False):
    return Notification.objects.create(
        recipient=user, verb=verb, is_read=is_read
    )


class TestNotificationList:

    def test_list_only_own_notifications(self, auth, user, other_user):
        _n(user)
        _n(user)
        _n(other_user)

        response = auth.get("/api/v1/notifications/")
        assert response.status_code == 200
        assert response.json()["count"] == 2

    def test_filter_unread(self, auth, user):
        _n(user, is_read=False)
        _n(user, is_read=True)

        response = auth.get("/api/v1/notifications/?unread=true")
        assert response.json()["count"] == 1

    def test_requires_auth(self, api):
        response = api.get("/api/v1/notifications/")
        assert response.status_code == 401


class TestMarkRead:

    def test_mark_single_as_read(self, auth, user):
        n = _n(user, is_read=False)
        response = auth.post(f"/api/v1/notifications/{n.id}/read/")
        assert response.status_code == 200
        n.refresh_from_db()
        assert n.is_read is True

    def test_cannot_mark_others_as_read(self, api, other_user, user):
        n = _n(other_user)
        access = str(RefreshToken.for_user(user).access_token)
        api.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        response = api.post(f"/api/v1/notifications/{n.id}/read/")
        assert response.status_code == 404

    def test_mark_all_read(self, auth, user):
        _n(user, is_read=False)
        _n(user, is_read=False)
        _n(user, is_read=True)

        response = auth.post("/api/v1/notifications/read-all/")
        assert response.status_code == 200
        assert response.json()["updated"] == 2

        assert Notification.objects.filter(
            recipient=user, is_read=False
        ).count() == 0

    def test_mark_all_does_not_affect_others(self, auth, user, other_user):
        _n(user, is_read=False)
        _n(other_user, is_read=False)

        auth.post("/api/v1/notifications/read-all/")

        assert Notification.objects.filter(
            recipient=other_user, is_read=False
        ).count() == 1


class TestUnreadCount:

    def test_unread_count_reflects_own_notifications(self, auth, user, other_user):
        _n(user, is_read=False)
        _n(user, is_read=False)
        _n(user, is_read=True)
        _n(other_user, is_read=False)

        response = auth.get("/api/v1/notifications/unread-count/")
        assert response.status_code == 200
        assert response.json()["unread_count"] == 2

    def test_unread_count_zero_when_empty(self, auth):
        response = auth.get("/api/v1/notifications/unread-count/")
        assert response.json()["unread_count"] == 0
