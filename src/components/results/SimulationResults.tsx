import { BarChart3 } from 'lucide-react'
import { ProbabilityChart } from './ProbabilityChart'
import { QSphere } from './QSphere'
import type { SimulationState } from '../../types/simulation'
import { useCircuitStore } from '../../store/circuitStore'

export function SimulationResults({ simulation }: { simulation: SimulationState }) {
  const circuit = useCircuitStore((state) => state.circuit)
  const result = simulation.result
  const hasRunSimulation = simulation.status === 'success' && result

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-[#1c6b52]" />
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#9aa49f]">Results</p>
            <h2 className="mt-1 text-[14px] font-extrabold">Simulation Insights</h2>
          </div>
        </div>
        {result && <span className="font-mono text-[10px] text-[#718078]">{result.shots} shots</span>}
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
          <p className="text-[11px] font-medium text-[#87938d]">Run a circuit simulation to see results</p>
        </div>
      )}

      {hasRunSimulation && (
        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="min-h-[300px] rounded-xl border border-[#e5ebe6] bg-white p-4">
            <ProbabilityChart result={result} qubits={circuit.qubits} />
          </div>
          <div className="min-h-[300px] rounded-xl border border-[#e5ebe6] bg-white p-4">
            <QSphere result={result} qubits={circuit.qubits} />
          </div>
        </div>
      )}
    </div>
  )
}