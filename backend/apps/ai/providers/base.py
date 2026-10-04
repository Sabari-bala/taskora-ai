"""
Abstract base for AI providers.

Every provider returns a normalised dict:

    {
        'text': str,                    # raw text (usually JSON)
        'prompt_tokens': int,
        'completion_tokens': int,
        'model': str,
    }

Concrete providers translate their vendor's shape into this.
"""
from abc import ABC, abstractmethod


class AIProvider(ABC):

    @abstractmethod
    def complete(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        json_mode: bool = True,
        timeout: int = 20,
    ) -> dict:
        """
        Send a request and return a normalised response dict.

        Implementations MUST raise:
            AIProviderError — on 4xx/5xx or network failure
            AITimeoutError — on timeout
            AIRateLimitError — on 429
        """
        raise NotImplementedError
