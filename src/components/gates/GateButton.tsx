import type { GateDefinition } from '../../types/circuit'
import { useDraggable } from '@dnd-kit/core'
import { Tooltip } from '../ui/Tooltip'

type GateButtonProps = {
  gate: GateDefinition
  onSelect: (gate: GateDefinition) => void
}

export function GateButton({ gate, onSelect }: GateButtonProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `gate-${gate.name}`, data: { kind: 'gate', gate } })

  return (
    <Tooltip content={<GateTooltip gate={gate} />}>
    <button 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes} 
      className={`group flex aspect-square min-w-0 flex-col items-center justify-center gap-2 rounded-xl border border-[#dfe7e1] bg-white px-1.5 text-center transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.03] hover:border-[#84ad98] hover:bg-[#f7fbf8] hover:shadow-[0_8px_20px_rgba(39,66,53,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1c6b52] ${isDragging ? 'opacity-50 scale-[1.04] shadow-[0_12px_28px_rgba(39,66,53,0.18)]' : ''}`} 
      type="button" 
      aria-label={`${gate.name}. ${gate.description}`} 
      onClick={() => onSelect(gate)}
    >
      <span className="grid size-9 place-items-center rounded-lg bg-[#e5f2e9] font-mono text-[12px] font-medium text-[#1c6b52] transition group-hover:bg-[#d4ebdc]">{gate.symbol}</span>
      <span className="w-full truncate text-[10px] font-bold text-[#34423b]">{gate.displayLabel}</span>
      {gate.requiresParameters && <span className="font-mono text-[8px] text-[#a0782f]">theta parameter</span>}
    </button>
    </Tooltip>
  )
}

function GateTooltip({ gate }: { gate: GateDefinition }) {
  return <div><div className="flex items-center justify-between gap-3"><strong className="text-[12px]">{gate.name.replace(/(^|-)/g, (_, character) => character === '-' ? ' ' : character).replace(/\b\w/g, (character) => character.toUpperCase())}</strong><span className="rounded-md bg-[#e5f2e9] px-2 py-1 font-mono text-[11px] font-medium text-[#1c6b52]">{gate.symbol}{gate.requiresParameters ? '(θ)' : ''}</span></div><p className="mt-2 text-[10px] leading-4 text-[#68766e]">{gate.educationalExplanation}</p><div className="mt-3 flex items-center justify-between border-t border-[#edf1ee] pt-2 text-[9px] text-[#87938d]"><span>Qubits: {gate.qubitsRequired}</span><span>{gate.parameters.length ? `Parameter: ${gate.parameters.join(', ')}` : 'No parameters'}</span></div></div>
}