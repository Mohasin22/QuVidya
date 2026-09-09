import type { QuantumOperation } from '../../types/circuit'
import { useDraggable } from '@dnd-kit/core'

type GateOperationProps = {
  operation: QuantumOperation
  selected?: boolean
  onSelect?: (operation: QuantumOperation) => void
  symbol?: string
}

export function GateOperation({ operation, selected = false, onSelect, symbol }: GateOperationProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `operation-${operation.id}`, data: { kind: 'operation', operation } })
  const labels: Record<string, string> = { hadamard: 'H', 'pauli-x': 'X', 'pauli-y': 'Y', 'pauli-z': 'Z', identity: 'I', s: 'S', 's-dagger': 'S†', t: 'T', 't-dagger': 'T†', phase: 'P', 'rotation-x': 'Rx', 'rotation-y': 'Ry', 'rotation-z': 'Rz', 'controlled-not': '⊕', 'controlled-z': '●', swap: '×', measurement: 'M', barrier: '||' }
  const label = symbol ?? labels[operation.gateType] ?? '?'

  return (
    <button 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes} 
      className={`relative z-10 grid size-10 place-items-center rounded-lg border font-mono text-[11px] font-medium shadow-[0_2px_5px_rgba(39,66,53,0.1)] transition-all duration-200 ease-out ${selected ? 'border-[#c18a2e] bg-[#fff0cf] text-[#8e641e] ring-2 ring-[#f4dca5]' : 'border-[#8bb59a] bg-[#e4f3e8] text-[#1c6b52] hover:-translate-y-0.5 hover:border-[#1c6b52] hover:shadow-[0_4px_12px_rgba(39,66,53,0.15)]'} ${isDragging ? 'opacity-50 scale-[1.04] shadow-[0_8px_20px_rgba(39,66,53,0.2)]' : 'animate-gate-settle'}`} 
      type="button" 
      title={`${operation.gateType} · column ${operation.column}`} 
      onClick={(event) => { event.stopPropagation(); onSelect?.(operation) }}
    >
      {label}
      {operation.parameters && <span className="absolute -bottom-4 whitespace-nowrap font-mono text-[8px] text-[#9a752c]">θ</span>}
    </button>
  )
}
