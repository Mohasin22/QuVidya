from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import ValidationError

from app.models.circuit import QuantumCircuit, SimulationResponse
from app.services.quantum_simulator import CircuitSimulationError, simulate_circuit

router = APIRouter(tags=["simulation"])


@router.post("/simulate", response_model=SimulationResponse)
def simulate(circuit: QuantumCircuit, shots: int = Query(default=1024, ge=1, le=1_000_000)) -> SimulationResponse:
    try:
        return simulate_circuit(circuit, shots=shots)  # type: ignore[return-value]
    except CircuitSimulationError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        ) from error
    except ValidationError as error:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid circuit data format: {str(error)}"
        ) from error
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Quantum simulation failed unexpectedly: {type(error).__name__}"
        ) from error
