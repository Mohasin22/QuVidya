import { X } from 'lucide-react'
import { gateCategories } from '../gates/gateDefinitions'

type HelpPanelProps = { topic: 'build' | 'gates' | 'shortcuts'; onClose: () => void }

export function HelpPanel({ topic, onClose }: HelpPanelProps) {
  const titles = { build: 'How to build a circuit', gates: 'Gate guide', shortcuts: 'Keyboard shortcuts' }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#17211f]/25 p-5" role="dialog" aria-modal="true" aria-labelledby="help-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="max-h-[min(720px,90vh)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#dbe2dd] bg-white p-6 shadow-[0_24px_60px_rgba(39,66,53,0.2)]">
        <div className="flex items-center justify-between">
          <h2 id="help-title" className="text-lg font-extrabold text-[#17211f]">{titles[topic]}</h2>
          <button className="grid size-8 place-items-center rounded-lg text-[#718078] hover:bg-[#eef3ef] hover:text-[#17211f]" type="button" aria-label="Close help" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        {topic === 'build' && (
          <div className="mt-6 space-y-4 text-[13px] leading-6 text-[#63726a]">
            <p>Select a gate from the left palette, then click a circuit cell to place it. You can also drag a gate onto a highlighted cell.</p>
            <p>For CNOT, CZ, and SWAP, click the first qubit and then the second qubit in the same column. Select an existing operation and press Delete to remove it.</p>
            <p>Run the circuit to update the histogram, state vector, and Bloch Sphere when the circuit supports them.</p>
          </div>
        )}
        {topic === 'gates' && (
          <div className="mt-6 space-y-5">
            {gateCategories.map((category) => (
              <div key={category.type}>
                <h3 className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#78857e]">{category.label}</h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {category.gates.map((gate) => (
                    <div key={gate.id} className="rounded-xl border border-[#e5ebe6] p-3">
                      <div className="flex items-center gap-2">
                        <span className="grid size-8 place-items-center rounded-lg bg-[#e5f2e9] font-mono text-[11px] text-[#1c6b52]">{gate.symbol}</span>
                        <strong className="text-[12px]">{gate.name}</strong>
                      </div>
                      <p className="mt-2 text-[11px] leading-5 text-[#718078]">{gate.educationalExplanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {topic === 'shortcuts' && (
          <div className="mt-6 space-y-3">
            <Shortcut keys="⌘/Ctrl + Z" label="Undo last action" />
            <Shortcut keys="⌘/Ctrl + Shift + Z" label="Redo last action" />
            <Shortcut keys="Delete / Backspace" label="Delete selected gate" />
            <Shortcut keys="Escape" label="Cancel selection / close menus" />
          </div>
        )}
      </section>
    </div>
  )
}

function Shortcut({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-[#f4f7f4] px-3 py-2">
      <kbd className="font-mono text-[10px] text-[#1c6b52]">{keys}</kbd>
      <span>{label}</span>
    </div>
  )
}