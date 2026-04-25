'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface PnlDataPoint {
  date: string
  truePnl: number   // PnL kumulatif sebenarnya
  rawPnl: number    // PnL kumulatif mentah (tanpa biaya)
}

interface PnlChartProps {
  data: PnlDataPoint[]
}

// Custom tooltip saat hover di grafik
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload) return null

  const truePnl = payload.find((p) => p.dataKey === 'truePnl')?.value ?? 0
  const rawPnl = payload.find((p) => p.dataKey === 'rawPnl')?.value ?? 0
  const hiddenCost = rawPnl - truePnl

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/95 p-4 shadow-xl backdrop-blur-md">
      <p className="text-xs text-slate-500 mb-2">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-slate-400">True PnL</span>
          <span className={`text-sm font-bold ${truePnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${truePnl.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-slate-400">Raw PnL</span>
          <span className="text-sm text-slate-300">${rawPnl.toFixed(2)}</span>
        </div>
        <hr className="border-white/5" />
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-amber-400">Hidden Costs</span>
          <span className="text-sm font-medium text-amber-400">-${hiddenCost.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

export function PnlChart({ data }: PnlChartProps) {
  const latestPnl = data.length > 0 ? data[data.length - 1].truePnl : 0
  const isPositive = latestPnl >= 0

  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-slate-400">True PnL (Equity Curve)</h3>
          <p className={`text-2xl font-bold mt-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}${latestPnl.toFixed(2)}
          </p>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-violet-500" />
            <span className="text-slate-500">True PnL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-slate-600" />
            <span className="text-slate-500">Raw PnL</span>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientTrue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? '#8b5cf6' : '#ef4444'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={isPositive ? '#8b5cf6' : '#ef4444'} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientRaw" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#475569" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#475569" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="rawPnl"
              stroke="#475569"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="url(#gradientRaw)"
              animationDuration={1500}
            />
            <Area
              type="monotone"
              dataKey="truePnl"
              stroke={isPositive ? '#8b5cf6' : '#ef4444'}
              strokeWidth={2}
              fill="url(#gradientTrue)"
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
