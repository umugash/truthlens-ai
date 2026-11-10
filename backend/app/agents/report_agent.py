"""Report Agent — assembles final verification report with overall trust score."""

from datetime import datetime, timezone

from app.services.llm import LLMProvider
from app.types.models import ClaimResult, VerificationReport, Verdict
from app.utils.prompts import REPORT_SUMMARY_PROMPT


def compute_overall_trust_score(claim_results: list[ClaimResult]) -> int:
    """Compute weighted overall trust score from individual claim results."""
    if not claim_results:
        return 0

    verdict_weights = {
        Verdict.TRUE: 1.0,
        Verdict.PARTIALLY_TRUE: 0.7,
        Verdict.MISLEADING: 0.3,
        Verdict.UNSUPPORTED: 0.5,
        Verdict.FALSE: 0.0,
    }

    total_weight = 0.0
    for result in claim_results:
        weight = verdict_weights.get(result.verdict, 0.5)
        total_weight += weight * (result.confidence / 100)

    score = int((total_weight / len(claim_results)) * 100)
    return max(0, min(100, score))


async def generate_report(
    original_text: str,
    claim_results: list[ClaimResult],
    llm: LLMProvider,
) -> VerificationReport:
    """Generate the final structured verification report."""
    overall_trust_score = compute_overall_trust_score(claim_results)

    results_json = "\n".join(
        f"- Claim: {r.claim.text}\n  Verdict: {r.verdict.value}\n  Confidence: {r.confidence}%"
        for r in claim_results
    )

    prompt = REPORT_SUMMARY_PROMPT.format(
        original_text=original_text[:500],
        results_json=results_json,
        overall_trust_score=overall_trust_score,
    )
    summary = await llm.generate(prompt)
    summary = summary.strip().strip('"')

    return VerificationReport(
        original_text=original_text,
        claims=claim_results,
        overall_trust_score=overall_trust_score,
        summary=summary,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )
