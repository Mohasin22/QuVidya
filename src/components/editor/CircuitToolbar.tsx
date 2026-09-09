import { Eraser, Minus, Play, Plus, Redo2, RotateCcw, Undo2, ZoomIn, ZoomOut } from 'lucide-react'

type CircuitToolbarProps = {
  onAddQubit: () => void
  onRemoveQubit: () => void
  onClearCircuit: () => void
  onResetCircuit: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onRun: () => void
  isRunning: boolean
  activeMenu?: 'File' | 'Edit' | 'View' | 'Help'
  onMenuChange: (menu?: 'File' | 'Edit' | 'View' | 'Help') => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
}

export function CircuitToolbar({ onAddQubit, onRemoveQubit, onClearCircuit, onResetCircuit, onUndo, onRedo, canUndo, canRedo, onRun, isRunning, activeMenu, onMenuChange, onZoomIn, onZoomOut, onZoomReset }: CircuitToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe2dd] bg-[#fbfcfa] px-5 py-2.5 sm:px-8">
      <div className="flex min-w-0 items-center gap-3"><span className="truncate text-[12px] font-extrabold">Bell state experiment</span><div className="flex items-center gap-1 overflow-x-auto border-l border-[#dbe2dd] pl-3">{(['File', 'Edit', 'View', 'Help'] as const).map((item) => <button key={item} className={`shrink-0 rounded-md px-2 py-1.5 text-[11px] font-semibold transition ${activeMenu === item ? 'bg-white text-[#17211f]' : 'text-[#6d7975] hover:bg-white hover:text-[#17211f]'}`} type="button" aria-expanded={activeMenu === item} onClick={() => onMenuChange(activeMenu === item ? undefined : item)}>{item}</button>)}</div></div>
      <div className="flex flex-wrap items-center gap-1">
        <ToolbarButton label="Undo" icon={<Undo2 size={14} />} onClick={onUndo} disabled={!canUndo} /><ToolbarButton label="Redo" icon={<Redo2 size={14} />} onClick={onRedo} disabled={!canRedo} /><span className="mx-1 h-5 w-px bg-[#e0e7e1]" /><ToolbarButton label="Zoom out" icon={<ZoomOut size={14} />} onClick={onZoomOut} /><ToolbarButton label="Zoom in" icon={<ZoomIn size={14} />} onClick={onZoomIn} /><ToolbarButton label="Reset zoom" icon={<span className="text-[9px] font-bold">100%</span>} onClick={onZoomReset} />
        <button className="ml-2 flex items-center gap-1.5 rounded-lg bg-[#193d32] px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-[#245846] disabled:cursor-wait disabled:opacity-70" type="button" onClick={onRun} disabled={isRunning}><Play size={12} fill="currentColor" /> {isRunning ? 'Simulating...' : 'Run circuit'}</button>
        <button className="ml-1 flex items-center gap-1.5 rounded-lg border border-dashed border-[#c9d6cd] px-2.5 py-1.5 text-[10px] font-bold text-[#718078] transition hover:border-[#1c6b52] hover:text-[#1c6b52]" type="button" onClick={onAddQubit}><Plus size={13} /> Add qubit</button>
        <button className="flex size-7 items-center justify-center rounded-md text-[#87938d] transition hover:bg-white hover:text-[#1c6b52]" type="button" aria-label="Remove qubit" title="Remove qubit" onClick={onRemoveQubit}><Minus size={14} /></button>
        <button className="flex size-7 items-center justify-center rounded-md text-[#87938d] transition hover:bg-white hover:text-[#1c6b52]" type="button" aria-label="Clear circuit" title="Clear circuit" onClick={onClearCircuit}><Eraser size={14} /></button>
        <button className="flex size-7 items-center justify-center rounded-md text-[#87938d] transition hover:bg-white hover:text-[#1c6b52]" type="button" aria-label="Reset circuit" title="Reset circuit" onClick={onResetCircuit}><RotateCcw size={14} /></button>
      </div>
    </div>
  )
}

function ToolbarButton({ label, icon, onClick, disabled = false }: { label: string; icon: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return <button className="grid size-7 place-items-center rounded-md text-[#87938d] transition hover:bg-white hover:text-[#1c6b52] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#87938d]" type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}>{icon}</button>
}
