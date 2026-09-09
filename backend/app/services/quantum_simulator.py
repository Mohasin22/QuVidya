from __future__ import annotations

from typing import Dict, List, Optional, Set

from qiskit import QuantumCircuit as QiskitCircuit
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator

from app.models.circuit import QuantumCircuit, QuantumOperation

DEFAULT_SHOTS = 1024
MAX_STATEVECTOR_QUBITS = 12


class CircuitSimulationError(ValueError):
    """Raised when a circuit cannot be translated into a Qiskit circuit."""


def _require_targets(operation: QuantumOperation, count: int) -> List[int]:
    if len(operation.target_qubits) != count:
        raise CircuitSimulationError(f"{operation.gate_type} requires {count} target qubit(s).")
    return operation.target_qubits


def _validate_qubit(qubit: int, circuit: QuantumCircuit, label: str) -> None:
    if not 0 <= qubit < circuit.qubits:
        raise CircuitSimulationError(f"{label} q[{qubit}] is outside the circuit.")


def _apply_operation(qiskit_circuit: QiskitCircuit, operation: QuantumOperation, circuit: QuantumCircuit, measured_qubits: Set[int]) -> None:
    gate_type = operation.gate_type
    targets = operation.target_qubits

    # Validate all target qubits
    for index, qubit in enumerate(targets):
        _validate_qubit(qubit, circuit, f"Target {index}")

    # Single-qubit gates
    if gate_type in {"hadamard", "pauli-x", "pauli-y", "pauli-z", "s", "s-dagger", "t", "t-dagger", "identity"}:
        targets = _require_targets(operation, 1)
        gate_methods = {"hadamard": qiskit_circuit.h, "pauli-x": qiskit_circuit.x, "pauli-y": qiskit_circuit.y, "pauli-z": qiskit_circuit.z, "s": qiskit_circuit.s, "s-dagger": qiskit_circuit.sdg, "t": qiskit_circuit.t, "t-dagger": qiskit_circuit.tdg, "identity": qiskit_circuit.id}
        gate_methods[gate_type](targets[0])
        return

    # Rotation gates
    if gate_type in {"rotation-x", "rotation-y", "rotation-z"}:
        targets = _require_targets(operation, 1)
        theta = (operation.parameters or {}).get("theta")
        if theta is None:
            raise CircuitSimulationError(f"{gate_type} requires a theta parameter.")
        if not isinstance(theta, (int, float)) or not (isinstance(theta, float) and not (theta != theta)):  # Check for NaN
            raise CircuitSimulationError(f"{gate_type} requires a valid numeric theta parameter.")
        rotation_methods = {"rotation-x": qiskit_circuit.rx, "rotation-y": qiskit_circuit.ry, "rotation-z": qiskit_circuit.rz}
        rotation_methods[gate_type](theta, targets[0])
        return

    # Phase gate
    if gate_type == "phase":
        targets = _require_targets(operation, 1)
        theta = (operation.parameters or {}).get("theta")
        if theta is None:
            raise CircuitSimulationError("phase requires a theta parameter.")
        if not isinstance(theta, (int, float)) or not (isinstance(theta, float) and not (theta != theta)):  # Check for NaN
            raise CircuitSimulationError("phase requires a valid numeric theta parameter.")
        qiskit_circuit.p(theta, targets[0])
        return

    # Barrier
    if gate_type == "barrier":
        # Apply barrier to specific qubits
        if targets:
            qiskit_circuit.barrier(*targets)
        else:
            qiskit_circuit.barrier()
        return

    # Controlled gates (CNOT, CZ)
    if gate_type in {"controlled-not", "controlled-z"}:
        targets = _require_targets(operation, 1)
        if operation.control_qubit is None:
            raise CircuitSimulationError(f"{gate_type} requires a control qubit.")
        _validate_qubit(operation.control_qubit, circuit, "Control")
        if operation.control_qubit == targets[0]:
            raise CircuitSimulationError("Control and target qubits must be different.")
        if gate_type == "controlled-not":
            qiskit_circuit.cx(operation.control_qubit, targets[0])
        else:
            qiskit_circuit.cz(operation.control_qubit, targets[0])
        return

    # SWAP gate
    if gate_type == "swap":
        first, second = _require_targets(operation, 2)
        if first == second:
            raise CircuitSimulationError("SWAP targets must be different qubits.")
        # SWAP should not have a control qubit
        if operation.control_qubit is not None:
            # For backwards compatibility, we'll ignore the control qubit but only use the targets
            pass
        qiskit_circuit.swap(first, second)
        return

    # Measurement
    if gate_type == "measurement":
        target = _require_targets(operation, 1)[0]
        if target >= circuit.classical_bits:
            raise CircuitSimulationError(f"Measurement q[{target}] has no matching classical bit.")
        qiskit_circuit.measure(target, target)
        measured_qubits.add(target)
        return

    raise CircuitSimulationError(f"Unsupported gate type: {gate_type}")


