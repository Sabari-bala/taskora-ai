"""Tests for AIInteraction model."""
import pytest

from apps.accounts.models import User
from apps.ai.models import AIInteraction


@pytest.fixture
def user(db):
    return User.objects.create_user(email="user@example.com", password="x")


@pytest.mark.django_db
class TestAIInteraction:
    def test_create_success_interaction(self, user):
        interaction = AIInteraction.objects.create(
            user=user,
            feature=AIInteraction.Feature.PLAN_PROJECT,
            status=AIInteraction.Status.SUCCESS,
            provider="groq",
            model_name="llama-3.3-70b",
            prompt_tokens=500,
            completion_tokens=1200,
            latency_ms=3400,
        )
        assert interaction.total_tokens == 1700
        assert interaction.status == AIInteraction.Status.SUCCESS

    def test_failed_interaction_with_error(self, user):
        interaction = AIInteraction.objects.create(
            user=user,
            feature=AIInteraction.Feature.SUMMARIZE_TASK,
            status=AIInteraction.Status.TIMEOUT,
            error_message="Request timed out after 20s",
        )
        assert interaction.status == AIInteraction.Status.TIMEOUT
        assert "timed out" in interaction.error_message

    def test_total_tokens_sums_both_fields(self, user):
        interaction = AIInteraction.objects.create(
            user=user,
            feature=AIInteraction.Feature.PROJECT_INSIGHTS,
            status=AIInteraction.Status.SUCCESS,
            prompt_tokens=100,
            completion_tokens=250,
        )
        assert interaction.total_tokens == 350

    def test_user_delete_sets_null(self, user):
        interaction = AIInteraction.objects.create(
            user=user,
            feature=AIInteraction.Feature.PLAN_PROJECT,
            status=AIInteraction.Status.SUCCESS,
        )
        user.delete()
        interaction.refresh_from_db()
        assert interaction.user is None

    def test_ordering_newest_first(self, user):
        a = AIInteraction.objects.create(
            user=user,
            feature=AIInteraction.Feature.PLAN_PROJECT,
            status=AIInteraction.Status.SUCCESS,
        )
        b = AIInteraction.objects.create(
            user=user,
            feature=AIInteraction.Feature.PLAN_PROJECT,
            status=AIInteraction.Status.SUCCESS,
        )
        result = list(AIInteraction.objects.all())
        assert result[0] == b
        assert result[1] == a
