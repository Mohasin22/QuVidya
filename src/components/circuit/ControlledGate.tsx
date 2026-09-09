import type { QuantumOperation } from '../../types/circuit'
import { GateOperation } from './GateOperation'

type ControlledGateProps = {
  operation: QuantumOperation
  qubitIndex: number
  selected?: boolean
  onSelect?: (operation: QuantumOperation) => void
}

export function ControlledGate({ operation, qubitIndex, selected, onSelect }: ControlledGateProps) {
  const isControl = operation.controlQubit === qubitIndex
  const isTarget = operation.targetQubits.includes(qubitIndex)
  const isSwap = operation.gateType === 'swap'

  // For SWAP gates, both qubits are targets (no control/target distinction)
  const connectedQubits = isSwap
    ? operation.targetQubits
    : [...operation.targetQubits, ...(operation.controlQubit === undefined ? [] : [operation.controlQubit])]

  const minQubit = Math.min(...connectedQubits)
  const maxQubit = Math.max(...connectedQubits)
  const isConnected = qubitIndex >= minQubit && qubitIndex <= maxQubit
  const isTop = qubitIndex === minQubit
  const isBottom = qubitIndex === maxQubit

  if (!isControl && !isTarget && !isConnected) return null

  // Determine the symbol for the target
  const getTargetSymbol = () => {
    if (operation.gateType === 'controlled-not') return '⊕'
    if (operation.gateType === 'controlled-z') return '●'
    if (operation.gateType === 'swap') return '×'
    return undefined
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* Vertical connecting line */}
      {isConnected && !isTop && !isBottom && (
        <span className="absolute inset-y-0 w-px bg-[#789b87]" />
      )}

      {/* Control dot (for CNOT and CZ only, not SWAP) */}
      {isControl && !isSwap && (
        <span className="relative z-10 size-3 rounded-full bg-[#1c6b52] ring-4 ring-[#e4f3e8]" />
      )}

      {/* Target gate (or SWAP qubit) */}
      {isTarget && (
        <GateOperation
          operation={operation}
          symbol={getTargetSymbol()}
          selected={selected}
          onSelect={onSelect}
        />
      )}
    </div>
  )
}
