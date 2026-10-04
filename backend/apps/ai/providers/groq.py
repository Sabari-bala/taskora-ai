"""
Groq provider — OpenAI-compatible chat completions.
Docs: https://console.groq.com/docs/openai
"""
import httpx
from django.conf import settings

from ..exceptions import AIProviderError, AIRateLimitError, AITimeoutError
from .base import AIProvider


GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


class GroqProvider(AIProvider):

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model = model or getattr(
            settings, "GROQ_MODEL", "llama-3.3-70b-versatile"
        )
        if not self.api_key:
            raise AIProviderError(
                "GROQ_API_KEY is not configured. "
                "Set it in .env or switch AI_PROVIDER."
            )

    def complete(self, *, system_prompt, user_prompt, json_mode=True, timeout=20):
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.7,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            response = httpx.post(
                GROQ_URL,
                json=payload,
                headers=headers,
                timeout=timeout,
            )
        except httpx.TimeoutException as exc:
            raise AITimeoutError(f"Groq request timed out after {timeout}s") from exc
        except httpx.RequestError as exc:
            raise AIProviderError(f"Groq request failed: {exc}") from exc

        if response.status_code == 429:
            raise AIRateLimitError("Groq rate limit hit")
        if response.status_code >= 400:
            raise AIProviderError(
                f"Groq returned {response.status_code}: {response.text[:200]}"
            )

        data = response.json()
        try:
            text = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as exc:
            raise AIProviderError(f"Unexpected Groq response shape: {exc}") from exc

        usage = data.get("usage", {})
        return {
            "text": text,
            "prompt_tokens": usage.get("prompt_tokens", 0),
            "completion_tokens": usage.get("completion_tokens", 0),
            "model": data.get("model", self.model),
        }
