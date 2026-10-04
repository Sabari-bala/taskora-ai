"""Tests for the AI foundation.

These tests NEVER call a real provider. They use a FakeProvider that returns
canned responses. This means:
- Tests run in milliseconds
- No API key is required
- We can deterministically trigger every failure mode
"""
import json

import pytest

from apps.accounts.models import User
from apps.ai.exceptions import (
    AIProviderError,
    AIQuotaExceededError,
    AITimeoutError,
    AIValidationError,
)
from apps.ai.models import AIInteraction
from apps.ai.providers.base import AIProvider
from apps.ai.services import call_ai
from apps.ai.validation import parse_and_validate


pytestmark = pytest.mark.django_db


class FakeProvider(AIProvider):
    """Returns configured responses in order. Records calls."""

    def __init__(self, responses=None, model="fake-1"):
        self.responses = list(responses or [])
        self.model = model
        self.calls = []

    def complete(self, *, system_prompt, user_prompt, json_mode=True, timeout=20):
        self.calls.append({
            "system_prompt": system_prompt,
            "user_prompt": user_prompt,
        })
        if not self.responses:
            raise AIProviderError("FakeProvider ran out of responses")
        item = self.responses.pop(0)
        if isinstance(item, Exception):
            raise item
        return {
            "text": item if isinstance(item, str) else json.dumps(item),
            "prompt_tokens": 100,
            "completion_tokens": 200,
            "model": self.model,
        }


SCHEMA = {
    "type": "object",
    "required": ["name"],
    "properties": {"name": {"type": "string"}},
}


@pytest.fixture
def user():
    return User.objects.create_user(email="user@example.com", password="x")


class TestParseAndValidate:

    def test_valid_json(self):
        assert parse_and_validate('{"name": "ok"}', SCHEMA) == {"name": "ok"}

    def test_strips_code_fences(self):
        raw = "```json\n{\"name\": \"ok\"}\n```"
        assert parse_and_validate(raw, SCHEMA) == {"name": "ok"}

    def test_extracts_json_from_prose(self):
        raw = 'Sure! Here is the plan:\n{"name": "ok"}\nHope this helps.'
        assert parse_and_validate(raw, SCHEMA) == {"name": "ok"}

    def test_invalid_json_raises(self):
        with pytest.raises(AIValidationError):
            parse_and_validate("not json at all", SCHEMA)

    def test_schema_mismatch_raises(self):
        with pytest.raises(AIValidationError):
            parse_and_validate('{"wrong": "field"}', SCHEMA)

    def test_empty_string_raises(self):
        with pytest.raises(AIValidationError):
            parse_and_validate("", SCHEMA)


class TestCallAI:

    def test_success_logs_interaction(self, user):
        provider = FakeProvider(responses=[{"name": "hello"}])
        result = call_ai(
            feature=AIInteraction.Feature.PLAN_PROJECT,
            system_prompt="sys",
            user_prompt="usr",
            schema=SCHEMA,
            user=user,
            provider=provider,
        )
        assert result == {"name": "hello"}

        log = AIInteraction.objects.get(user=user)
        assert log.status == AIInteraction.Status.SUCCESS
        assert log.prompt_tokens == 100
        assert log.completion_tokens == 200
        assert log.total_tokens == 300

    def test_validation_error_logs_and_raises(self, user):
        provider = FakeProvider(responses=["not valid json"])
        with pytest.raises(AIValidationError):
            call_ai(
                feature=AIInteraction.Feature.PLAN_PROJECT,
                system_prompt="sys",
                user_prompt="usr",
                schema=SCHEMA,
                user=user,
                provider=provider,
            )
        log = AIInteraction.objects.get(user=user)
        assert log.status == AIInteraction.Status.VALIDATION_ERROR

    def test_timeout_retries_once(self, user):
        provider = FakeProvider(
            responses=[AITimeoutError("took too long"), {"name": "recovered"}]
        )
        result = call_ai(
            feature=AIInteraction.Feature.PLAN_PROJECT,
            system_prompt="sys",
            user_prompt="usr",
            schema=SCHEMA,
            user=user,
            provider=provider,
        )
        assert result == {"name": "recovered"}
        assert len(provider.calls) == 2

    def test_timeout_twice_logs_timeout(self, user):
        provider = FakeProvider(
            responses=[AITimeoutError("first"), AITimeoutError("second")]
        )
        with pytest.raises(AITimeoutError):
            call_ai(
                feature=AIInteraction.Feature.PLAN_PROJECT,
                system_prompt="sys",
                user_prompt="usr",
                schema=SCHEMA,
                user=user,
                provider=provider,
            )
        log = AIInteraction.objects.get(user=user)
        assert log.status == AIInteraction.Status.TIMEOUT

    def test_provider_error_retries_once(self, user):
        provider = FakeProvider(
            responses=[AIProviderError("500"), {"name": "ok-now"}]
        )
        result = call_ai(
            feature=AIInteraction.Feature.PLAN_PROJECT,
            system_prompt="sys",
            user_prompt="usr",
            schema=SCHEMA,
            user=user,
            provider=provider,
        )
        assert result == {"name": "ok-now"}

    def test_quota_exceeded(self, user):
        for _ in range(30):
            AIInteraction.objects.create(
                user=user,
                feature=AIInteraction.Feature.PLAN_PROJECT,
                status=AIInteraction.Status.SUCCESS,
            )
        provider = FakeProvider(responses=[{"name": "x"}])
        with pytest.raises(AIQuotaExceededError):
            call_ai(
                feature=AIInteraction.Feature.PLAN_PROJECT,
                system_prompt="sys",
                user_prompt="usr",
                schema=SCHEMA,
                user=user,
                provider=provider,
            )
