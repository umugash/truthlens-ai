from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class Verdict(str, Enum):
    TRUE = "TRUE"
    FALSE = "FALSE"
    PARTIALLY_TRUE = "PARTIALLY_TRUE"
    MISLEADING = "MISLEADING"
    UNSUPPORTED = "UNSUPPORTED"


class Claim(BaseModel):
    id: int
    text: str


class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    publication_date: str | None = None


class EvidenceItem(BaseModel):
    source_title: str
    source_url: str
    summary: str
    stance: Literal["supports", "contradicts", "neutral"]


class ClaimResult(BaseModel):
    claim: Claim
    verdict: Verdict
    confidence: int = Field(ge=0, le=100)
    reasoning: str
    evidence: list[EvidenceItem]
    sources: list[SearchResult]


class VerificationReport(BaseModel):
    original_text: str
    claims: list[ClaimResult]
    overall_trust_score: int = Field(ge=0, le=100)
    summary: str
    generated_at: str


class VerificationRequest(BaseModel):
    text: str = Field(min_length=10, max_length=10000)


class WorkflowState(BaseModel):
    """Internal LangGraph state passed between agents."""

    original_text: str
    claims: list[Claim] = Field(default_factory=list)
    search_results: dict[int, list[SearchResult]] = Field(default_factory=dict)
    evidence: dict[int, list[EvidenceItem]] = Field(default_factory=dict)
    claim_results: list[ClaimResult] = Field(default_factory=list)
    overall_trust_score: int = 0
    summary: str = ""
    current_step: str = "extract_claims"
