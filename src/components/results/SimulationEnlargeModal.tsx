import { useEffect, useState } from 'react'
import { BarChart3, Columns, Globe2, Maximize2, X } from 'lucide-react'
import { ProbabilityChart } from './ProbabilityChart'
import { QSphere } from './QSphere'
import type { SimulationResult } from '../../types/simulation'

type SimulationEnlargeModalProps = {
  isOpen: boolean
  onClose: () => void
  result: SimulationResult
  qubits: number
  initialTab?: 'split' | 'probability' | 'qsphere'
}

export function SimulationEnlargeModal({
  isOpen,
  onClose,
  result,
  qubits,
  initialTab = 'split',
}: SimulationEnlargeModalProps) {
  const [activeTab, setActiveTab] = useState<'split' | 'probability' | 'qsphere'>(initialTab)

  // Update tab if initialTab changes when opening
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const activeStatesCount = Object.values(result.probabilities).filter((p) => p > 0.0001).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#17211f]/65 backdrop-blur-xs p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="simulation-enlarge-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex h-[92vh] w-full max-w-7xl flex-col rounded-2xl border border-[#dbe2dd] bg-white shadow-[0_24px_70px_rgba(23,33,31,0.28)] overflow-hidden">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5ebe6] bg-[#fbfdfb] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#e5f2e9] text-[#1c6b52] shadow-xs">
              <BarChart3 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#76857e]">
                  Simulation Analysis
                </span>
                <span className="rounded-md bg-[#eaf4ed] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#1c6b52]">
                  {qubits} Qubits
                </span>
                <span className="rounded-md bg-[#f0f4f1] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#55655d]">
                  {result.shots} Shots
                </span>
                <span className="rounded-md bg-[#f0f4f1] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#55655d]">
                  {activeStatesCount} Active {activeStatesCount === 1 ? 'State' : 'States'}
                </span>
              </div>
              <h2 id="simulation-enlarge-title" className="text-[15px] font-extrabold text-[#17211f]">
                Simulation Insights Detailed View
              </h2>
            </div>
          </div>

          {/* View Switcher Segmented Control */}
          <div className="flex items-center gap-1 rounded-xl border border-[#dbe2dd] bg-[#edf2ee] p-1">
            <button
              type="button"
              onClick={() => setActiveTab('split')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                activeTab === 'split'
                  ? 'bg-white text-[#1c6b52] shadow-xs'
                  : 'text-[#63726a] hover:text-[#17211f]'
              }`}
            >
              <Columns size={13} />
              <span>Split View</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('probability')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                activeTab === 'probability'
                  ? 'bg-white text-[#1c6b52] shadow-xs'
                  : 'text-[#63726a] hover:text-[#17211f]'
              }`}
            >
              <BarChart3 size={13} />
              <span>Probability Distribution</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('qsphere')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                activeTab === 'qsphere'
                  ? 'bg-white text-[#1c6b52] shadow-xs'
                  : 'text-[#63726a] hover:text-[#17211f]'
              }`}
            >
              <Globe2 size={13} />
              <span>Q-Sphere 3D</span>
            </button>
          </div>

          {/* Close button */}
          <div className="flex items-center gap-2">
            <span className="hidden text-[10px] text-[#88978f] sm:inline">Press Esc to exit</span>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg text-[#6d7b74] transition hover:bg-[#eef3ef] hover:text-[#17211f]"
              aria-label="Close enlarged view"
            >
              <X size={17} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#f8faf8] p-4 sm:p-6">
          {activeTab === 'split' && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="min-h-[550px] flex flex-col rounded-2xl border border-[#e2e8e3] bg-white p-5 shadow-xs">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1c6b52]">
                    Distribution Focus
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('probability')}
                    className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold text-[#55655d] transition hover:bg-[#edf2ee] hover:text-[#17211f]"
                  >
                    <Maximize2 size={11} /> Maximize
                  </button>
                </div>
                <div className="flex-1">
                  <ProbabilityChart result={result} qubits={qubits} enlarged={true} />
                </div>
              </div>

              <div className="min-h-[550px] flex flex-col rounded-2xl border border-[#e2e8e3] bg-white p-5 shadow-xs">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1c6b52]">
                    Q-Sphere 3D Focus
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('qsphere')}
                    className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold text-[#55655d] transition hover:bg-[#edf2ee] hover:text-[#17211f]"
                  >
                    <Maximize2 size={11} /> Maximize
                  </button>
                </div>
                <div className="flex-1">
                  <QSphere result={result} qubits={qubits} enlarged={true} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'probability' && (
            <div className="mx-auto max-w-6xl rounded-2xl border border-[#e2e8e3] bg-white p-6 shadow-xs">
              <ProbabilityChart result={result} qubits={qubits} enlarged={true} fullPageMode={true} />
            </div>
          )}

          {activeTab === 'qsphere' && (
            <div className="mx-auto max-w-6xl rounded-2xl border border-[#e2e8e3] bg-white p-6 shadow-xs">
              <QSphere result={result} qubits={qubits} enlarged={true} fullPageMode={true} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
