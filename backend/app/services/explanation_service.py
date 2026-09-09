from __future__ import annotations

from typing import Any, Dict, Optional

from app.models.explanation import ExplanationContent, ExplanationRequest

GATE_EXPLANATIONS = {
    "hadamard": "H creates an equal superposition when applied to |0⟩, putting the qubit into a balanced combination of |0⟩ and |1⟩.",
    "pauli-x": "X flips the computational basis: |0⟩ becomes |1⟩ and |1⟩ becomes |0⟩.",
    "pauli-y": "Y rotates the state around the Y axis and combines a bit flip with a phase factor.",
    "pauli-z": "Z leaves |0⟩ unchanged and adds a phase of -1 to |1⟩.",
    "s": "S applies a quarter-turn phase shift to the |1⟩ component.",
    "t": "T applies an eighth-turn phase shift to the |1⟩ component.",
    "rotation-x": "Rx(theta) rotates a qubit around the X axis by the requested angle.",
    "rotation-y": "Ry(theta) rotates a qubit around the Y axis by the requested angle.",
    "rotation-z": "Rz(theta) rotates a qubit around the Z axis and changes relative phase.",
    "controlled-not": "CNOT applies X to the target only when the control qubit is |1⟩.",
    "controlled-z": "CZ applies a phase flip to the |11⟩ component when both qubits are |1⟩.",
    "swap": "SWAP exchanges the quantum states of two qubits.",
    "measurement": "Measurement converts a qubit's quantum state into a classical bit according to its probabilities.",
}


def _top_results(simulation_results: Optional[Dict[str, Any]]) -> str:
    if not simulation_results:
        return "No simulation has been run yet, so there are no observed measurement results to explain."
    probabilities = simulation_results.get("probabilities", {})
    if not probabilities:
        return "The simulation completed without probability data."
    outcomes = sorted(probabilities.items(), key=lambda item: item[1], reverse=True)[:3]
    formatted = ", ".join(f"{state} ({float(probability) * 100:.1f}%)" for state, probability in outcomes)
    return f"The most likely measured outcomes are {formatted}. These percentages are empirical probabilities from the requested shots."


def explain_circuit(request: ExplanationRequest) -> ExplanationContent:
    circuit = request.circuit
    gate_names = request.gates_used or [operation.gate_type for operation in sorted(circuit.operations, key=lambda item: item.column)]
    gates = [GATE_EXPLANATIONS.get(name, f"{name} is an operation in this circuit; its matrix-level effect is not described by this starter explanation.") for name in gate_names]
    ordered_names = ", ".join(gate_names) if gate_names else "no gates"
    level = request.learner_level or "beginner"

    return ExplanationContent(
        overview=f"This circuit has {circuit.qubits} qubits and {len(circuit.operations)} operations arranged across circuit columns. It applies {ordered_names} in order. This explanation is written for a {level} learner.",
        gates=gates,
        stateChanges="Quantum operations change amplitudes and relative phases before measurement. Gates in the same circuit column act at the same time step, while later columns act on the state produced by earlier columns.",
        observedResult=_top_results(request.simulation_results),
        concepts=["Amplitudes are complex numbers; probabilities come from their squared magnitudes.", "Superposition describes multiple possible basis states before measurement.", "Entangling gates create correlations that cannot be represented by independent single-qubit pictures.", "Measurement samples one classical outcome and changes what can be observed directly."],
    )
