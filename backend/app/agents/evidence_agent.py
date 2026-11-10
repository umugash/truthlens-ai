"""Evidence Agent — analyzes search results and classifies stance per source."""

import asyncio

from app.services.llm import LLMProvider
from app.types.models import Claim, EvidenceItem, SearchResult
from app.utils.json_helpers import extract_json
from app.utils.prompts import BATCH_EVIDENCE_ANALYSIS_PROMPT


async def _analyze_claim_evidence(
    claim: Claim,
    results: list[SearchResult],
    llm: LLMProvider,
) -> tuple[int, list[EvidenceItem]]:
    if not results:
        return claim.id, []

    sources_text = "\n\n".join(
        f"[{i}] Title: {r.title}\nURL: {r.url}\nSnippet: {r.snippet[:400]}"
        for i, r in enumerate(results)
    )

    prompt = BATCH_EVIDENCE_ANALYSIS_PROMPT.format(
        claim=claim.text,
        sources_text=sources_text,
    )

    claim_evidence: list[EvidenceItem] = []
    try:
        response = await llm.generate(prompt)
        parsed = extract_json(response)

        parsed_dict: dict[int, dict] = {}
        if isinstance(parsed, list):
            for idx, item in enumerate(parsed):
                if isinstance(item, dict):
                    pos = item.get("index", idx)
                    if isinstance(pos, int):
                        parsed_dict[pos] = item

        for i, result in enumerate(results):
            p = parsed_dict.get(i, {})
            stance = p.get("stance", "neutral")
            if stance not in ("supports", "contradicts", "neutral"):
                stance = "neutral"
            summary = p.get("summary") or result.snippet[:300]
            claim_evidence.append(
                EvidenceItem(
                    source_title=result.title,
                    source_url=result.url,
                    summary=summary,
                    stance=stance,
                )
            )
    except Exception:
        # Fallback to snippet preview
        for result in results:
            claim_evidence.append(
                EvidenceItem(
                    source_title=result.title,
                    source_url=result.url,
                    summary=result.snippet[:300],
                    stance="neutral",
                )
            )

    return claim.id, claim_evidence


async def analyze_evidence(
    claims: list[Claim],
    search_results: dict[int, list[SearchResult]],
    llm: LLMProvider,
) -> dict[int, list[EvidenceItem]]:
    """Summarize search results and classify as supports/contradicts/neutral in parallel."""
    if not claims:
        return {}

    tasks = [
        _analyze_claim_evidence(claim, search_results.get(claim.id, []), llm)
        for claim in claims
    ]
    pairs = await asyncio.gather(*tasks)
    return dict(pairs)
