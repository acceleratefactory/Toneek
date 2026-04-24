'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

interface CheckinData {
  week: number
  score: number // 1–10 scale from skin_outcomes
}

interface ProgressChartProps {
  data: CheckinData[]
  currentScore: number // skin_os_score from assessment (1–100)
}

// Convert 1–10 outcome score to 0–100 for display
// Map: 1→10, 2→20, 3→30... 10→100
const toDisplayScore = (s: number) => s * 10

export default function ProgressChart({ data, currentScore }: ProgressChartProps) {
  const chartData = data.map(d => ({
    week: `Week ${d.week}`,
    score: toDisplayScore(d.score),
  }))

  // Empty state
  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center"
          style={{ borderColor: '#E8E0DA' }}>
          <span className="text-[#8C7B72] text-xl">↗</span>
        </div>
        <p className="mt-3 text-sm font-medium" style={{ color: '#8C7B72' }}>
          Your first check-in is at Week 2
        </p>
        <p className="text-xs mt-1" style={{ color: '#8C7B72' }}>
          Your progress chart builds here over time
        </p>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white rounded-lg shadow-lg p-3 border"
          style={{ borderColor: '#E8E0DA' }}>
          <p className="text-xs font-medium" style={{ color: '#8C7B72' }}>
            {payload[0].payload.week}
          </p>
          <p className="text-lg font-semibold" style={{ color: '#2A0F06' }}>
            {payload[0].value}/100
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="4 4"
          stroke="#E8E0DA"
          horizontal={true}
          vertical={false}
        />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 11, fill: '#8C7B72', fontFamily: 'var(--font-sans, "Jost", sans-serif)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: '#8C7B72' }}
          axisLine={false}
          tickLine={false}
          ticks={[0, 25, 50, 75, 100]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#C87D3E"
          strokeWidth={2.5}
          dot={{ fill: '#ffffff', stroke: '#C87D3E', strokeWidth: 2, r: 5 }}
          activeDot={{ fill: '#C87D3E', r: 7 }}
          animationDuration={800}
          animationEasing="ease-out"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
