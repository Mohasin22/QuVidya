import { BarChart3 } from 'lucide-react'
import { BlochSphere } from './BlochSphere'
import { Histogram } from './Histogram'
import { StateVector } from './StateVector'
import type { SimulationState } from '../../types/simulation'

export function ResultsPanel({ simulation }: { simulation: SimulationState }) {
  const result = simulation.result
  const hasMeasurementData = result && result.counts && Object.keys(result.counts).length > 0
  const hasStateVector = result && result.stateVector && result.stateVector.length > 0
  const hasRunSimulation = simulation.status === 'success' && result

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-[#1c6b52]" />
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#9aa49f]">Results</p>
            <h2 className="mt-1 text-[16px] font-extrabold">Simulation insights</h2>
          </div>
        </div>
        {result && <span className="font-mono text-[10px] text-[#718078]">{result.shots} shots</span>}
      </div>

      {simulation.status === 'loading' && (
        <div className="rounded-xl border border-[#cfe2d5] bg-[#f1f9f3] px-4 py-3 text-[11px] font-semibold text-[#1c6b52]">
          Running simulation...
        </div>
      )}

      {simulation.status === 'error' && (
        <div className="rounded-xl border border-[#e8caca] bg-[#fff5f5] px-4 py-3 text-[11px] font-semibold text-[#a44b4b]">
          {simulation.error}
        </div>
      )}

      {!hasRunSimulation && simulation.status !== 'loading' && simulation.status !== 'error' && (
        <div className="rounded-xl border border-[#dbe2dd] bg-[#f8f9f7] px-4 py-8 text-center">
          <p className="text-[11px] font-medium text-[#87938d]">Run a circuit simulation to see results</p>
        </div>
      )}

      {hasRunSimulation && (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {hasMeasurementData && (
            <Histogram counts={result.counts} probabilities={result.probabilities} />
          )}
          {hasStateVector && (
            <StateVector stateVector={result.stateVector} />
          )}
          {hasStateVector && (
            <BlochSphere simulation={simulation} />
          )}
        </div>
      )}
    </section>
  )
}