def _build_qiskit_circuit(circuit: QuantumCircuit, include_measurements: bool = True) -> QiskitCircuit:
    if circuit.qubits < 1:
        raise CircuitSimulationError("Circuit must contain at least one qubit.")
    if circuit.classical_bits < 1:
        raise CircuitSimulationError("Circuit must contain at least one classical bit.")

    qiskit_circuit = QiskitCircuit(circuit.qubits, circuit.classical_bits if include_measurements else 0)
    measured_qubits: Set[int] = set()
    operation_ids: Set[str] = set()
    occupied: Dict[tuple[int, int], str] = {}
    for operation in sorted(circuit.operations, key=lambda item: item.column):
        if operation.id in operation_ids:
            raise CircuitSimulationError(f"Duplicate operation id: {operation.id}")
        operation_ids.add(operation.id)

        # SWAP-specific validation
        if operation.gate_type == "swap":
            if len(operation.target_qubits) != 2:
                raise CircuitSimulationError("SWAP requires exactly 2 target qubits.")
            if operation.target_qubits[0] == operation.target_qubits[1]:
                raise CircuitSimulationError("SWAP targets must be different qubits.")
            # For SWAP, only use target qubits for collision detection
            used_qubits = operation.target_qubits
        else:
            used_qubits = [*operation.target_qubits, *([] if operation.control_qubit is None else [operation.control_qubit])]
            # Check for duplicate qubits in the same operation
            if len(set(used_qubits)) != len(used_qubits):
                raise CircuitSimulationError(f"{operation.gate_type} cannot use the same qubit multiple times.")

        for qubit in used_qubits:
            key = (operation.column, qubit)
            if key in occupied:
                raise CircuitSimulationError(f"Operations {occupied[key]} and {operation.gate_type} overlap on q[{qubit}] in column {operation.column}.")
            occupied[key] = operation.gate_type
        if not include_measurements and operation.gate_type == "measurement":
            continue
        _apply_operation(qiskit_circuit, operation, circuit, measured_qubits)

    # Counts require measurements. Complete unmeasured qubits for a usable result.
    if include_measurements:
        for qubit in range(min(circuit.qubits, circuit.classical_bits)):
            if qubit not in measured_qubits:
                qiskit_circuit.measure(qubit, qubit)
    return qiskit_circuit


def _format_complex(real: float, imaginary: float) -> str:
    sign = "+" if imaginary >= 0 else "-"
    return f"{real:.6f} {sign} {abs(imaginary):.6f}i"


def _state_vector(circuit: QuantumCircuit) -> Optional[List[Dict[str, object]]]:
    if circuit.qubits > MAX_STATEVECTOR_QUBITS or any(operation.gate_type == "measurement" for operation in circuit.operations):
        return None

    state = Statevector.from_instruction(_build_qiskit_circuit(circuit, include_measurements=False))
    amplitudes: List[Dict[str, object]] = []
    for index, amplitude in enumerate(state.data):
        real = round(float(amplitude.real), 6)
        imaginary = round(float(amplitude.imag), 6)
        basis_state = format(index, f"0{circuit.qubits}b")
        amplitudes.append({"basisState": f"|{basis_state}⟩", "real": real, "imaginary": imaginary, "amplitude": _format_complex(real, imaginary)})
    return amplitudes


def simulate_circuit(circuit: QuantumCircuit, shots: int = DEFAULT_SHOTS) -> Dict[str, object]:
    if shots < 1:
        raise CircuitSimulationError("Shots must be greater than zero.")

    qiskit_circuit = _build_qiskit_circuit(circuit)
    result = AerSimulator().run(qiskit_circuit, shots=shots).result()
    counts = {str(key): int(value) for key, value in result.get_counts().items()}
    probabilities = {key: round(value / shots, 6) for key, value in counts.items()}

    return {"success": True, "counts": counts, "probabilities": probabilities, "shots": shots, "status": "completed", "stateVector": _state_vector(circuit)}
