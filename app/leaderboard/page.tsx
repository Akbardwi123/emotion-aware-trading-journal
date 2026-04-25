'use client'

import { Navbar } from '@/components/navbar'
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import {
  Trophy,
  Medal,
  Crown,
  AlertTriangle,
  Flame,
  Skull,
  Loader2,
  Users,
} from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  walletAddress: string
  score: number
  fomoCount: number
  revengeCount: number
  overleverageCount: number
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="h-5 w-5 text-amber-400" />
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-300" />
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />
  return <span className="text-sm font-bold text-slate-500 w-5 text-center">{rank}</span>
}

function getScoreBadge(score: number) {
  if (score >= 80) return { color: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20', label: 'Excellent' }
  if (score >= 60) return { color: 'text-cyan-400 bg-cyan-500/10 ring-cyan-500/20', label: 'Good' }
  if (score >= 40) return { color: 'text-amber-400 bg-amber-500/10 ring-amber-500/20', label: 'Fair' }
  return { color: 'text-red-400 bg-red-500/10 ring-red-500/20', label: 'Critical' }
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function LeaderboardPage() {
  const { address } = useAccount()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [week, setWeek] = useState('')

  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoading(true)
      try {
        const response = await fetch('/api/leaderboard')
        const data = await response.json()
        setEntries(data.leaderboard || [])
        setWeek(data.week || '')
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLeaderboard()
  }, [])

  return (
    <div className="flex flex-col min-h-full">
      <Navbar />

      <main className="flex-1 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 ring-1 ring-amber-500/20">
              <Trophy className="h-7 w-7 text-amber-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Global Leaderboard</h1>
            <p className="mt-2 text-sm text-slate-500">
              Ranking berdasarkan <strong className="text-slate-300">Behavior Score</strong> — 
              bukan siapa yang paling untung, tapi siapa yang paling disiplin.
            </p>
            {week && (
              <p className="mt-1 text-xs text-slate-600">
                Minggu: {new Date(week).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </motion.div>

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center py-20">
              <Loader2 className="h-8 w-8 text-violet-400 animate-spin mb-4" />
              <p className="text-sm text-slate-500">Memuat leaderboard...</p>
            </div>
          )}

          {/* Empty */}
          {!isLoading && entries.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-20"
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 ring-1 ring-white/10">
                <Users className="h-7 w-7 text-slate-500" />
              </div>
              <h2 className="text-lg font-semibold text-white">Belum Ada Data</h2>
              <p className="mt-2 text-sm text-slate-500 max-w-sm text-center">
                Leaderboard akan terisi secara otomatis setelah cron job pertama berjalan dan menganalisis data trading user.
              </p>
            </motion.div>
          )}

          {/* Leaderboard Table */}
          {!isLoading && entries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-sm overflow-hidden"
            >
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 text-xs text-slate-500">
                    <th className="px-6 py-4 text-left font-medium w-16">Rank</th>
                    <th className="px-6 py-4 text-left font-medium">Trader</th>
                    <th className="px-6 py-4 text-center font-medium">Score</th>
                    <th className="px-6 py-4 text-center font-medium">
                      <span className="hidden sm:inline">Violations</span>
                      <span className="sm:hidden">⚠️</span>
                    </th>
                    <th className="px-6 py-4 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => {
                    const isCurrentUser = address?.toLowerCase() === entry.walletAddress.toLowerCase()
                    const badge = getScoreBadge(entry.score)
                    const totalViolations = entry.fomoCount + entry.revengeCount + entry.overleverageCount

                    return (
                      <motion.tr
                        key={entry.walletAddress}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className={`border-t border-white/5 transition-colors hover:bg-white/[0.02] ${
                          isCurrentUser ? 'bg-violet-500/[0.06] ring-1 ring-inset ring-violet-500/20' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            {getRankIcon(entry.rank)}
                          </div>
                        </td>

                        {/* Trader Address */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono text-slate-300">
                              {shortenAddress(entry.walletAddress)}
                            </code>
                            {isCurrentUser && (
                              <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
                                YOU
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Score */}
                        <td className="px-6 py-4 text-center">
                          <span className={`text-lg font-bold ${
                            entry.score >= 80 ? 'text-emerald-400' :
                            entry.score >= 60 ? 'text-cyan-400' :
                            entry.score >= 40 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {entry.score}
                          </span>
                        </td>

                        {/* Violations */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {entry.fomoCount > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-amber-400" title="FOMO">
                                <AlertTriangle className="h-3 w-3" />{entry.fomoCount}
                              </span>
                            )}
                            {entry.revengeCount > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-red-400" title="Revenge">
                                <Flame className="h-3 w-3" />{entry.revengeCount}
                              </span>
                            )}
                            {entry.overleverageCount > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-orange-400" title="Overleverage">
                                <Skull className="h-3 w-3" />{entry.overleverageCount}
                              </span>
                            )}
                            {totalViolations === 0 && (
                              <span className="text-xs text-emerald-400">✨ Clean</span>
                            )}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
