"""Search Agent — gathers web evidence for each claim via Tavily."""

import asyncio
from app.services.tavily import TavilySearchService
from app.types.models import Claim, SearchResult


async def search_for_claims(
    claims: list[Claim],
    search_service: TavilySearchService,
    max_results: int = 5,
) -> dict[int, list[SearchResult]]:
    """Search the web in parallel for each claim and return top trusted results."""
    if not claims:
        return {}

    async def _search_single(claim: Claim) -> tuple[int, list[SearchResult]]:
        try:
            query = f"fact check verify: {claim.text}"
            search_results = await search_service.search(query, max_results=max_results)
            return claim.id, search_results
        except Exception:
            return claim.id, []

    tasks = [_search_single(claim) for claim in claims]
    pairs = await asyncio.gather(*tasks)
    return dict(pairs)
