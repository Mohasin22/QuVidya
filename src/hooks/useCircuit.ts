import { useCircuitStore } from '../store/circuitStore'

export function useCircuit() {
  const circuit = useCircuitStore((state) => state.circuit)
  const addQubit = useCircuitStore((state) => state.addQubit)

  return {
    circuit,
    qubitCount: circuit.qubits,
    addQubit,
    reset: useCircuitStore((state) => state.resetCircuit),
  }
}
