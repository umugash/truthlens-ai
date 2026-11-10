"""Confidence Agent — assigns 0-100 confidence score based on evidence quality."""

from app.services.llm import LLMProvider
from app.types.models import Claim, EvidenceItem, Verdict
from app.utils.json_helpers import extract_json
from app.utils.prompts import CONFIDENCE_PROMPT


async def score_confidence(
    claim: Claim,
    verdict: Verdict,
    reasoning: str,
    evidence: list[EvidenceItem],
    llm: LLMProvider | None = None,
    initial_confidence: int | None = None,
) -> int:
    """Generate confidence score based on source quality, count, and agreement."""
    # Fast path: calibrate initial confidence score from reasoning stage
    if initial_confidence is not None and initial_confidence > 0:
        if not evidence:
            return min(initial_confidence, 20)
        return max(0, min(100, initial_confidence))

    supports = sum(1 for e in evidence if e.stance == "supports")
    contradicts = sum(1 for e in evidence if e.stance == "contradicts")
    neutral = sum(1 for e in evidence if e.stance == "neutral")

    # Fast heuristic calibration
    if len(evidence) == 0:
        return 10
    agreement = max(supports, contradicts) / len(evidence) if evidence else 0
    base = 40 + int(agreement * 40) + min(len(evidence) * 4, 20)
    calibrated = max(0, min(100, base))

    if llm is None:
        return calibrated

    evidence_summary = (
        f"Total sources: {len(evidence)}\n"
        f"Supporting: {supports}, Contradicting: {contradicts}, Neutral: {neutral}\n"
        + "\n".join(f"- [{e.stance}] {e.source_title}: {e.summary[:150]}" for e in evidence)
    )

    prompt = CONFIDENCE_PROMPT.format(
        claim=claim.text,
        verdict=verdict.value,
        reasoning=reasoning,
        evidence_summary=evidence_summary,
    )

    try:
        response = await llm.generate(prompt)
        parsed = extract_json(response)
        confidence = int(parsed.get("confidence", calibrated))
        return max(0, min(100, confidence))
    except Exception:
        return calibrated
