import type { GateDefinition } from '../../types/circuit'

export function GatePreview({ gate, overlay = false }: { gate: GateDefinition; overlay?: boolean }) {
  return <div className={`flex aspect-square min-w-[76px] flex-col items-center justify-center gap-2 rounded-xl border border-[#84ad98] bg-white px-3 text-center text-[#1c6b52] shadow-[0_12px_24px_rgba(39,66,53,0.18)] transition-all duration-200 ${overlay ? 'scale-[1.04] shadow-[0_16px_32px_rgba(39,66,53,0.22)]' : ''}`}><span className="grid size-9 place-items-center rounded-lg bg-[#d4ebdc] font-mono text-[12px] font-medium">{gate.symbol}</span><span className="text-[10px] font-bold">{gate.displayLabel}</span></div>
}
