"""Sample verification test for TruthLens AI."""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.agents.graph import TruthLensWorkflow

SAMPLE_TEXT = (
    "Apple acquired OpenAI for $50 billion and Elon Musk confirmed it."
)


async def main() -> None:
    workflow = TruthLensWorkflow()
    report = await workflow.run(SAMPLE_TEXT)

    print("Sample verification completed successfully.")
    print(f"Overall trust score: {report.overall_trust_score}")
    print(f"Summary: {report.summary}")
    print(f"Claims analyzed: {len(report.claims)}")
    for result in report.claims:
        print(
            f"  - {result.claim.text}: "
            f"{result.verdict.value} ({result.confidence}%)"
        )

    print("\nFull report JSON:")
    print(json.dumps(report.model_dump(), indent=2))


if __name__ == "__main__":
    asyncio.run(main())
