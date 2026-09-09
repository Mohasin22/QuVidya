import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type HistogramProps = {
  counts?: Record<string, number>
  probabilities?: Record<string, number>
}

type HistogramDatum = {
  state: string
  count: number
  probability: number
  percentage: number
}

export function Histogram({ counts = {}, probabilities = {} }: HistogramProps) {
  const data: HistogramDatum[] = Object.entries(counts).map(([state, count]) => ({
    state,
    count,
    probability: probabilities[state] ?? 0,
    percentage: (probabilities[state] ?? 0) * 100,
  }))

  const hasData = data.length > 0

  return (
    <div className="rounded-xl border border-[#e5ebe6] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold">Measurement histogram</p>
        <span className="font-mono text-[9px] text-[#9aa49f]">
          {hasData ? 'live' : 'awaiting run'}
        </span>
      </div>
      {hasData ? (
        <div className="mt-4 h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 22, right: 8, left: -18, bottom: 4 }} barCategoryGap="24%">
              <CartesianGrid vertical={false} stroke="#e5ebe6" strokeDasharray="3 3" />
              <XAxis dataKey="state" axisLine={false} tickLine={false} tick={{ fill: '#718078', fontSize: 10, fontFamily: 'DM Mono, monospace' }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#9aa49f', fontSize: 9 }} />
              <Tooltip cursor={{ fill: '#f1f7f2' }} content={<HistogramTooltip />} />
              <Bar dataKey="count" name="Measurements" fill="#83b296" radius={[5, 5, 0, 0]}>
                <LabelList dataKey="percentage" position="top" formatter={(value) => `${Number(value).toFixed(0)}%`} fill="#1c6b52" fontSize={9} fontFamily="DM Mono, monospace" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-8 text-center text-[11px] text-[#9aa49f]">
          Run the circuit with measurements to see results.
        </p>
      )}
    </div>
  )
}

function HistogramTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: HistogramDatum }>; label?: string }) {
  if (!active || !payload?.length) return null
  const datum = payload[0].payload
  return (
    <div className="rounded-lg border border-[#dbe2dd] bg-white px-3 py-2 shadow-[0_8px_20px_rgba(39,66,53,0.12)]">
      <p className="font-mono text-[10px] font-bold text-[#17211f]">{label}</p>
      <p className="mt-1 text-[10px] text-[#6d7975]">Count: <span className="font-bold text-[#1c6b52]">{datum.count}</span></p>
      <p className="text-[10px] text-[#6d7975]">Probability: <span className="font-bold text-[#1c6b52]">{datum.percentage.toFixed(1)}%</span></p>
    </div>
  )
}
