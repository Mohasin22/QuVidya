import { ChevronRight, Grid2x2, Waves, RotateCw, Network, Sliders } from 'lucide-react'
import type { GateCategory as GateCategoryType } from '../gates/gateDefinitions'
import type { GateDefinition } from '../../types/circuit'
import { GateCard } from './GateCard'

type GateCategoryProps = {
  category: GateCategoryType
  isExpanded: boolean
  onToggle: () => void
  selectedGate?: GateDefinition
  onGateSelect: (gate: GateDefinition) => void
}

function getCategoryIcon(iconName: string) {
  switch (iconName) {
    case 'grid':
      return <Grid2x2 size={15} className="text-[#84948a] shrink-0" />
    case 'wave':
      return <Waves size={15} className="text-[#84948a] shrink-0" />
    case 'rotate':
      return <RotateCw size={15} className="text-[#84948a] shrink-0" />
    case 'nodes':
      return <Network size={15} className="text-[#84948a] shrink-0" />
    case 'settings':
      return <Sliders size={15} className="text-[#84948a] shrink-0" />
    default:
      return <Grid2x2 size={15} className="text-[#84948a] shrink-0" />
  }
}

export function GateCategory({
  category,
  isExpanded,
  onToggle,
  selectedGate,
  onGateSelect,
}: GateCategoryProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#e5ebe6] bg-white transition-colors duration-150">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-[#f6faf7] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#1c6b52]"
      >
        <div className="flex items-center gap-2 min-w-0">
          {getCategoryIcon(category.icon)}
          <span className="truncate text-[11px] font-bold uppercase tracking-[0.1em] text-[#4d5d54]">
            {category.name}
          </span>
          <span className="rounded bg-[#f0f4f1] px-1.5 py-0.2 font-mono text-[9px] font-semibold text-[#839389]">
            {category.gates.length.toString().padStart(2, '0')}
          </span>
        </div>

        <ChevronRight
          size={15}
          className={`shrink-0 text-[#9aa49f] transition-transform duration-200 ease-out ${
            isExpanded ? 'rotate-90' : 'rotate-0'
          }`}
        />
      </button>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="border-t border-[#f0f4f2] bg-[#fbfdfc] p-2">
          <div className="grid grid-cols-3 gap-1.5">
            {category.gates.map((gate) => (
              <GateCard
                key={gate.name}
                gate={gate}
                isSelected={selectedGate?.name === gate.name}
                onSelect={onGateSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
