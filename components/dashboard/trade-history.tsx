'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Flame, Skull, TrendingUp, TrendingDown, Ghost } from 'lucide-react'
import type { ProcessedTrade } from '@/lib/engines/pnl'
import type { BehaviorFlag } from '@/lib/engines/behavior'

interface TradeHistoryProps {
  trades: ProcessedTrade[]
  flags: BehaviorFlag[]
}

function getBehaviorIcon(type: string) {
  switch (type) {
    case 'FOMO': return <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
    case 'REVENGE': return <Flame className="h-3.5 w-3.5 text-red-400" />
    case 'OVERLEVERAGE': return <Skull className="h-3.5 w-3.5 text-orange-400" />
    case 'APE': return <Ghost className="h-3.5 w-3.5 text-purple-400" />
    default: return null
  }
}

function getBehaviorBadgeClass(type: string) {
  switch (type) {
    case 'FOMO': return 'bg-amber-500/10 text-amber-400 ring-amber-500/20'
    case 'REVENGE': return 'bg-red-500/10 text-red-400 ring-red-500/20'
    case 'OVERLEVERAGE': return 'bg-orange-500/10 text-orange-400 ring-orange-500/20'
    case 'APE': return 'bg-purple-500/10 text-purple-400 ring-purple-500/20'
    default: return ''
  }
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TradeHistory({ trades, flags }: TradeHistoryProps) {
  // Buat map dari tradeId → flags untuk pencarian cepat
  const flagMap = new Map<string, BehaviorFlag[]>()
  for (const flag of flags) {
    const existing = flagMap.get(flag.tradeId) || []
    existing.push(flag)
    flagMap.set(flag.tradeId, existing)
  }

  // Tampilkan trade terbaru di atas
  const sortedTrades = [...trades].sort((a, b) => b.entryTime - a.entryTime)

  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between p-6 pb-4">
        <h3 className="text-sm font-medium text-slate-400">Trade History</h3>
        <span className="text-xs text-slate-600">{trades.length} trades</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-white/5 text-left text-xs text-slate-500">
              <th className="px-6 py-3 font-medium">Time</th>
              <th className="px-6 py-3 font-medium">Asset</th>
              <th className="px-6 py-3 font-medium">Side</th>
              <th className="px-6 py-3 font-medium text-right">Size</th>
              <th className="px-6 py-3 font-medium text-right">Entry</th>
              <th className="px-6 py-3 font-medium text-right">Exit</th>
              <th className="px-6 py-3 font-medium text-right">True PnL</th>
              <th className="px-6 py-3 font-medium text-right">Fee + Fund</th>
              <th className="px-6 py-3 font-medium">Flags</th>
            </tr>
          </thead>
          <tbody>
            {sortedTrades.map((trade, index) => {
              const tradeFlags = flagMap.get(trade.id) || []
              const hasBehaviorFlag = tradeFlags.length > 0

              return (
                <motion.tr
                  key={trade.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.3 }}
                  className={`border-t border-white/5 transition-colors hover:bg-white/[0.02] ${
                    hasBehaviorFlag ? 'bg-red-500/[0.03]' : ''
                  }`}
                >
                  {/* Time */}
                  <td className="px-6 py-3.5 text-slate-400 whitespace-nowrap">
                    {formatDate(trade.entryTime)}
                  </td>

                  {/* Asset */}
                  <td className="px-6 py-3.5 font-medium text-white">
                    {trade.coin}
                  </td>

                  {/* Side */}
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                      trade.side === 'LONG'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {trade.side === 'LONG' ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {trade.side}
                    </span>
                  </td>

                  {/* Size */}
                  <td className="px-6 py-3.5 text-right text-slate-300 tabular-nums">
                    {trade.size.toFixed(4)}
                  </td>

                  {/* Entry Price */}
                  <td className="px-6 py-3.5 text-right text-slate-300 tabular-nums">
                    ${trade.entryPrice.toFixed(2)}
                  </td>

                  {/* Exit Price */}
                  <td className="px-6 py-3.5 text-right text-slate-300 tabular-nums">
                    {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : (
                      <span className="text-cyan-400 text-xs">OPEN</span>
                    )}
                  </td>

                  {/* True PnL */}
                  <td className={`px-6 py-3.5 text-right font-semibold tabular-nums ${
                    trade.truePnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {trade.truePnl >= 0 ? '+' : ''}${trade.truePnl.toFixed(2)}
                  </td>

                  {/* Fee + Funding */}
                  <td className="px-6 py-3.5 text-right text-amber-400/70 tabular-nums text-xs">
                    -${(trade.totalFee + trade.fundingCost).toFixed(2)}
                  </td>

                  {/* Behavior Flags */}
                  <td className="px-6 py-3.5">
                    {tradeFlags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {tradeFlags.map((flag, fi) => (
                          <span
                            key={fi}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${getBehaviorBadgeClass(flag.type)}`}
                            title={flag.description}
                          >
                            {getBehaviorIcon(flag.type)}
                            {flag.type}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-700">—</span>
                    )}
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {trades.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-600">
          <p className="text-sm">No trades found.</p>
          <p className="text-xs mt-1">Connect your wallet to sync trading history.</p>
        </div>
      )}
    </div>
  )
}
