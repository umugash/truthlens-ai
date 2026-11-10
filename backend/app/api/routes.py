"""FastAPI route handlers."""

import time
from fastapi import APIRouter, HTTPException

from app.agents.graph import TruthLensWorkflow
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
