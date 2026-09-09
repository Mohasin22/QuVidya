import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { SimulationResult } from '../../types/simulation'

type ProbabilityChartProps = {
  result: SimulationResult
  qubits: number
}

type ProbabilityDatum = {
  state: string
  probability: number
  percentage: number
  highlighted: boolean
}

export function ProbabilityChart({ result, qubits }: ProbabilityChartProps) {
  // Generate all possible basis states for the given number of qubits
  const allStates = Array.from({ length: 2 ** qubits }, (_, i) => 
    i.toString(2).padStart(qubits, '0')
  )

  // Create data with all states, highlighting those with non-zero probability
  const data: ProbabilityDatum[] = allStates.map(state => {
    const probability = result.probabilities[state] ?? 0
    const percentage = probability * 100
    return {
      state,
      probability,
      percentage,
      highlighted: probability > 0
    }
  })

  // Sort by state for consistent ordering
  data.sort((a, b) => a.state.localeCompare(b.state))

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ProbabilityDatum }> }) => {
    if (!active || !payload?.length) return null
    const datum = payload[0].payload
    return (
      <div className="rounded-lg border border-[#dbe2dd] bg-white px-4 py-3 shadow-[0_8px_20px_rgba(39,66,53,0.12)]">
        <p className="font-mono text-[11px] font-bold text-[#17211f]">|{datum.state}⟩</p>
        <p className="mt-1 text-[10px] text-[#6d7975]">Probability: <span className="font-bold text-[#1c6b52]">{datum.percentage.toFixed(2)}%</span></p>
        <p className="text-[10px] text-[#6d7975]">Value: <span className="font-bold text-[#1c6b52]">{datum.probability.toFixed(4)}</span></p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-[12px] font-bold text-[#17211f]">Probability Distribution</h3>
          <p className="text-[10px] text-[#87938d]">Computational basis states</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded bg-[#1c6b52]" />
            <span className="text-[9px] text-[#6d7975]">Non-zero</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded bg-[#e5ebe6]" />
            <span className="text-[9px] text-[#6d7975]">Zero</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            margin={{ top: 20, right: 10, left: -20, bottom: 40 }}
            barCategoryGap="8%"
          >
            <CartesianGrid vertical={false} stroke="#e5ebe6" strokeDasharray="3 3" />
            <XAxis 
              dataKey="state" 
              axisLine={false} 
              tickLine={false} 
              tick={{ 
                fill: '#718078', 
                fontSize: qubits > 4 ? 8 : 10, 
                fontFamily: 'DM Mono, monospace',
                angle: qubits > 4 ? -45 : 0,
                textAnchor: qubits > 4 ? 'end' : 'middle'
              }}
              interval={0}
            />
            <YAxis 
              allowDecimals={false} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9aa49f', fontSize: 9 }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
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
              {data.map((entry, index) => (
                <rect 
                  key={`cell-${index}`} 
                  fill={entry.highlighted ? '#1c6b52' : '#e5ebe6'} 
                  opacity={entry.highlighted ? 1 : 0.3}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}