from __future__ import annotations

from typing import Dict, List, Tuple

from app.models.analysis import AnalysisIssue, AnalysisRequest

SUPPORTED_GATES = {"hadamard", "pauli-x", "pauli-y", "pauli-z", "s", "t", "rotation-x", "rotation-y", "rotation-z", "controlled-not", "controlled-z", "swap", "measurement", "barrier", "identity"}
SINGLE_QUBIT_GATES = {"hadamard", "pauli-x", "pauli-y", "pauli-z", "s", "t", "rotation-x", "rotation-y", "rotation-z", "measurement", "barrier", "identity"}
SELF_INVERSE_GATES = {"hadamard", "pauli-x", "pauli-y", "pauli-z"}


def _issue(issue: str, explanation: str, suggested: str, category: str, severity: str = "warning") -> AnalysisIssue:
    return AnalysisIssue(issue=issue, explanation=explanation, suggestedImprovement=suggested, category=category, severity=severity)


def analyze_circuit(request: AnalysisRequest) -> List[AnalysisIssue]:
    circuit = request.circuit
    operations = sorted(circuit.operations, key=lambda operation: (operation.column, operation.id))
    issues: List[AnalysisIssue] = []
    occupied: Dict[Tuple[int, int], str] = {}

    if not operations:
        issues.append(_issue("The circuit is empty", "There are no quantum operations to transform the initial state.", "Add a gate and, when you want classical results, finish with a measurement.", "beginner", "info"))
        return issues

    for operation in operations:
        gate = operation.gate_type
        targets = operation.target_qubits
        if gate not in SUPPORTED_GATES:
            issues.append(_issue(f"Unsupported gate: {gate}", "The simulator does not know how to apply this operation.", "Replace it with a supported gate from the library.", "invalid combination", "error"))
            continue

        expected_targets = 2 if gate == "swap" else 1
        if gate in SINGLE_QUBIT_GATES and len(targets) != 1:
            issues.append(_issue(f"Invalid target count for {gate}", f"{gate} is a single-qubit operation but has {len(targets)} targets.", "Keep exactly one target qubit for this gate.", "invalid combination", "error"))
        if gate == "swap" and len(targets) != expected_targets:
            issues.append(_issue("Invalid SWAP targets", "SWAP must connect exactly two different qubits.", "Choose two distinct target qubits.", "invalid combination", "error"))
        if gate in {"controlled-not", "controlled-z"} and operation.control_qubit is None:
            issues.append(_issue(f"{gate} is missing a control", "A controlled gate needs one control qubit and one different target qubit.", "Select a separate control qubit before the target.", "invalid combination", "error"))
        if operation.control_qubit is not None and operation.control_qubit in targets:
            issues.append(_issue("Control and target overlap", "A qubit cannot control and receive the same operation at once.", "Choose different control and target qubits.", "invalid combination", "error"))
        if len(set(targets)) != len(targets):
            issues.append(_issue(f"Duplicate targets in {gate}", "The same qubit appears more than once in this operation.", "Use each qubit only once in a multi-qubit operation.", "invalid combination", "error"))
        for qubit in [*targets, *([] if operation.control_qubit is None else [operation.control_qubit])]:
            if qubit < 0 or qubit >= circuit.qubits:
                issues.append(_issue(f"Qubit q[{qubit}] is out of range", "This operation references a qubit that is not in the circuit.", f"Use a qubit from q[0] through q[{max(circuit.qubits - 1, 0)}].", "invalid combination", "error"))
            key = (operation.column, qubit)
            if key in occupied:
                issues.append(_issue(f"Column {operation.column} has a collision", f"q[{qubit}] is used by both {occupied[key]} and {gate} in the same column.", "Move one operation to another column or qubit.", "invalid combination", "error"))
            occupied[key] = gate

    if not any(operation.gate_type == "measurement" for operation in operations):
        issues.append(_issue("No explicit measurement operation", "The backend adds readout measurements automatically for shot-based results, but the circuit itself does not show where quantum information becomes classical.", "Add an explicit measurement near the end when teaching or documenting the observed output.", "missing measurement", "info"))

    for previous, current in zip(operations, operations[1:]):
        same_qubits = previous.target_qubits == current.target_qubits and previous.control_qubit == current.control_qubit
        if same_qubits and previous.gate_type == current.gate_type and previous.column + 1 == current.column and previous.gate_type in SELF_INVERSE_GATES:
            issues.append(_issue(f"Redundant consecutive {current.gate_type} gates", f"Applying {current.gate_type} twice in succession on the same qubits returns those qubits to their earlier state.", "Remove one of the two gates unless the pair is intentional for teaching or timing.", "redundant gate", "suggestion"))
        if previous.gate_type == "measurement" and current.gate_type != "measurement":
            issues.append(_issue("Operations follow measurement", "Measurement produces classical information and is usually the final step of a circuit path.", "Move later quantum gates before the measurement unless this ordering is intentional.", "beginner mistake", "suggestion"))

    for operation in operations:
        if operation.gate_type in {"identity", "barrier"}:
            issues.append(_issue(f"Possibly unnecessary {operation.gate_type} operation", f"{operation.gate_type} does not change amplitudes; it may only be useful for layout or teaching.", "Remove it if it is not being used to make circuit timing or structure clear.", "unnecessary operation", "suggestion"))

    if circuit.classical_bits < circuit.qubits:
        issues.append(_issue("Too few classical bits", "There are fewer classical bits than qubits, so some qubits cannot be measured directly into matching classical positions.", "Add enough classical bits for the measurements you want to record.", "beginner mistake", "warning"))

    return issues
