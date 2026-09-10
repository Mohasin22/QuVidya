import { useState } from 'react'
import { Filter, Maximize2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { SimulationResult } from '../../types/simulation'

type ProbabilityChartProps = {
  result: SimulationResult
  qubits: number
  enlarged?: boolean
  fullPageMode?: boolean
  onEnlarge?: () => void
}

type ProbabilityDatum = {
  state: string
  probability: number
  percentage: number
  highlighted: boolean
  count?: number
  amplitudeReal?: number
  amplitudeImag?: number
  phaseDeg?: number
}

export function ProbabilityChart({
  result,
  qubits,
  enlarged = false,
  fullPageMode = false,
  onEnlarge,
}: ProbabilityChartProps) {
  const [showNonZeroOnly, setShowNonZeroOnly] = useState(false)

  // Generate all possible basis states for the given number of qubits
  const allStates = Array.from({ length: 2 ** qubits }, (_, i) =>
    i.toString(2).padStart(qubits, '0')
  )

  // Lookup map for state vector values if available
  const stateVectorMap = new Map<string, { real: number; imaginary: number }>()
  if (result.stateVector) {
    for (const sv of result.stateVector) {
      const cleanState = sv.basisState.replace(/[|⟩]/g, '').trim()
      stateVectorMap.set(cleanState, { real: sv.real, imaginary: sv.imaginary })
    }
  }

  // Create data with all states, highlighting those with non-zero probability
  const data: ProbabilityDatum[] = allStates.map((state) => {
    const probability = result.probabilities[state] ?? 0
    const percentage = probability * 100
    const count = result.counts ? result.counts[state] ?? 0 : undefined
    const sv = stateVectorMap.get(state)

    let phaseDeg: number | undefined
    if (sv) {
      const phaseRad = Math.atan2(sv.imaginary, sv.real)
      phaseDeg = Math.round(((phaseRad >= 0 ? phaseRad : phaseRad + 2 * Math.PI) * 180) / Math.PI)
    }

    return {
      state,
      probability,
      percentage,
      highlighted: probability > 0.0001,
      count,
      amplitudeReal: sv?.real,
      amplitudeImag: sv?.imaginary,
      phaseDeg,
    }
  })

  // Sort by state for consistent ordering
  data.sort((a, b) => a.state.localeCompare(b.state))

  const nonZeroCount = data.filter((d) => d.highlighted).length
  const displayData = showNonZeroOnly && nonZeroCount > 0 ? data.filter((d) => d.highlighted) : data

  // Determine if X-axis labels need angle rotation to prevent overlapping
  // Rotated at -45° whenever states exceed 4 or in normal card view with >= 3 qubits
  const needsRotation = displayData.length > 4 || (!enlarged && qubits >= 3)

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: Array<{ payload: ProbabilityDatum }>
  }) => {
    if (!active || !payload?.length) return null
    const datum = payload[0].payload
    return (
      <div className="rounded-xl border border-[#dbe2dd] bg-white px-4 py-3 shadow-[0_10px_25px_rgba(39,66,53,0.14)]">
        <p className="font-mono text-[12px] font-extrabold text-[#17211f]">|{datum.state}⟩</p>
        <div className="mt-2 space-y-1 text-[11px] text-[#63726a]">
          <p className="flex justify-between gap-4">
            <span>Probability:</span>
            <strong className="font-mono text-[#1c6b52]">{datum.percentage.toFixed(2)}%</strong>
          </p>
          <p className="flex justify-between gap-4">
            <span>Decimal:</span>
            <strong className="font-mono text-[#1c6b52]">{datum.probability.toFixed(4)}</strong>
          </p>
          {datum.count !== undefined && (
            <p className="flex justify-between gap-4">
              <span>Shots:</span>
              <strong className="font-mono text-[#1c6b52]">
                {datum.count} / {result.shots}
              </strong>
            </p>
          )}
          {datum.amplitudeReal !== undefined && datum.amplitudeImag !== undefined && (
            <p className="flex justify-between gap-4">
              <span>Amplitude:</span>
              <span className="font-mono text-[#405047]">
                {datum.amplitudeReal.toFixed(3)} {datum.amplitudeImag >= 0 ? '+' : ''}
                {datum.amplitudeImag.toFixed(3)}i
              </span>
            </p>
          )}
          {datum.phaseDeg !== undefined && (
            <p className="flex justify-between gap-4">
              <span>Phase:</span>
              <span className="font-mono font-semibold text-[#8a6fa8]">{datum.phaseDeg}°</span>
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header with Title and Controls */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`font-extrabold text-[#17211f] ${enlarged ? 'text-[14px]' : 'text-[12px]'}`}>
              Probability Distribution
            </h3>
            {enlarged && (
              <span className="rounded-md bg-[#edf5ef] px-2 py-0.5 font-mono text-[10px] font-bold text-[#1c6b52]">
                {displayData.length} {displayData.length === 1 ? 'state' : 'states'} shown
              </span>
            )}
          </div>
          <p className="text-[10px] text-[#87938d]">Computational basis states |x⟩</p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Non-zero toggle filter */}
          {nonZeroCount > 0 && nonZeroCount < data.length && (
            <button
              type="button"
              onClick={() => setShowNonZeroOnly(!showNonZeroOnly)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                showNonZeroOnly
                  ? 'border border-[#1c6b52] bg-[#1c6b52] text-white shadow-xs'
                  : 'border border-[#dbe2dd] bg-[#f8faf8] text-[#55655d] hover:bg-[#eef3ef]'
              }`}
              title="Filter between all states and non-zero probability states"
            >
              <Filter size={10} />
              <span>{showNonZeroOnly ? 'Non-zero only' : 'All states'}</span>
            </button>
          )}

          {/* Legend */}
          <div className="hidden sm:flex items-center gap-2.5 border-l border-[#e5ebe6] pl-2.5">
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded bg-[#1c6b52]" />
              <span className="text-[9px] font-medium text-[#6d7975]">Non-zero</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded bg-[#e5ebe6]" />
              <span className="text-[9px] font-medium text-[#6d7975]">Zero</span>
            </div>
          </div>

          {/* Enlarge Button */}
          {onEnlarge && (
            <button
              type="button"
              onClick={onEnlarge}
              className="flex size-7 items-center justify-center rounded-lg border border-[#cfe2d5] bg-[#f1f9f3] text-[#1c6b52] transition hover:bg-[#e2f1e6] hover:text-[#124d3a] shadow-xs"
              title="Enlarge Probability Distribution for analysis"
              aria-label="Enlarge Probability Distribution"
            >
              <Maximize2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div
        className="w-full"
        style={{
          height: enlarged ? (fullPageMode ? 420 : 340) : 240,
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={displayData}
            margin={{
              top: enlarged ? 25 : 15,
              right: enlarged ? 25 : 10,
              left: enlarged ? 10 : -10,
              bottom: needsRotation ? (enlarged ? 52 : 44) : (enlarged ? 28 : 18),
            }}
            barCategoryGap={displayData.length > 8 ? '12%' : '20%'}
          >
            <CartesianGrid vertical={false} stroke="#e5ebe6" strokeDasharray="3 3" />
            <XAxis
              dataKey="state"
              axisLine={{ stroke: '#dbe2dd' }}
              tickLine={{ stroke: '#dbe2dd' }}
              interval={0}
              height={needsRotation ? (enlarged ? 50 : 44) : (enlarged ? 30 : 22)}
              tick={{
                fill: '#394841',
                fontSize: enlarged ? (displayData.length > 8 ? 9.5 : 11) : (displayData.length > 8 ? 8 : 9.5),
                fontFamily: 'DM Mono, monospace',
                angle: needsRotation ? -45 : 0,
                textAnchor: needsRotation ? 'end' : 'middle',
                dy: needsRotation ? 6 : 0,
                dx: needsRotation ? -3 : 0,
              }}
              tickFormatter={(val) => `|${val}⟩`}
              label={
                enlarged
                  ? {
                      value: 'Computational Basis States |x⟩',
                      position: 'insideBottom',
                      offset: -8,
                      style: { fill: '#718078', fontSize: 11, fontWeight: 700 },
                    }
                  : undefined
              }
            />
            <YAxis
              allowDecimals={false}
              axisLine={{ stroke: '#dbe2dd' }}
              tickLine={{ stroke: '#dbe2dd' }}
              width={enlarged ? 50 : 38}
              tick={{
                fill: '#718078',
                fontSize: enlarged ? 10 : 9,
                fontFamily: 'DM Mono, monospace',
              }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              label={
                enlarged
                  ? {
                      value: 'Probability (%)',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 12,
                      style: { fill: '#718078', fontSize: 11, fontWeight: 700 },
                    }
                  : undefined
              }
            />
            <Tooltip
              cursor={{ fill: '#f1f7f2' }}
              content={<CustomTooltip />}
              animationDuration={200}
            />
            <Bar
              dataKey="percentage"
              fill="#1c6b52"
              radius={[4, 4, 0, 0]}
              animationDuration={300}
              animationEasing="ease-out"
            >
              {displayData.map((entry, index) => (
                <rect
                  key={`cell-${index}`}
                  fill={entry.highlighted ? '#1c6b52' : '#e5ebe6'}
                  opacity={entry.highlighted ? 1 : 0.4}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Enlarged Mode Detailed Analysis Table */}
      {enlarged && (
        <div className="mt-6 border-t border-[#e5ebe6] pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-[12px] font-bold text-[#17211f]">
              Basis States Breakdown & Measurement Analysis
            </h4>
            <span className="text-[10px] text-[#718078] font-medium">
              {nonZeroCount} non-zero of {data.length} total states ({qubits} qubits, 2<sup>{qubits}</sup> Hilbert dimension)
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#e5ebe6] bg-white">
            <table className="w-full text-left text-[11px]">
              <thead className="border-b border-[#e5ebe6] bg-[#f8faf8] font-semibold text-[#55655d]">
                <tr>
                  <th className="px-3.5 py-2.5 font-mono">Basis State |x⟩</th>
                  <th className="px-3.5 py-2.5">Probability</th>
                  <th className="px-3.5 py-2.5">Percentage</th>
                  {result.counts && <th className="px-3.5 py-2.5">Measured Shots</th>}
                  {result.stateVector && <th className="px-3.5 py-2.5">Amplitude (Re + Im)</th>}
                  {result.stateVector && <th className="px-3.5 py-2.5">Phase Angle</th>}
                  <th className="px-3.5 py-2.5 w-40">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf2ee]">
                {displayData.map((d) => (
                  <tr
                    key={d.state}
                    className={d.highlighted ? 'bg-[#f6fbf7] hover:bg-[#edf7ef]' : 'hover:bg-[#fcfdfc] opacity-60'}
                  >
                    <td className="px-3.5 py-2 font-mono font-bold text-[#17211f]">
                      |{d.state}⟩
                    </td>
                    <td className="px-3.5 py-2 font-mono text-[#1c6b52] font-semibold">
                      {d.probability.toFixed(4)}
                    </td>
                    <td className="px-3.5 py-2 font-mono text-[#1c6b52] font-bold">
                      {d.percentage.toFixed(2)}%
                    </td>
                    {result.counts && (
                      <td className="px-3.5 py-2 font-mono text-[#55655d]">
                        {d.count ?? 0} / {result.shots}
                      </td>
                    )}
                    {result.stateVector && (
                      <td className="px-3.5 py-2 font-mono text-[#405047]">
                        {d.amplitudeReal !== undefined && d.amplitudeImag !== undefined ? (
                          <span>
                            {d.amplitudeReal.toFixed(4)} {d.amplitudeImag >= 0 ? '+' : ''}
                            {d.amplitudeImag.toFixed(4)}i
                          </span>
                        ) : (
                          '0.0000'
                        )}
                      </td>
                    )}
                    {result.stateVector && (
                      <td className="px-3.5 py-2 font-mono text-[#765a94] font-medium">
                        {d.phaseDeg !== undefined ? `${d.phaseDeg}°` : '—'}
                      </td>
                    )}
                    <td className="px-3.5 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-[#e5ebe6] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#1c6b52]"
                            style={{ width: `${Math.min(100, d.percentage)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[9px] text-[#718078] w-8 text-right">
                          {Math.round(d.percentage)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}