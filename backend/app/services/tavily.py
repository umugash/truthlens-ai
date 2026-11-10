"""Tavily search service for web evidence gathering."""

import asyncio
import time
from tavily import AsyncTavilyClient, TavilyClient

from app.config import settings
from app.types.models import SearchResult


_SHARED_SEARCH_CACHE: dict[str, tuple[float, list[SearchResult]]] = {}


class TavilySearchService:
    CACHE_TTL_SECONDS = 600

    def __init__(self) -> None:
        self.api_key = settings.tavily_api_key
        self.client = TavilyClient(api_key=self.api_key)
        self.async_client = AsyncTavilyClient(api_key=self.api_key)

    def _cache_key(self, query: str, max_results: int, search_depth: str) -> str:
        return f"{query.strip().lower()}::{max_results}::{search_depth}"

    async def search(self, query: str, max_results: int = 5) -> list[SearchResult]:
        """Search the web asynchronously and return structured results with caching."""
        search_depth = getattr(settings, "tavily_search_depth", "basic")
        cache_key = self._cache_key(query, max_results, search_depth)

        now = time.time()
        if cache_key in _SHARED_SEARCH_CACHE:
            ts, cached_results = _SHARED_SEARCH_CACHE[cache_key]
            if now - ts < self.CACHE_TTL_SECONDS:
                return cached_results

        response = None
        try:
            response = await self.async_client.search(
                query=query,
                search_depth=search_depth,
                max_results=max_results,
                include_answer=False,
            )
        except Exception:
            # Fallback to sync client in background thread
            try:
                response = await asyncio.to_thread(
                    self.client.search,
                    query=query,
                    search_depth=search_depth,
                    max_results=max_results,
                    include_answer=False,
                )
            except Exception:
                return []

        results: list[SearchResult] = []
        if response and isinstance(response, dict):
            for item in response.get("results", []):
                results.append(
                    SearchResult(
                        title=item.get("title", "Untitled"),
                        url=item.get("url", ""),
                        snippet=item.get("content", item.get("snippet", "")),
                        publication_date=item.get("published_date"),
                    )
                )

        _SHARED_SEARCH_CACHE[cache_key] = (now, results)
        return results
