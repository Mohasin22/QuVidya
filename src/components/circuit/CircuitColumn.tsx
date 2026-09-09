import type { QuantumOperation } from '../../types/circuit'
import { useDndContext, useDroppable } from '@dnd-kit/core'
import { ControlledGate } from './ControlledGate'
import { GateOperation } from './GateOperation'

type CircuitColumnProps = {
  column: number
  qubitIndex: number
  operations: QuantumOperation[]
  qubitCount: number
  selectedOperationId?: string
  onCellClick: (column: number, qubitIndex: number) => void
  onOperationSelect: (operation: QuantumOperation) => void
}

export function CircuitColumn({ column, qubitIndex, operations, qubitCount, selectedOperationId, onCellClick, onOperationSelect }: CircuitColumnProps) {
  const operation = operations.find((item) => item.targetQubits.includes(qubitIndex) || item.controlQubit === qubitIndex || isBetweenControlAndTarget(item, qubitIndex))
  const { isOver, setNodeRef } = useDroppable({ id: `cell-${column}-${qubitIndex}`, data: { column, qubitIndex } })
  const { active } = useDndContext()
  const isValidDrop = active ? canDrop(active.data.current, column, qubitIndex, qubitCount, operations) : false
  const isControlled = operation?.controlQubit !== undefined
  const isMultiQubit = operation ? operation.targetQubits.length > 1 || isControlled : false
  const isOperationVisible = operation && (operation.targetQubits.includes(qubitIndex) || operation.controlQubit === qubitIndex || isBetweenControlAndTarget(operation, qubitIndex))

  return (
    <div 
      ref={setNodeRef} 
      className={`relative flex h-16 w-[76px] shrink-0 items-center justify-center border-l border-[#edf1ee] first:border-l-0 transition-all duration-200 ease-out hover:bg-[#f4faf5] ${isOver && isValidDrop ? 'bg-[#dff2e8] ring-1 ring-inset ring-[#75a789]' : ''} ${isOver && !isValidDrop ? 'bg-[#fff5f2] ring-1 ring-inset ring-[#d9a59a]' : ''}`} 
      data-column={column} 
      role="button" 
      tabIndex={0} 
      aria-label={`Place gate at qubit ${qubitIndex}, column ${column}`} 
      onClick={() => onCellClick(column, qubitIndex)} 
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onCellClick(column, qubitIndex) }}
    >
      {isOperationVisible && operation && (isMultiQubit ? <ControlledGate operation={operation} qubitIndex={qubitIndex} selected={operation.id === selectedOperationId} onSelect={onOperationSelect} /> : operation.targetQubits[0] === qubitIndex ? <GateOperation operation={operation} selected={operation.id === selectedOperationId} onSelect={onOperationSelect} /> : null)}
    </div>
  )
}

function canDrop(data: unknown, column: number, qubitIndex: number, qubitCount: number, operations: QuantumOperation[]) {
  const payload = data as { kind?: string; gate?: { qubitsRequired: number; name: string }; operation?: QuantumOperation } | undefined
  let occupiedQubits: number[]
  let ignoredOperationId: string | undefined
  if (payload?.kind === 'gate' && payload.gate) {
    occupiedQubits = payload.gate.qubitsRequired === 1 ? [qubitIndex] : [qubitIndex, qubitIndex + 1]
  } else if (payload?.kind === 'operation' && payload.operation) {
    const operation = payload.operation
    const anchor = operation.controlQubit ?? Math.min(...operation.targetQubits)
    const offset = qubitIndex - anchor
    occupiedQubits = operation.targetQubits.map((target) => target + offset)
    if (operation.controlQubit !== undefined) occupiedQubits.push(operation.controlQubit + offset)
    ignoredOperationId = operation.id
  } else return false

  if (occupiedQubits.some((qubit) => qubit < 0 || qubit >= qubitCount) || new Set(occupiedQubits).size !== occupiedQubits.length) return false
  return !operations.some((operation) => operation.id !== ignoredOperationId && operation.column === column && [...operation.targetQubits, ...(operation.controlQubit === undefined ? [] : [operation.controlQubit])].some((qubit) => occupiedQubits.includes(qubit)))
}

function isBetweenControlAndTarget(operation: QuantumOperation, qubitIndex: number) {
  // For SWAP gates, check if qubit is between the two target qubits
  if (operation.gateType === 'swap' && operation.targetQubits.length === 2) {
    const minQubit = Math.min(...operation.targetQubits)
    const maxQubit = Math.max(...operation.targetQubits)
    return qubitIndex > minQubit && qubitIndex < maxQubit
  }

  // For other controlled gates, check if qubit is between control and target
  if (operation.controlQubit === undefined || operation.targetQubits.length === 0) return false
  const minQubit = Math.min(operation.controlQubit, ...operation.targetQubits)
  const maxQubit = Math.max(operation.controlQubit, ...operation.targetQubits)
  return qubitIndex > minQubit && qubitIndex < maxQubit
}
