import type { GateDefinition } from '../../types/circuit'
import { useDraggable } from '@dnd-kit/core'
import { Tooltip } from '../ui/Tooltip'
import { GateTooltip } from './GateTooltip'

type GateCardProps = {
  gate: GateDefinition
  isSelected?: boolean
  onSelect: (gate: GateDefinition) => void
}

export function GateCard({ gate, isSelected, onSelect }: GateCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `gate-${gate.name}`,
    data: { kind: 'gate', gate },
  })

  const qubitCount = gate.qubitCount || gate.qubitsRequired
  const requiresParameter = gate.requiresParameters || gate.requiresParameter

  return (
    <Tooltip content={<GateTooltip gate={gate} />}>
      <button
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`
          group relative flex min-h-[72px] w-full min-w-0 flex-col items-center justify-between rounded-lg border p-1.5 text-center transition-all duration-150 ease-out cursor-pointer
          ${isSelected
            ? 'border-[#1c6b52] bg-[#eef7f2] shadow-[0_0_0_1.5px_#1c6b52,0_4px_12px_rgba(28,107,82,0.14)]'
            : 'border-[#dfe7e1] bg-white hover:border-[#84ad98] hover:bg-[#f8fbf9] hover:shadow-[0_2px_8px_rgba(39,66,53,0.06)]'
          }
          ${isDragging ? 'opacity-40 scale-[0.98]' : ''}
          focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#1c6b52]
        `}
        type="button"
        aria-label={`${gate.displayLabel} gate (${gate.symbol}). ${gate.description}`}
        onClick={() => onSelect(gate)}
      >
        {/* Gate Symbol Badge */}
        <div
          className={`
            grid min-h-[26px] min-w-[26px] px-1.5 place-items-center rounded-md font-mono text-[11px] font-bold tracking-tight transition
            ${isSelected
              ? 'bg-[#1c6b52] text-white'
              : 'bg-[#e7f2eb] text-[#1c6b52] group-hover:bg-[#d8ebe0]'
            }
          `}
        >
          {gate.symbol}
        </div>

        {/* Gate Name */}
        <span
          className={`
            mt-1 w-full truncate px-0.5 text-[9px] font-semibold tracking-tight
            ${isSelected ? 'text-[#164e3c]' : 'text-[#2e3b34] group-hover:text-[#17211f]'}
          `}
          title={gate.displayLabel}
        >
          {gate.displayLabel}
        </span>

        {/* Status / Requirements Badges */}
        <div className="mt-0.5 flex flex-wrap items-center justify-center gap-1">
          {qubitCount > 1 && (
            <span className="rounded bg-[#e8f0fe] px-1 py-0.2 text-[7.5px] font-bold uppercase tracking-wider text-[#1a56db]">
              {qubitCount} qubits
            </span>
          )}

          {requiresParameter && (
            <span className="rounded bg-[#fef3c7] px-1 py-0.2 text-[7.5px] font-bold uppercase tracking-wider text-[#92400e]">
              θ Parameter
            </span>
          )}
        </div>
      </button>
    </Tooltip>
  )
}
