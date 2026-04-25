 'use client'

import { motion } from 'framer-motion'

interface ScoreCardProps {
  score: number
  fomoCount: number
  revengeCount: number
  overleverageCount: number
  profitStreak: number
}

function getScoreColor(score: number) {
  if (score >= 80) return { gradient: 'from-emerald-400 to-green-500', ring: 'ring-emerald-500/30', text: 'text-emerald-400', bg: 'bg-emerald-500', label: 'Excellent' }
  if (score >= 60) return { gradient: 'from-cyan-400 to-blue-500', ring: 'ring-cyan-500/30', text: 'text-cyan-400', bg: 'bg-cyan-500', label: 'Good' }
  if (score >= 40) return { gradient: 'from-amber-400 to-orange-500', ring: 'ring-amber-500/30', text: 'text-amber-400', bg: 'bg-amber-500', label: 'Needs Work' }
  return { gradient: 'from-red-400 to-rose-600', ring: 'ring-red-500/30', text: 'text-red-400', bg: 'bg-red-500', label: 'Critical' }
}

export function ScoreCard({ score, fomoCount, revengeCount, overleverageCount, profitStreak }: ScoreCardProps) {
  const colors = getScoreColor(score)
  const circumference = 2 * Math.PI * 70 // radius = 70
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-6 backdrop-blur-sm">
      <h3 className="text-sm font-medium text-slate-400 mb-6">Behavior Score</h3>

      <div className="flex flex-col items-center">
        {/* Lingkaran Skor Animasi */}
        <div className="relative w-44 h-44">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            {/* Background ring */}
            <circle
              cx="80" cy="80" r="70"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-slate-800"
            />
            {/* Score ring (animated) */}
            <motion.circle
              cx="80" cy="80" r="70"
              stroke="url(#scoreGradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className={colors.text} stopColor="currentColor" />
                <stop offset="100%" className={colors.text} stopColor="currentColor" stopOpacity="0.5" />
              </linearGradient>
            </defs>
          </svg>

          {/* Angka skor di tengah lingkaran */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className={`text-4xl font-bold ${colors.text}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              {score}
            </motion.span>
            <span className="text-xs text-slate-500 mt-1">/ 100</span>
          </div>
        </div>

        {/* Label status */}
        <motion.div
          className={`mt-4 rounded-full px-4 py-1 text-xs font-semibold ${colors.text} bg-white/5 ring-1 ${colors.ring}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          {colors.label}
        </motion.div>
      </div>

      {/* Detail breakdown */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-800/50 p-3 text-center">
          <div className="text-lg font-bold text-amber-400">{fomoCount}</div>
          <div className="text-[11px] text-slate-500">FOMO</div>
        </div>
        <div className="rounded-xl bg-slate-800/50 p-3 text-center">
          <div className="text-lg font-bold text-red-400">{revengeCount}</div>
          <div className="text-[11px] text-slate-500">Revenge</div>
        </div>
        <div className="rounded-xl bg-slate-800/50 p-3 text-center">
          <div className="text-lg font-bold text-orange-400">{overleverageCount}</div>
          <div className="text-[11px] text-slate-500">Overleverage</div>
        </div>
        <div className="rounded-xl bg-slate-800/50 p-3 text-center">
          <div className="text-lg font-bold text-emerald-400">{profitStreak}</div>
          <div className="text-[11px] text-slate-500">Best Streak</div>
        </div>
      </div>
    </div>
  )
}
