"""Provider factory — reads AI_PROVIDER from settings and returns an instance."""
from django.conf import settings

from ..exceptions import AIProviderError
from .groq import GroqProvider


def get_provider() -> "AIProvider":
    name = (getattr(settings, "AI_PROVIDER", "groq") or "groq").lower()

    if name == "groq":
        return GroqProvider()

    # Placeholders for other providers — implement when needed
    raise AIProviderError(
        f"AI provider '{name}' is not implemented. "
        "Supported: groq. Add others as the project grows."
    )
