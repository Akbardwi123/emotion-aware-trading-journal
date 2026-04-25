'use client'

import { Navbar } from '@/components/navbar'
import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  MessageCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Wallet,
  Shield,
  Bell,
  Copy,
  Check,
} from 'lucide-react'

export default function SettingsPage() {
  const { address, isConnected } = useAccount()
  const [telegramChatId, setTelegramChatId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [copied, setCopied] = useState(false)

  // Reset status setelah 3 detik
  useEffect(() => {
    if (saveStatus !== 'idle') {
      const timer = setTimeout(() => setSaveStatus('idle'), 3000)
      return () => clearTimeout(timer)
    }
  }, [saveStatus])

  const handleSaveTelegram = async () => {
    if (!telegramChatId.trim() || !address) return

    setIsSaving(true)
    setSaveStatus('idle')

    try {
      const response = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          telegram_chat_id: telegramChatId.trim(),
        }),
      })

      if (response.ok) {
        setSaveStatus('success')
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

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
            <p className="mt-3 text-sm text-slate-400">
              Hubungkan dompet kripto Anda untuk mengakses pengaturan.
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      <Navbar />

      <main className="flex-1 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                <Settings className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-sm text-slate-500">Kelola profil dan preferensi alert Anda.</p>
              </div>
            </div>
          </motion.div>

          <div className="space-y-6">
            {/* ---- Card: Wallet Info ---- */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl border border-white/5 bg-slate-900/60 p-6 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-5 w-5 text-violet-400" />
                <h2 className="text-base font-semibold text-white">Wallet</h2>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-800/50 px-4 py-3">
                <code className="text-sm text-slate-300 font-mono">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </code>
                <button
                  onClick={copyAddress}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors"
                >
                  {copied ? (
                    <><Check className="h-3.5 w-3.5 text-emerald-400" /> Copied</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5" /> Copy</>
                  )}
                </button>
              </div>
            </motion.div>

            {/* ---- Card: Telegram Alert Setup ---- */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-white/5 bg-slate-900/60 p-6 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <Bell className="h-5 w-5 text-cyan-400" />
                <h2 className="text-base font-semibold text-white">Telegram Alerts</h2>
              </div>
              <p className="text-sm text-slate-500 mb-5">
                Hubungkan Telegram Anda untuk menerima peringatan real-time saat terdeteksi pola trading berbahaya.
              </p>

              {/* Panduan langkah */}
              <div className="rounded-xl bg-slate-800/30 p-4 mb-5 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cara mendapatkan Chat ID:</p>
                <ol className="space-y-2 text-sm text-slate-400">
                  <li className="flex gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-[10px] font-bold text-violet-400">1</span>
                    <span>Buka Telegram, cari bot <strong className="text-white">@EmoTradeBot</strong> (atau bot yang Anda buat).</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-[10px] font-bold text-violet-400">2</span>
                    <span>Klik <strong className="text-white">Start</strong>, lalu kirim pesan <code className="text-cyan-400">/start</code>.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-[10px] font-bold text-violet-400">3</span>
                    <span>
                      Buka{' '}
                      <a
                        href="https://api.telegram.org/bot{YOUR_BOT_TOKEN}/getUpdates"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 underline hover:text-cyan-300 inline-flex items-center gap-1"
                      >
                        link ini <ExternalLink className="h-3 w-3" />
                      </a>{' '}
                      untuk melihat Chat ID Anda, atau bot Anda bisa membalasnya otomatis.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-[10px] font-bold text-violet-400">4</span>
                    <span>Masukkan Chat ID (angka) di kolom di bawah ini.</span>
                  </li>
                </ol>
              </div>

              {/* Input + Submit */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Masukkan Telegram Chat ID..."
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800/50 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-colors"
                  />
                </div>
                <button
                  onClick={handleSaveTelegram}
                  disabled={isSaving || !telegramChatId.trim()}
                  className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium text-white transition-all hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : saveStatus === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  ) : (
                    'Save'
                  )}
                </button>
              </div>

              {/* Status messages */}
              {saveStatus === 'success' && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-sm text-emerald-400 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Telegram berhasil dihubungkan! Anda akan menerima alert secara real-time.
                </motion.p>
              )}
              {saveStatus === 'error' && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-sm text-red-400"
                >
                  Gagal menyimpan. Pastikan wallet Anda sudah terdaftar dan coba lagi.
                </motion.p>
              )}
            </motion.div>

            {/* ---- Card: Alert Preferences ---- */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl border border-white/5 bg-slate-900/60 p-6 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <Bell className="h-5 w-5 text-amber-400" />
                <h2 className="text-base font-semibold text-white">Alert Preferences</h2>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'FOMO Detection', desc: 'Alert saat Anda entry di puncak volatilitas', color: 'bg-amber-500', defaultOn: true },
                  { label: 'Revenge Trading', desc: 'Alert saat Anda buka posisi besar setelah loss', color: 'bg-red-500', defaultOn: true },
                  { label: 'Overleveraging', desc: 'Alert saat leverage melebihi batas aman', color: 'bg-orange-500', defaultOn: true },
                  { label: 'Weekly Digest', desc: 'Laporan mingguan ringkasan performa trading', color: 'bg-violet-500', defaultOn: false },
                ].map((pref) => (
                  <label
                    key={pref.label}
                    className="flex items-center justify-between rounded-xl bg-slate-800/30 px-4 py-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${pref.color}`} />
                      <div>
                        <p className="text-sm font-medium text-white">{pref.label}</p>
                        <p className="text-xs text-slate-500">{pref.desc}</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={pref.defaultOn}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500/30 focus:ring-offset-0"
                    />
                  </label>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}
