"""LLM service abstraction — Gemini by default, swappable to OpenAI."""

import asyncio
import hashlib
import re
import time
from abc import ABC, abstractmethod

import google.generativeai as genai
from google.api_core import exceptions as google_exceptions

from app.config import settings


_SHARED_LLM_CACHE: dict[str, tuple[float, str]] = {}


class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str) -> str:
        """Generate text completion from prompt."""


class GeminiProvider(LLMProvider):
    MAX_RETRIES = 5
    BASE_DELAY_SECONDS = 2.0
    CACHE_TTL_SECONDS = 600

    def __init__(self) -> None:
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel(settings.gemini_model)
        self._semaphore = asyncio.Semaphore(5)

    def _cache_key(self, prompt: str) -> str:
        return hashlib.sha256(prompt.strip().encode("utf-8")).hexdigest()

    async def generate(self, prompt: str) -> str:
        cache_key = self._cache_key(prompt)
        now = time.time()
        if cache_key in _SHARED_LLM_CACHE:
            ts, val = _SHARED_LLM_CACHE[cache_key]
            if now - ts < self.CACHE_TTL_SECONDS:
                return val

        last_error: Exception | None = None

        for attempt in range(self.MAX_RETRIES):
            try:
                async with self._semaphore:
                    response = await self.model.generate_content_async(
                        prompt,
                        generation_config={"temperature": 0.1},
                    )
                    text = response.text or ""
                    _SHARED_LLM_CACHE[cache_key] = (now, text)
                    return text
            except google_exceptions.ResourceExhausted as exc:
                last_error = exc
                delay = self._retry_delay_seconds(str(exc), attempt)
                await asyncio.sleep(delay)
            except Exception as exc:
                last_error = exc
                await asyncio.sleep(1.0 + attempt * 0.5)

        if last_error is not None:
            raise last_error
        return ""

    def _retry_delay_seconds(self, message: str, attempt: int) -> float:
        for pattern in (
            r"retry in ([\d.]+)s",
            r"seconds:\s*(\d+)",
        ):
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                return float(match.group(1)) + 0.5

        return min(self.BASE_DELAY_SECONDS * (1.5**attempt), 10.0)


class OpenAIProvider(LLMProvider):
    """Placeholder for future OpenAI integration."""

    def __init__(self, api_key: str, model: str = "gpt-4o") -> None:
        self.api_key = api_key
        self.model = model

    async def generate(self, prompt: str) -> str:
        raise NotImplementedError(
            "OpenAI provider not yet implemented. Install openai and implement here."
        )


def get_llm_provider(provider: str = "gemini") -> LLMProvider:
    """Factory for LLM providers. Change provider name to swap backends."""
    if provider == "gemini":
        return GeminiProvider()
    if provider == "openai":
        return OpenAIProvider(api_key=settings.gemini_api_key)
    raise ValueError(f"Unknown LLM provider: {provider}")
