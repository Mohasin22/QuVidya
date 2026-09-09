from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.circuit import QuantumCircuit


class AnalysisRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    circuit: QuantumCircuit
    learner_level: Optional[str] = Field(default=None, alias="learnerLevel")


class AnalysisIssue(BaseModel):
    issue: str
    explanation: str
    suggested_improvement: str = Field(alias="suggestedImprovement")
    category: str
    severity: str


class AnalysisResponse(BaseModel):
    success: bool
    issues: List[AnalysisIssue]
