import { useState } from 'react'
import { BarChart3, Maximize2 } from 'lucide-react'
import { ProbabilityChart } from './ProbabilityChart'
import { QSphere } from './QSphere'
import { SimulationEnlargeModal } from './SimulationEnlargeModal'
import type { SimulationState } from '../../types/simulation'
import { useCircuitStore } from '../../store/circuitStore'

export function SimulationResults({ simulation }: { simulation: SimulationState }) {
  const circuit = useCircuitStore((state) => state.circuit)
  const result = simulation.result
  const hasRunSimulation = simulation.status === 'success' && Boolean(result)

  const [enlargeMode, setEnlargeMode] = useState<'split' | 'probability' | 'qsphere' | null>(null)

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-[#1c6b52]" />
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#9aa49f]">
              Results
            </p>
            <h2 className="mt-1 text-[14px] font-extrabold">Simulation Insights</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {result && (
            <span className="font-mono text-[10px] text-[#718078]">{result.shots} shots</span>
          )}
          {hasRunSimulation && result && (
            <button
              type="button"
              onClick={() => setEnlargeMode('split')}
              className="flex items-center gap-1.5 rounded-lg border border-[#cfe2d5] bg-[#f1f9f3] px-2.5 py-1 text-[11px] font-bold text-[#1c6b52] transition hover:bg-[#e2f1e6] hover:text-[#124d3a] shadow-xs cursor-pointer"
              title="Enlarge Simulation Insights for analysis"
            >
              <Maximize2 size={13} />
              <span>Enlarge</span>
            </button>
          )}
        </div>
      </div>

      {simulation.status === 'loading' && (
        <div className="flex-1 flex items-center justify-center rounded-xl border border-[#cfe2d5] bg-[#f1f9f3] px-4 py-3 text-[11px] font-semibold text-[#1c6b52]">
          Running simulation...
        </div>
      )}

      {simulation.status === 'error' && (
        <div className="flex-1 flex items-center justify-center rounded-xl border border-[#e8caca] bg-[#fff5f5] px-4 py-3 text-[11px] font-semibold text-[#a44b4b]">
          {simulation.error}
        </div>
      )}

      {!hasRunSimulation && simulation.status !== 'loading' && simulation.status !== 'error' && (
        <div className="flex-1 flex items-center justify-center rounded-xl border border-[#dbe2dd] bg-[#f8f9f7] px-4 py-8 text-center">
          <p className="text-[11px] font-medium text-[#87938d]">
            Run a circuit simulation to see results
          </p>
        </div>
      )}

      {hasRunSimulation && result && (
        <>
          <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="min-h-[300px] rounded-xl border border-[#e5ebe6] bg-white p-4 flex flex-col">
              <ProbabilityChart
                result={result}
                qubits={circuit.qubits}
                onEnlarge={() => setEnlargeMode('probability')}
              />
            </div>
            <div className="min-h-[300px] rounded-xl border border-[#e5ebe6] bg-white p-4 flex flex-col">
              <QSphere
                result={result}
                qubits={circuit.qubits}
                onEnlarge={() => setEnlargeMode('qsphere')}
              />
            </div>
          </div>

          {enlargeMode && (
            <SimulationEnlargeModal
              isOpen={Boolean(enlargeMode)}
              onClose={() => setEnlargeMode(null)}
              result={result}
              qubits={circuit.qubits}
              initialTab={enlargeMode}
            />
          )}
        </>
      )}
    </div>
  )
}