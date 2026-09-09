from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.analysis import AnalysisRequest, AnalysisResponse
from app.services.analysis_service import analyze_circuit

router = APIRouter(tags=["analysis"])


@router.post("/analyze-circuit", response_model=AnalysisResponse)
def analyze(request: AnalysisRequest) -> AnalysisResponse:
    try:
        return AnalysisResponse(success=True, issues=analyze_circuit(request))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail="Circuit analysis failed.") from error