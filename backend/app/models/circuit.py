from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class QuantumOperation(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    gate_type: str = Field(alias="gateType")
    target_qubits: List[int] = Field(alias="targetQubits")
    control_qubit: Optional[int] = Field(default=None, alias="controlQubit")
    column: int
    parameters: Optional[Dict[str, float]] = None


class QuantumCircuit(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    qubits: int
    classical_bits: int = Field(alias="classicalBits")
    operations: List[QuantumOperation] = Field(default_factory=list)


class SimulationResponse(BaseModel):
    success: bool
    counts: Dict[str, int]
    probabilities: Dict[str, float]
    shots: int
    status: str
    state_vector: Optional[List[Dict[str, object]]] = Field(default=None, alias="stateVector")
