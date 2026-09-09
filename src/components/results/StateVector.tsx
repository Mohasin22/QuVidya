import type { StateVectorAmplitude } from '../../types/simulation'

type StateVectorProps = {
  stateVector?: StateVectorAmplitude[] | null
}

export function StateVector({ stateVector }: StateVectorProps) {
  const nonZeroStates = stateVector?.filter((state) => Math.abs(state.real) > 0.000001 || Math.abs(state.imaginary) > 0.000001) ?? []
  const hasData = stateVector !== null && stateVector !== undefined && nonZeroStates.length > 0

  return (
    <div className="rounded-xl border border-[#e5ebe6] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold">State vector</p>
        <span className="font-mono text-[9px] text-[#9aa49f]">amplitudes</span>
      </div>
      {stateVector === null ? (
        <p className="mt-4 text-[10px] leading-5 text-[#87938d]">
          State vector is unavailable for measurement circuits. Probabilities are shown in the histogram.
        </p>
      ) : hasData ? (
        <div className="mt-4 max-h-40 space-y-3 overflow-y-auto pr-1">
          {nonZeroStates.map((state) => (
            <div key={state.basisState} className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1">
              <span className="font-mono text-[13px] font-medium text-[#1c6b52]">{state.basisState}</span>
              <span className="text-right text-[9px] uppercase tracking-[0.12em] text-[#9aa49f]">amplitude</span>
              <span className="col-span-2 font-mono text-[11px] text-[#5d6c64]">{state.amplitude}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-[10px] leading-5 text-[#87938d]">
          Run a circuit without measurement to see its amplitudes.
        </p>
      )}
    </div>
  )
}
