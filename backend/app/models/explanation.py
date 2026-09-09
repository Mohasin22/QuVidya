from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.circuit import QuantumCircuit


class ExplanationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    circuit: QuantumCircuit
    gates_used: List[str] = Field(default_factory=list, alias="gatesUsed")
    simulation_results: Optional[Dict[str, Any]] = Field(default=None, alias="simulationResults")
    learner_level: Optional[str] = Field(default=None, alias="learnerLevel")


class ExplanationContent(BaseModel):
    overview: str
    gates: List[str]
    state_changes: str = Field(alias="stateChanges")
    observed_result: str = Field(alias="observedResult")
    concepts: List[str]


class ExplanationResponse(BaseModel):
    success: bool
    explanation: ExplanationContent
