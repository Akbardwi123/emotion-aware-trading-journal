'use client'

import { Navbar } from '@/components/navbar'
import { ScoreCard } from '@/components/dashboard/score-card'
import { PnlChart } from '@/components/dashboard/pnl-chart'
import { TradeHistory } from '@/components/dashboard/trade-history'
import { useTradingData } from '@/hooks/use-trading-data'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  AlertCircle,
  Wallet,
} from 'lucide-react'

// ================================================================
// STATS CARDS COMPONENT
// ================================================================

interface StatCardProps {
  title: string
  value: string
  subValue?: string
  icon: React.ReactNode
  trend?: 'up' | 'down'
}

function StatCard({ title, value, subValue, icon, trend }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/5 bg-slate-900/60 p-5 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500">{title}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        {subValue && (
          <span className={`flex items-center text-xs font-medium mb-0.5 ${
            trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-500'
          }`}>
            {trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
            {trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
            {subValue}
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ================================================================
// LOADING SKELETON
// ================================================================

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 h-[104px]">
            <div className="h-3 w-16 bg-slate-800 rounded mb-4" />
            <div className="h-7 w-24 bg-slate-800 rounded" />
          </div>
        ))}
      </div>

      {/* Chart + Score skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-white/5 bg-slate-900/40 h-[380px]" />
        <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-slate-900/40 h-[380px]" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/40 h-[300px]" />
    </div>
  )
}

// ================================================================
// MAIN DASHBOARD PAGE
// ================================================================

export default function DashboardPage() {
  const { isConnected } = useAccount()
  const { data, isLoading, error, refetch } = useTradingData()

  // ---- State: Wallet belum connect ----
  if (!isConnected) {
    return (
      <div className="flex flex-col min-h-full">
        <Navbar />
        <div className="flex flex-1 items-center justify-center pt-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md mx-auto px-4"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/20">
              <Wallet className="h-7 w-7 text-violet-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Wallet Not Connected</h2>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Hubungkan dompet kripto Anda terlebih dahulu untuk melihat dashboard.
              Klik tombol <strong className="text-white">&quot;Connect Wallet&quot;</strong> di pojok kanan atas.
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  // ---- Ambil data dari hook ----
  const { trades, summary, behavior, chartData } = data

  return (
    <div className="flex flex-col min-h-full">
      <Navbar />

      <main className="flex-1 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-sm text-slate-500 mt-1">
                Overview performa dan kesehatan psikologi trading Anda.
              </p>
            </div>
            <button
              onClick={refetch}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Syncing...' : 'Refresh'}
            </button>
          </motion.div>

          {/* ---- Error State ---- */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4"
            >
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-400">Gagal memuat data</p>
                <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
              </div>
              <button
                onClick={refetch}
                className="ml-auto text-xs text-red-400 underline hover:text-red-300"
              >
                Coba lagi
              </button>
            </motion.div>
          )}

          {/* ---- Loading State ---- */}
          {isLoading && !summary && <DashboardSkeleton />}

          {/* ---- Empty State (Wallet terhubung tapi tidak ada trade) ---- */}
          {!isLoading && !error && trades.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24"
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 ring-1 ring-white/10">
                <BarChart3 className="h-7 w-7 text-slate-500" />
              </div>
              <h2 className="text-lg font-semibold text-white">Belum Ada Data Trading</h2>
              <p className="mt-2 max-w-sm text-center text-sm text-slate-500">
                Wallet Anda belum memiliki riwayat trading di Hyperliquid.
                Mulai trading terlebih dahulu, lalu kembali ke sini.
              </p>
              <button
                onClick={refetch}
                className="mt-6 rounded-full bg-violet-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500"
              >
                Refresh Data
              </button>
            </motion.div>
          )}

          {/* ---- Dashboard Content (Data tersedia) ---- */}
          {!isLoading && summary && behavior && (
            <>
              {/* Quick Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                  title="True PnL"
                  value={`$${summary.totalTruePnl.toFixed(2)}`}
                  subValue={summary.totalTruePnl !== 0
                    ? `${summary.hiddenCosts > 0 ? '-' : ''}$${summary.hiddenCosts.toFixed(2)} hidden`
                    : undefined}
                  trend={summary.totalTruePnl >= 0 ? 'up' : 'down'}
                  icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
                />
                <StatCard
                  title="Win Rate"
                  value={`${summary.winRate.toFixed(0)}%`}
                  subValue={`${summary.winCount}W / ${summary.lossCount}L`}
                  icon={<TrendingUp className="h-4 w-4 text-cyan-400" />}
                />
                <StatCard
                  title="Hidden Costs"
                  value={`$${summary.hiddenCosts.toFixed(2)}`}
                  subValue="Fee + Funding"
                  icon={<Eye className="h-4 w-4 text-amber-400" />}
                />
                <StatCard
                  title="Sharpe Ratio"
                  value={summary.sharpeRatio.toFixed(2)}
                  subValue={
                    summary.sharpeRatio >= 2 ? 'Excellent' :
                    summary.sharpeRatio >= 1 ? 'Good' :
                    summary.sharpeRatio >= 0 ? 'Moderate' : 'Poor'
                  }
                  icon={<BarChart3 className="h-4 w-4 text-violet-400" />}
                />
              </div>

              {/* Main Grid: Score Card + PnL Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-1">
                  <ScoreCard
                    score={behavior.score}
                    fomoCount={behavior.fomoCount}
                    revengeCount={behavior.revengeCount}
                    overleverageCount={behavior.overleverageCount}
                    profitStreak={behavior.profitableStreak}
                  />
                </div>
                <div className="lg:col-span-2">
                  <PnlChart data={chartData} />
                </div>
              </div>

              {/* Trade History Table */}
              <TradeHistory trades={trades} flags={behavior.flags} />
            </>
          )}
        </div>
      </main>
    </div>
  )
}
