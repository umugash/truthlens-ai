"""Reasoning Agent — determines verdict and confidence by comparing all evidence."""

import json

from app.services.llm import LLMProvider
from app.types.models import Claim, EvidenceItem, Verdict
from app.utils.json_helpers import extract_json
from app.utils.prompts import REASONING_PROMPT


async def reason_over_evidence(
    claim: Claim,
    evidence: list[EvidenceItem],
    llm: LLMProvider,
) -> tuple[Verdict, str, int]:
    """Compare evidence and return verdict, reasoning, and confidence score."""
    if not evidence:
        return (
            Verdict.UNSUPPORTED,
            "Insufficient evidence available from web search to verify this claim.",
            15,
        )

    evidence_json = json.dumps(
        [
            {
                "source": e.source_title,
                "url": e.source_url,
                "summary": e.summary,
                "stance": e.stance,
            }
            for e in evidence
        ],
        indent=2,
    )

    prompt = REASONING_PROMPT.format(claim=claim.text, evidence_json=evidence_json)
    response = await llm.generate(prompt)

    try:
        parsed = extract_json(response)
        verdict_str = parsed.get("verdict", "UNSUPPORTED").upper()
        try:
            verdict = Verdict(verdict_str)
        except ValueError:
            verdict = Verdict.UNSUPPORTED

        reasoning = parsed.get(
            "reasoning", "Unable to determine verdict from available evidence."
        )
        raw_conf = parsed.get("confidence", 70)
        try:
            confidence = max(0, min(100, int(raw_conf)))
        except (ValueError, TypeError):
            confidence = 65

        return verdict, reasoning, confidence
    except Exception:
        return (
            Verdict.UNSUPPORTED,
            "Could not parse reasoning evaluation from evidence.",
            20,
        )
