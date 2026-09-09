import { create } from 'zustand'
import type { QuantumCircuit, QuantumOperation } from '../types/circuit'
import type { SimulationResult, SimulationState } from '../types/simulation'
import { validateOperation, validateOperationPlacement } from '../utils/circuitValidation'

export type OperationInput = Omit<QuantumOperation, 'id'>

type CircuitStore = {
  circuit: QuantumCircuit
  past: QuantumCircuit[]
  future: QuantumCircuit[]
  simulation: SimulationState
  addOperation: (operation: OperationInput) => string | null
  removeOperation: (operationId: string) => void
  moveOperation: (operationId: string, column: number, targetQubits?: number[], controlQubit?: number) => boolean
  clearCircuit: () => void
  resetCircuit: () => void
  loadCircuit: (circuit: QuantumCircuit) => void
  addQubit: () => void
  removeQubit: () => boolean
  undo: () => void
  redo: () => void
  setSimulationLoading: () => void
  setSimulationResult: (result: SimulationResult) => void
  setSimulationError: (error: string) => void
  clearSimulation: () => void
}

const initialCircuit: QuantumCircuit = { qubits: 4, classicalBits: 4, operations: [] }

const cloneCircuit = (circuit: QuantumCircuit): QuantumCircuit => ({
  ...circuit,
  operations: circuit.operations.map((operation) => ({ ...operation, targetQubits: [...operation.targetQubits], parameters: operation.parameters ? { ...operation.parameters } : undefined })),
})

const withHistory = (current: QuantumCircuit, next: QuantumCircuit, past: QuantumCircuit[]) => ({ circuit: cloneCircuit(next), past: [...past, cloneCircuit(current)], future: [], simulation: { status: 'idle' as const } })

export const circuitStore = create<CircuitStore>((set) => ({
  circuit: initialCircuit,
  past: [],
  future: [],
  simulation: { status: 'idle' },
  addOperation: (operation) => {
    let rejected = false
    const id = globalThis.crypto?.randomUUID?.() ?? `operation-${Date.now()}`
    set((state) => {
      // Validate the operation itself
      const operationValidation = validateOperation(
        operation,
        state.circuit.qubits,
        state.circuit.classicalBits
      )
      if (!operationValidation.valid) {
        rejected = true
        return state
      }

      // Validate placement (no collisions)
      const placementValidation = validateOperationPlacement(
        operation,
        state.circuit.operations
      )
      if (!placementValidation.valid) {
        rejected = true
        return state
      }

      return withHistory(state.circuit, { ...state.circuit, operations: [...state.circuit.operations, { ...operation, id }] }, state.past)
    })
    return rejected ? null : id
  },
  removeOperation: (operationId) => set((state) => {
    const operations = state.circuit.operations.filter((operation) => operation.id !== operationId)
    return operations.length === state.circuit.operations.length ? state : withHistory(state.circuit, { ...state.circuit, operations }, state.past)
  }),
  moveOperation: (operationId, column, targetQubits, controlQubit) => {
    let moved = false
    set((state) => {
      const current = state.circuit.operations.find((operation) => operation.id === operationId)
      if (!current) return state
      const nextTargets = targetQubits ?? current.targetQubits
      const validTargets = nextTargets.length > 0 && nextTargets.every((qubit) => qubit >= 0 && qubit < state.circuit.qubits)
      const nextControl = controlQubit ?? current.controlQubit
      const validControl = nextControl === undefined || (nextControl >= 0 && nextControl < state.circuit.qubits && !nextTargets.includes(nextControl))
      const occupiedQubits = new Set([...nextTargets, ...(nextControl === undefined ? [] : [nextControl])])
      const collision = state.circuit.operations.some((operation) => operation.id !== operationId && operation.column === column && [...operation.targetQubits, ...(operation.controlQubit === undefined ? [] : [operation.controlQubit])].some((qubit) => occupiedQubits.has(qubit)))
      if (!validTargets || !validControl || column < 0 || collision) return state
      const operations = state.circuit.operations.map((operation) => operation.id === operationId ? { ...operation, column, targetQubits: nextTargets, controlQubit: nextControl } : operation)
      moved = true
      return withHistory(state.circuit, { ...state.circuit, operations }, state.past)
    })
    return moved
  },
  clearCircuit: () => set((state) => state.circuit.operations.length === 0 ? state : withHistory(state.circuit, { ...state.circuit, operations: [] }, state.past)),
  resetCircuit: () => set((state) => withHistory(state.circuit, { qubits: 4, classicalBits: 4, operations: [] }, state.past)),
  loadCircuit: (circuit) => set((state) => withHistory(state.circuit, circuit, state.past)),
  addQubit: () => set((state) => withHistory(state.circuit, { ...state.circuit, qubits: state.circuit.qubits + 1, classicalBits: state.circuit.classicalBits + 1 }, state.past)),
  removeQubit: () => {
    let removed = false
    set((state) => {
      if (state.circuit.qubits <= 1) return state
      const lastQubit = state.circuit.qubits - 1
      const hasOperationOnLastQubit = state.circuit.operations.some((operation) => operation.targetQubits.includes(lastQubit) || operation.controlQubit === lastQubit)
      if (hasOperationOnLastQubit) return state
      removed = true
      return withHistory(state.circuit, { ...state.circuit, qubits: lastQubit, classicalBits: Math.max(1, state.circuit.classicalBits - 1) }, state.past)
    })
    return removed
  },
  undo: () => set((state) => {
    const previous = state.past.at(-1)
    if (!previous) return state
    return { circuit: cloneCircuit(previous), past: state.past.slice(0, -1), future: [cloneCircuit(state.circuit), ...state.future], simulation: { status: 'idle' } }
  }),
  redo: () => set((state) => {
    const next = state.future[0]
    if (!next) return state
    return { circuit: cloneCircuit(next), past: [...state.past, cloneCircuit(state.circuit)], future: state.future.slice(1), simulation: { status: 'idle' } }
  }),
  setSimulationLoading: () => set({ simulation: { status: 'loading' } }),
  setSimulationResult: (result) => set({ simulation: { status: 'success', result } }),
  setSimulationError: (error) => set({ simulation: { status: 'error', error } }),
  clearSimulation: () => set({ simulation: { status: 'idle' } }),
}))

export const useCircuitStore = circuitStore

export type { CircuitStore }
