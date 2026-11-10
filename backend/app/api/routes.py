"""FastAPI route handlers."""

import json
import time
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.agents.graph import GraphState, TruthLensWorkflow
from app.types.models import VerificationReport, VerificationRequest

router = APIRouter(prefix="/api", tags=["verification"])

_workflow: TruthLensWorkflow | None = None
_REPORT_CACHE: dict[str, tuple[float, VerificationReport]] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes


def get_workflow() -> TruthLensWorkflow:
    global _workflow
    if _workflow is None:
        _workflow = TruthLensWorkflow()
    return _workflow


@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "TruthLens AI"}


@router.post("/verify", response_model=VerificationReport)
async def verify_text(request: VerificationRequest) -> VerificationReport:
    """Run the full multi-agent verification pipeline on input text."""
    cache_key = request.text.strip().lower()
    now = time.time()
    if cache_key in _REPORT_CACHE:
        ts, cached_report = _REPORT_CACHE[cache_key]
        if now - ts < CACHE_TTL_SECONDS:
            return cached_report

    try:
        workflow = get_workflow()
        report = await workflow.run(request.text)
        _REPORT_CACHE[cache_key] = (now, report)
        return report
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Verification failed: {exc}",
        ) from exc


@router.post("/verify/stream")
async def verify_text_stream(request: VerificationRequest):
    """Stream live verification step updates followed by the final report."""
    async def event_generator():
        workflow = get_workflow()
        initial_state: GraphState = {
            "original_text": request.text,
            "claims": [],
            "search_results": {},
            "evidence": {},
            "claim_results": [],
            "report": None,
            "current_step": "extract_claims",
        }

        cache_key = request.text.strip().lower()
        now = time.time()
        if cache_key in _REPORT_CACHE:
            ts, cached_report = _REPORT_CACHE[cache_key]
            if now - ts < CACHE_TTL_SECONDS:
                yield f"data: {json.dumps({'type': 'step', 'step': 'generate_report'})}\n\n"
                yield f"data: {json.dumps({'type': 'complete', 'report': cached_report.model_dump()})}\n\n"
                return

        final_report = None
        try:
            async for output in workflow.graph.astream(initial_state):
                for node_name, state_update in output.items():
                    yield f"data: {json.dumps({'type': 'step', 'step': node_name})}\n\n"
                    if node_name == "generate_report" and "report" in state_update:
                        final_report = state_update["report"]

            if final_report:
                _REPORT_CACHE[cache_key] = (now, VerificationReport(**final_report))
                yield f"data: {json.dumps({'type': 'complete', 'report': final_report})}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'error', 'detail': 'Verification produced no report'})}\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'type': 'error', 'detail': str(exc)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
