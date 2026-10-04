"""
AI service layer — the only place that talks to providers.

Every AI feature flows through `call_ai()`. That function:
  1. Enforces per-user hourly quota (backed by AIInteraction rows)
  2. Calls the provider with a timeout
  3. Retries ONCE on timeout / 5xx
  4. Parses and validates the JSON against a schema
  5. Logs an AIInteraction row with tokens, latency, status
  6. Returns the validated dict to the caller

The caller NEVER sees raw text. It receives either a dict that matches
the schema, or a raised AIError subclass.
"""
import time
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from .exceptions import (
    AIError,
    AIProviderError,
    AIQuotaExceededError,
    AIRateLimitError,
    AITimeoutError,
    AIValidationError,
)
from .models import AIInteraction
from .providers import get_provider
from .validation import parse_and_validate


DEFAULT_TIMEOUT = 20
DEFAULT_HOURLY_LIMIT = 30


def _hourly_limit() -> int:
    return int(getattr(settings, "AI_RATE_LIMIT_PER_HOUR", DEFAULT_HOURLY_LIMIT))


def _check_quota(user):
    if user is None or not user.is_authenticated:
        return
    window_start = timezone.now() - timedelta(hours=1)
    count = AIInteraction.objects.filter(
        user=user, created_at__gte=window_start,
    ).count()
    if count >= _hourly_limit():
        raise AIQuotaExceededError(
            f"You have used all {_hourly_limit()} AI requests this hour. "
            "Try again later."
        )


def _log(*, user, workspace, feature, status, provider_name="", model="",
         prompt_tokens=0, completion_tokens=0, latency_ms=0, error=""):
    return AIInteraction.objects.create(
        user=user if (user and user.is_authenticated) else None,
        workspace=workspace,
        feature=feature,
        status=status,
        provider=provider_name,
        model_name=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        latency_ms=latency_ms,
        error_message=error,
    )


def call_ai(
    *,
    feature: str,
    system_prompt: str,
    user_prompt: str,
    schema: dict,
    user=None,
    workspace=None,
    timeout: int = DEFAULT_TIMEOUT,
    provider=None,
) -> dict:
    """
    The one gateway. Returns a schema-validated dict, or raises AIError.
    """
    _check_quota(user)

    if provider is None:
        try:
            provider = get_provider()
        except AIError as exc:
            _log(user=user, workspace=workspace, feature=feature,
                 status=AIInteraction.Status.FAILED, error=str(exc))
            raise

    provider_name = provider.__class__.__name__
    model = getattr(provider, "model", "")

    attempt = 0
    last_exc: Exception | None = None

    while attempt < 2:
        attempt += 1
        started = time.monotonic()
        try:
            result = provider.complete(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                json_mode=True,
                timeout=timeout,
            )
        except AITimeoutError as exc:
            last_exc = exc
            if attempt == 1:
                continue  # retry once
            latency_ms = int((time.monotonic() - started) * 1000)
            _log(user=user, workspace=workspace, feature=feature,
                 status=AIInteraction.Status.TIMEOUT,
                 provider_name=provider_name, model=model,
                 latency_ms=latency_ms, error=str(exc))
            raise
        except AIRateLimitError as exc:
            latency_ms = int((time.monotonic() - started) * 1000)
            _log(user=user, workspace=workspace, feature=feature,
                 status=AIInteraction.Status.FAILED,
                 provider_name=provider_name, model=model,
                 latency_ms=latency_ms, error=str(exc))
            raise
        except AIProviderError as exc:
            last_exc = exc
            if attempt == 1:
                continue  # retry once
            latency_ms = int((time.monotonic() - started) * 1000)
            _log(user=user, workspace=workspace, feature=feature,
                 status=AIInteraction.Status.FAILED,
                 provider_name=provider_name, model=model,
                 latency_ms=latency_ms, error=str(exc))
            raise

        latency_ms = int((time.monotonic() - started) * 1000)

        # ── Validate ─────────────────────────────
        try:
            validated = parse_and_validate(result["text"], schema)
        except AIValidationError as exc:
            _log(user=user, workspace=workspace, feature=feature,
                 status=AIInteraction.Status.VALIDATION_ERROR,
                 provider_name=provider_name, model=result.get("model", model),
                 prompt_tokens=result.get("prompt_tokens", 0),
                 completion_tokens=result.get("completion_tokens", 0),
                 latency_ms=latency_ms, error=str(exc))
            raise

        # ── Success ──────────────────────────────
        _log(user=user, workspace=workspace, feature=feature,
             status=AIInteraction.Status.SUCCESS,
             provider_name=provider_name, model=result.get("model", model),
             prompt_tokens=result.get("prompt_tokens", 0),
             completion_tokens=result.get("completion_tokens", 0),
             latency_ms=latency_ms)
        return validated

    # Should be unreachable, but keeps mypy happy
    raise AIProviderError(str(last_exc) if last_exc else "Unknown AI failure")
