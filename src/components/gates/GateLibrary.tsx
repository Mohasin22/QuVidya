import { Grid2x2, LockKeyhole } from 'lucide-react'
import type { GateDefinition } from '../../types/circuit'
import { gateCategories } from './gateDefinitions'
import { GateButton } from './GateButton'

type GateLibraryProps = {
  selectedGate?: GateDefinition
  onGateSelect: (gate: GateDefinition) => void
}

export function GateLibrary({ selectedGate, onGateSelect }: GateLibraryProps) {
  const handleGateSelect = (gate: GateDefinition) => {
    onGateSelect(gate)
  }

  return <section className="bg-white p-5 sm:p-6 lg:bg-transparent lg:p-0"><div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#9aa49f]">Operations</p><h2 className="mt-1 text-[16px] font-extrabold">Quantum gates</h2></div><Grid2x2 size={17} className="text-[#9aa49f]" /></div>{selectedGate && <div className="mb-4 rounded-lg bg-[#dff2e8] px-3 py-2 text-[10px] font-bold text-[#1c6b52]">Selected: {selectedGate.displayLabel}<span className="ml-1 font-normal text-[#56816a]">Click a circuit cell</span></div>}<div className="space-y-6">{gateCategories.map((category) => <div key={category.type}><div className="mb-2 flex items-center justify-between"><h3 className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#78857e]">{category.label}</h3><span className="font-mono text-[9px] text-[#adb7b0]">{category.gates.length.toString().padStart(2, '0')}</span></div><div className="grid grid-cols-3 gap-2">{category.gates.map((gate) => <GateButton key={gate.name} gate={gate} onSelect={handleGateSelect} />)}</div></div>)}</div><div className="mt-6 flex items-center gap-2 border-t border-[#e5ebe6] pt-4 text-[10px] text-[#9aa49f]"><LockKeyhole size={13} /> Click an operation to select it</div></section>
}
