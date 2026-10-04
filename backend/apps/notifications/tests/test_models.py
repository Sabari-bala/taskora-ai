"""Tests for Notification model."""
import pytest

from apps.accounts.models import User
from apps.notifications.models import Notification


@pytest.fixture
def user(db):
    return User.objects.create_user(email="user@example.com", password="x")


@pytest.fixture
def actor(db):
    return User.objects.create_user(email="actor@example.com", password="x")


@pytest.mark.django_db
class TestNotification:
    def test_create_notification(self, user, actor):
        n = Notification.objects.create(
            recipient=user,
            actor=actor,
            verb=Notification.Verb.TASK_ASSIGNED,
            target_type="task",
        )
        assert n.is_read is False
        assert n.recipient == user
        assert n.actor == actor

    def test_default_is_unread(self, user):
        n = Notification.objects.create(
            recipient=user, verb=Notification.Verb.TASK_COMMENTED
        )
        assert n.is_read is False

    def test_mark_as_read(self, user):
        n = Notification.objects.create(
            recipient=user, verb=Notification.Verb.TASK_COMMENTED
        )
        n.is_read = True
        n.save()
        n.refresh_from_db()
        assert n.is_read is True

    def test_actor_can_be_null(self, user):
        n = Notification.objects.create(
            recipient=user, verb=Notification.Verb.DUE_DATE_APPROACHING
        )
        assert n.actor is None

    def test_recipient_delete_cascades(self, user):
        Notification.objects.create(
            recipient=user, verb=Notification.Verb.TASK_COMMENTED
        )
        assert Notification.objects.count() == 1
        user.delete()
        assert Notification.objects.count() == 0

    def test_ordering_newest_first(self, user):
        n1 = Notification.objects.create(
            recipient=user, verb=Notification.Verb.TASK_COMMENTED
        )
        n2 = Notification.objects.create(
            recipient=user, verb=Notification.Verb.TASK_ASSIGNED
        )
        result = list(user.notifications.all())
        assert result[0] == n2
        assert result[1] == n1

    def test_str_shows_read_status(self, user):
        n = Notification.objects.create(
            recipient=user, verb=Notification.Verb.TASK_COMMENTED
        )
        assert "[unread]" in str(n)
        n.is_read = True
        n.save()
        assert "[read]" in str(n)
