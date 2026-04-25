'use client'

import { Navbar } from '@/components/navbar'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import {
  Shield,
  Brain,
  TrendingUp,
  Bell,
  BarChart3,
  Trophy,
  ChevronRight,
} from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'Behavior Detection',
    description: 'Deteksi otomatis pola FOMO, revenge trading, dan overleveraging dari riwayat transaksi Anda.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: TrendingUp,
    title: 'True PnL Engine',
    description: 'Kalkulasi keuntungan sebenarnya setelah memperhitungkan gas fee, funding rate, dan slippage.',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    icon: Bell,
    title: 'Real-time Alerts',
    description: 'Peringatan instan via Telegram sebelum Anda mengeksekusi trade yang terindikasi emosional.',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Visualisasi lengkap: equity curve, heatmap, dan radar chart profil psikologi trading Anda.',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Shield,
    title: 'Behavior Score',
    description: 'Skor 0–100 yang mencerminkan kedisiplinan dan kesehatan psikologis trading Anda.',
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    icon: Trophy,
    title: 'Global Leaderboard',
    description: 'Bersaing dengan trader lain berdasarkan skor perilaku, bukan hanya keuntungan.',
    gradient: 'from-indigo-500 to-violet-600',
  },
]

const steps = [
  {
    step: '01',
    title: 'Connect Wallet',
    description: 'Hubungkan dompet kripto Anda dengan satu klik. Tidak butuh password.',
  },
  {
    step: '02',
    title: 'Auto-Sync Trades',
    description: 'Riwayat trading Anda dari Hyperliquid, dYdX, dan GMX ditarik secara otomatis.',
  },
  {
    step: '03',
    title: 'Get Insights',
    description: 'Lihat True PnL, deteksi pola berbahaya, dan terima alert langsung ke Telegram Anda.',
  },
]

// Komponen animasi untuk fade-in saat scroll
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export default function Home() {
  const { isConnected } = useAccount()

  return (
    <div className="flex flex-col min-h-full">
      <Navbar />

      {/* ===== HERO SECTION ===== */}
      <section className="relative flex flex-col items-center justify-center pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />

        <FadeIn>
          <div className="flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500"></span>
            </span>
            Now in Beta — 100% Free
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="max-w-3xl text-center text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
            <span className="text-white">Trade Smarter by </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400">
              Understanding Your Emotions
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="mt-6 max-w-xl text-center text-lg text-slate-400 leading-relaxed">
            Platform DeFi pertama yang menggabungkan <strong className="text-slate-200">True PnL</strong>,{' '}
            <strong className="text-slate-200">Behavior Detection</strong>, dan{' '}
            <strong className="text-slate-200">Real-time Alert</strong> dalam satu dashboard.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            {isConnected ? (
              <a
                href="/dashboard"
                className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:scale-105"
              >
                Go to Dashboard
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            ) : (
              <ConnectButton label="🔗  Connect Wallet to Start" />
            )}
          </div>
        </FadeIn>

        {/* Stats bar */}
        <FadeIn delay={0.4}>
          <div className="mt-16 flex flex-wrap justify-center gap-8 sm:gap-16 text-center">
            {[
              { value: '$0', label: 'Setup Cost' },
              { value: '3', label: 'DEX Supported' },
              { value: '100%', label: 'On-chain Data' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest text-violet-400">Features</p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">
                Everything You Need to Trade Responsibly
              </h2>
              <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
                Bukan sekadar dashboard PnL biasa — ini adalah cermin perilaku trading Anda.
              </p>
            </div>
          </FadeIn>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <FadeIn key={feature.title} delay={i * 0.08}>
                <div className="group relative rounded-2xl border border-white/5 bg-slate-900/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/10 hover:bg-slate-900/80">
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 border-t border-white/5">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">How It Works</p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white">
                3 Langkah Sederhana
              </h2>
            </div>
          </FadeIn>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((item, i) => (
              <FadeIn key={item.step} delay={i * 0.12}>
                <div className="relative text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-violet-400 to-cyan-400">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{item.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-24 px-4 sm:px-6">
        <FadeIn>
          <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-gradient-to-br from-violet-950/50 to-slate-900/50 p-12 text-center backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-white">
              Ready to Face Your Trading Psychology?
            </h2>
            <p className="mt-4 text-slate-400">
              Hubungkan dompet Anda sekarang dan dapatkan Behavior Score pertama Anda — 100% gratis.
            </p>
            <div className="mt-8 flex justify-center">
              {isConnected ? (
                <a
                  href="/dashboard"
                  className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:scale-105"
                >
                  Open Dashboard
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              ) : (
                <ConnectButton label="🔗  Connect Wallet — It's Free" />
              )}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/5 py-8 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © 2026 EmoTrade. Built for DeFi traders who want to win the mental game.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Twitter</a>
            <a href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Discord</a>
            <a href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
