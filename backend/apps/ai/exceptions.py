"""AI-specific exceptions. All handled by the AI service layer."""


class AIError(Exception):
    """Base class for all AI failures."""


class AIProviderError(AIError):
    """Provider returned an error (5xx, network, bad credentials)."""


class AITimeoutError(AIError):
    """Provider did not respond within the configured timeout."""


class AIRateLimitError(AIError):
    """Provider returned 429, or user is over our own rate limit."""


class AIValidationError(AIError):
    """Provider returned malformed output that does not match the schema."""


class AIQuotaExceededError(AIError):
    """User has exhausted their hourly AI quota."""

    def __init__(self, message, reset_at=None):
        super().__init__(message)
        self.reset_at = reset_at
