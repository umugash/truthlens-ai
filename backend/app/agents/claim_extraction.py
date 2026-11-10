"""Claim Extraction Agent — splits text into verifiable factual claims."""

import json

from app.services.llm import LLMProvider
from app.types.models import Claim
from app.utils.json_helpers import extract_json
from app.utils.prompts import CLAIM_EXTRACTION_PROMPT


async def extract_claims(text: str, llm: LLMProvider) -> list[Claim]:
    """Extract independent factual claims from input text."""
    prompt = CLAIM_EXTRACTION_PROMPT.format(text=text)
    response = await llm.generate(prompt)

    raw_claims = extract_json(response)
    if not isinstance(raw_claims, list):
        raise ValueError("Claim extraction did not return a JSON array")

    claims: list[Claim] = []
    for idx, item in enumerate(raw_claims, start=1):
        if isinstance(item, dict) and "text" in item:
            claims.append(
                Claim(
                    id=item.get("id", idx),
                    text=str(item["text"]).strip(),
                )
            )

    return claims
