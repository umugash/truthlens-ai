"""LangGraph workflow orchestrating all TruthLens AI agents."""

from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.agents.claim_extraction import extract_claims
from app.agents.confidence_agent import score_confidence
from app.agents.evidence_agent import analyze_evidence
from app.agents.reasoning_agent import reason_over_evidence
from app.agents.report_agent import generate_report
from app.agents.search_agent import search_for_claims
from app.services.llm import LLMProvider, get_llm_provider
from app.services.tavily import TavilySearchService
from app.types.models import Claim, ClaimResult, VerificationReport


class GraphState(TypedDict):
    original_text: str
    claims: list[Claim]
    search_results: dict
    evidence: dict
    claim_results: list[ClaimResult]
    report: VerificationReport | None
    current_step: str


class TruthLensWorkflow:
    """Multi-agent fact verification pipeline built with LangGraph."""

    STEPS = [
        "extract_claims",
        "search_sources",
        "analyze_evidence",
        "reason",
        "score_confidence",
        "generate_report",
    ]

    def __init__(
        self,
        llm: LLMProvider | None = None,
        search_service: TavilySearchService | None = None,
    ) -> None:
        self.llm = llm or get_llm_provider()
        self.search_service = search_service or TavilySearchService()
        self.graph = self._build_graph()
        self._current_step = "extract_claims"

    @property
    def current_step(self) -> str:
        return self._current_step

    def _build_graph(self):
        workflow = StateGraph(GraphState)

        workflow.add_node("extract_claims", self._node_extract_claims)
        workflow.add_node("search_sources", self._node_search_sources)
        workflow.add_node("analyze_evidence", self._node_analyze_evidence)
        workflow.add_node("reason", self._node_reason)
        workflow.add_node("score_confidence", self._node_score_confidence)
        workflow.add_node("generate_report", self._node_generate_report)

        workflow.set_entry_point("extract_claims")
        workflow.add_edge("extract_claims", "search_sources")
        workflow.add_edge("search_sources", "analyze_evidence")
        workflow.add_edge("analyze_evidence", "reason")
        workflow.add_edge("reason", "score_confidence")
        workflow.add_edge("score_confidence", "generate_report")
        workflow.add_edge("generate_report", END)

        return workflow.compile()

    async def _node_extract_claims(self, state: GraphState) -> GraphState:
        self._current_step = "extract_claims"
        claims = await extract_claims(state["original_text"], self.llm)
        return {**state, "claims": claims, "current_step": "extract_claims"}

    async def _node_search_sources(self, state: GraphState) -> GraphState:
        self._current_step = "search_sources"
        search_results = await search_for_claims(state["claims"], self.search_service)
        serialized = {k: [r.model_dump() for r in v] for k, v in search_results.items()}
        return {**state, "search_results": serialized, "current_step": "search_sources"}

    async def _node_analyze_evidence(self, state: GraphState) -> GraphState:
        self._current_step = "analyze_evidence"
        from app.types.models import SearchResult

        search_results = {
            int(k): [SearchResult(**r) for r in v]
            for k, v in state["search_results"].items()
        }
        evidence = await analyze_evidence(state["claims"], search_results, self.llm)
        serialized = {k: [e.model_dump() for e in v] for k, v in evidence.items()}
        return {**state, "evidence": serialized, "current_step": "analyze_evidence"}

    async def _node_reason(self, state: GraphState) -> GraphState:
        self._current_step = "reason"
        import asyncio
        from app.types.models import EvidenceItem, SearchResult

        evidence_map = {
            int(k): [EvidenceItem(**e) for e in v] for k, v in state["evidence"].items()
        }

        async def _reason_claim(claim: Claim) -> ClaimResult:
            claim_evidence = evidence_map.get(claim.id, [])
            verdict, reasoning, confidence = await reason_over_evidence(
                claim, claim_evidence, self.llm
            )
            sources = [
                SearchResult(**r)
                for r in state["search_results"].get(claim.id, [])
            ]
            return ClaimResult(
                claim=claim,
                verdict=verdict,
                confidence=confidence,
                reasoning=reasoning,
                evidence=claim_evidence,
                sources=sources,
            )

        claim_results: list[ClaimResult] = await asyncio.gather(
            *[_reason_claim(claim) for claim in state["claims"]]
        )

        return {
            **state,
            "claim_results": [cr.model_dump() for cr in claim_results],
            "current_step": "reason",
        }

    async def _node_score_confidence(self, state: GraphState) -> GraphState:
        self._current_step = "score_confidence"
        import asyncio
        from app.types.models import ClaimResult, EvidenceItem, Verdict

        async def _score_claim(cr_data: dict) -> ClaimResult:
            claim = Claim(**cr_data["claim"])
            evidence = [EvidenceItem(**e) for e in cr_data["evidence"]]
            verdict = Verdict(cr_data["verdict"])
            initial_confidence = cr_data.get("confidence", 0)
            confidence = await score_confidence(
                claim,
                verdict,
                cr_data["reasoning"],
                evidence,
                self.llm,
                initial_confidence=initial_confidence,
            )
            updated = dict(cr_data)
            updated["confidence"] = confidence
            return ClaimResult(**updated)

        claim_results: list[ClaimResult] = await asyncio.gather(
            *[_score_claim(cr) for cr in state["claim_results"]]
        )

        return {
            **state,
            "claim_results": [cr.model_dump() for cr in claim_results],
            "current_step": "score_confidence",
        }

    async def _node_generate_report(self, state: GraphState) -> GraphState:
        self._current_step = "generate_report"
        from app.types.models import ClaimResult

        claim_results = [ClaimResult(**cr) for cr in state["claim_results"]]
        report = await generate_report(
            state["original_text"], claim_results, self.llm
        )
        return {
            **state,
            "report": report.model_dump(),
            "current_step": "generate_report",
        }

    async def run(self, text: str) -> VerificationReport:
        """Execute the full verification pipeline."""
        initial_state: GraphState = {
            "original_text": text,
            "claims": [],
            "search_results": {},
            "evidence": {},
            "claim_results": [],
            "report": None,
            "current_step": "extract_claims",
        }

        final_state = await self.graph.ainvoke(initial_state)
        report_data = final_state["report"]
        return VerificationReport(**report_data)
