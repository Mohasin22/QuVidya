from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.explanation import ExplanationRequest, ExplanationResponse
from app.services.explanation_service import explain_circuit

router = APIRouter(tags=["explanation"])


@router.post("/explain-circuit", response_model=ExplanationResponse)
def explain(request: ExplanationRequest) -> ExplanationResponse:
    try:
        return ExplanationResponse(success=True, explanation=explain_circuit(request))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail="Circuit explanation failed.") from error