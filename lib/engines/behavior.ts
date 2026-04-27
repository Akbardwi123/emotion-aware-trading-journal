// ====================================
// Behavior Detection Engine
// Mendeteksi pola psikologi berbahaya dari riwayat trading:
//   1. FOMO        → Entry saat harga naik >5% dan volume spike
//   2. Revenge     → Buka posisi baru < 15 menit setelah loss dengan size 1.5x
//   3. Overleverage → Posisi > 10x saldo akun
// Menghasilkan Behavior Score 0–100
// ====================================

import type { ProcessedTrade } from '@/lib/engines/pnl'

// ----- TYPE DEFINITIONS -----

export type BehaviorType = 'FOMO' | 'REVENGE' | 'OVERLEVERAGE' | 'APE'

export interface BehaviorFlag {
  type: BehaviorType
  tradeId: string         // ID trade yang memicu deteksi
  coin: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  description: string     // Pesan penjelasan untuk user
  timestamp: number
}

export interface BehaviorReport {
  score: number           // Behavior Score (0–100)
  flags: BehaviorFlag[]   // Daftar semua pelanggaran
  fomoCount: number
  revengeCount: number
  overleverageCount: number
  apeCount: number           // Deteksi meme coin / rugpull exposure
  profitableStreak: number   // Streak profit terpanjang berturut-turut
  disciplineBonus: number    // Bonus dari kebiasaan baik
  totalPenalty: number       // Total pengurangan poin
}

// ----- CONFIGURABLE PARAMETERS -----
// (Bisa diubah nanti sesuai feedback user)

const CONFIG = {
  // FOMO Detection
  FOMO_PRICE_CHANGE_THRESHOLD: 5,    // Harga bergerak > 5% dalam 1 jam
  FOMO_VOLUME_SPIKE_MULTIPLIER: 2,   // Volume > 2x rata-rata

  // Revenge Trading Detection
  REVENGE_TIME_WINDOW_MS: 15 * 60 * 1000, // 15 menit setelah loss
  REVENGE_SIZE_MULTIPLIER: 1.5,            // Size baru >= 1.5x trade sebelumnya

  // Overleveraging Detection
  OVERLEVERAGE_RATIO: 10,  // Notional > 10x balance

  // Behavior Score Weights
  PENALTY_FOMO: 5,         // -5 poin per FOMO
  PENALTY_REVENGE: 8,      // -8 poin per Revenge (paling fatal)
  PENALTY_OVERLEVERAGE: 6, // -6 poin per Overleverage
  PENALTY_APE: 4,          // -4 poin per Meme Coin FOMO/Ape
  REWARD_PROFIT_STREAK: 3, // +3 poin per 3 profit berturut
  REWARD_DISCIPLINE: 5,    // +5 poin jika istirahat >24 jam setelah loss besar
}

// ----- DETECTION FUNCTIONS -----

/**
 * DETEKSI FOMO
 * Kondisi: User masuk posisi saat harga sudah bergerak tajam (>5% dalam 1 jam)
 * Catatan: Tanpa data harga real-time, kita deteksi dari pola entry yang mencurigakan:
 *   - Masuk saat pasar sangat volatile (dilihat dari spread harga fills terakhir)
 *   - Beberapa entry beruntun dalam waktu singkat pada koin yang sama
 */
function detectFomo(trades: ProcessedTrade[]): BehaviorFlag[] {
  const flags: BehaviorFlag[] = []
  const tradesByTime = [...trades].sort((a, b) => a.entryTime - b.entryTime)

  for (let i = 1; i < tradesByTime.length; i++) {
    const current = tradesByTime[i]
    const recent = tradesByTime.slice(Math.max(0, i - 5), i)

    // Cek apakah ada banyak trade beruntun pada koin yang sama dalam 1 jam
    const sameCoinsInLastHour = recent.filter(
      (t) =>
        t.coin === current.coin &&
        current.entryTime - t.entryTime < 60 * 60 * 1000 // 1 jam
    )

    if (sameCoinsInLastHour.length >= 2) {
      // Cek apakah harga entry bergerak naik tajam (indikasi chase)
      const prices = sameCoinsInLastHour.map((t) => t.entryPrice)
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      const priceChange = ((maxPrice - minPrice) / minPrice) * 100

      if (priceChange >= CONFIG.FOMO_PRICE_CHANGE_THRESHOLD) {
        // Cek apakah user masuk searah dengan pergerakan
        const isChasing =
          (current.side === 'LONG' && current.entryPrice >= maxPrice * 0.98) ||
          (current.side === 'SHORT' && current.entryPrice <= minPrice * 1.02)

        if (isChasing) {
          flags.push({
            type: 'FOMO',
            tradeId: current.id,
            coin: current.coin,
            severity: priceChange > 10 ? 'HIGH' : priceChange > 7 ? 'MEDIUM' : 'LOW',
            description: `⚠️ Kemungkinan FOMO: Anda masuk ${current.side} ${current.coin} setelah harga bergerak ${priceChange.toFixed(1)}% dalam 1 jam terakhir.`,
            timestamp: current.entryTime,
          })
        }
      }
    }
  }

  return flags
}

/**
 * DETEKSI REVENGE TRADING
 * Kondisi:
 *   1. Trade sebelumnya berakhir LOSS
 *   2. Trade baru dibuka dalam < 15 menit setelah loss
 *   3. Ukuran posisi baru >= 1.5x lebih besar dari trade yang loss
 */
function detectRevenge(trades: ProcessedTrade[]): BehaviorFlag[] {
  const flags: BehaviorFlag[] = []
  const closedTrades = trades.filter((t) => !t.isOpen && t.exitTime)

  for (let i = 1; i < closedTrades.length; i++) {
    const prevTrade = closedTrades[i - 1]
    const currentTrade = closedTrades[i]

    // Kondisi 1: Trade sebelumnya harus RUGI
    if (prevTrade.truePnl >= 0) continue

    // Kondisi 2: Jeda waktu kurang dari 15 menit
    const timeDiff = currentTrade.entryTime - (prevTrade.exitTime || 0)
    if (timeDiff > CONFIG.REVENGE_TIME_WINDOW_MS || timeDiff < 0) continue

    // Kondisi 3: Ukuran posisi baru lebih besar >= 1.5x
    const sizeRatio = currentTrade.size / prevTrade.size
    if (sizeRatio < CONFIG.REVENGE_SIZE_MULTIPLIER) continue

    // SEMUA KONDISI TERPENUHI → REVENGE TRADING TERDETEKSI!
    const minutesDiff = Math.round(timeDiff / 60000)
    flags.push({
      type: 'REVENGE',
      tradeId: currentTrade.id,
      coin: currentTrade.coin,
      severity: sizeRatio > 3 ? 'HIGH' : sizeRatio > 2 ? 'MEDIUM' : 'LOW',
      description: `🔥 Revenge Trading: Anda loss $${Math.abs(prevTrade.truePnl).toFixed(2)} pada ${prevTrade.coin}, lalu membuka ${currentTrade.coin} ${currentTrade.side} hanya ${minutesDiff} menit kemudian dengan size ${sizeRatio.toFixed(1)}x lebih besar.`,
      timestamp: currentTrade.entryTime,
    })
  }

  return flags
}

/**
 * DETEKSI OVERLEVERAGING
 * Kondisi: Nilai nosional posisi > 10x total saldo akun
 * @param accountBalance - Total saldo USDC user di akun Hyperliquid
 */
function detectOverleverage(
  trades: ProcessedTrade[],
  accountBalance: number
): BehaviorFlag[] {
  const flags: BehaviorFlag[] = []

  if (accountBalance <= 0) return flags // Skip jika balance tidak tersedia

  for (const trade of trades) {
    if (trade.marketType === 'SPOT') continue // Spot trading tidak punya leverage

    const notionalValue = trade.entryPrice * trade.size
    const leverageRatio = notionalValue / accountBalance

    if (leverageRatio >= CONFIG.OVERLEVERAGE_RATIO) {
      flags.push({
        type: 'OVERLEVERAGE',
        tradeId: trade.id,
        coin: trade.coin,
        severity:
          leverageRatio > 50 ? 'HIGH' : leverageRatio > 20 ? 'MEDIUM' : 'LOW',
        description: `💀 Overleveraging: Posisi ${trade.coin} senilai $${notionalValue.toFixed(0)} = ${leverageRatio.toFixed(1)}x dari saldo Anda ($${accountBalance.toFixed(0)}).`,
        timestamp: trade.entryTime,
      })
    }
  }

  return flags
}

/**
 * DETEKSI APE / MEME COIN EXPOSURE (Khusus SPOT)
 * Kondisi: User membeli koin dengan suplai/size yang tidak wajar (> 1 juta) 
 * atau membeli koin yang terindikasi sebagai meme coin.
 */
function detectApe(trades: ProcessedTrade[]): BehaviorFlag[] {
  const flags: BehaviorFlag[] = []
  
  const knownMemeCoins = ['PEPE', 'WIF', 'BONK', 'DOGE', 'SHIB', 'FLOKI']

  for (const trade of trades) {
    if (trade.marketType !== 'SPOT') continue

    const isMeme = knownMemeCoins.includes(trade.coin) || trade.size > 1000000

    if (isMeme && trade.isOpen) {
      flags.push({
        type: 'APE',
        tradeId: trade.id,
        coin: trade.coin,
        severity: trade.size > 100000000 ? 'HIGH' : 'MEDIUM',
        description: `🦍 Apeing Detected: Anda memegang ${trade.size.toLocaleString()} ${trade.coin} di dompet Spot. Hati-hati terhadap risiko Rugpull atau likuiditas rendah!`,
        timestamp: trade.entryTime,
      })
    }
  }

  return flags
}

// ----- SCORING FUNCTIONS -----

/**
 * Menghitung profitable streak (jumlah profit berturut-turut terpanjang)
 */
function calculateProfitStreak(trades: ProcessedTrade[]): number {
  const closedTrades = trades.filter((t) => !t.isOpen)
  let maxStreak = 0
  let currentStreak = 0

  for (const trade of closedTrades) {
    if (trade.truePnl > 0) {
      currentStreak++
      if (currentStreak > maxStreak) maxStreak = currentStreak
    } else {
      currentStreak = 0
    }
  }

  return maxStreak
}

/**
 * Menghitung bonus kedisiplinan
 * +5 poin jika user istirahat > 24 jam setelah loss besar
 */
function calculateDisciplineBonus(trades: ProcessedTrade[]): number {
  const closedTrades = trades.filter((t) => !t.isOpen && t.exitTime)
  let bonus = 0

  for (let i = 1; i < closedTrades.length; i++) {
    const prevTrade = closedTrades[i - 1]
    const currentTrade = closedTrades[i]

    // Jika trade sebelumnya loss besar (> 2x rata-rata loss)
    const avgPnl = closedTrades.reduce((s, t) => s + Math.abs(t.truePnl), 0) / closedTrades.length
    const isBigLoss = prevTrade.truePnl < 0 && Math.abs(prevTrade.truePnl) > avgPnl * 2

    if (isBigLoss) {
      const timeDiff = currentTrade.entryTime - (prevTrade.exitTime || 0)
      const twentyFourHours = 24 * 60 * 60 * 1000

      if (timeDiff >= twentyFourHours) {
        bonus += CONFIG.REWARD_DISCIPLINE
      }
    }
  }

  return bonus
}

// ----- MAIN FUNCTION -----

/**
 * Menganalisis semua trade dan menghasilkan laporan perilaku lengkap
 * @param trades - Daftar trade yang sudah diproses oleh PnL engine
 * @param accountBalance - Saldo akun user (untuk deteksi overleverage)
 * @returns BehaviorReport dengan skor 0–100 dan daftar flag
 */
export function analyzeBehavior(
  trades: ProcessedTrade[],
  accountBalance: number = 0
): BehaviorReport {
  // Jalankan semua detektor
  const fomoFlags = detectFomo(trades)
  const revengeFlags = detectRevenge(trades)
  const overleverageFlags = detectOverleverage(trades, accountBalance)
  const apeFlags = detectApe(trades)

  // Gabungkan semua flags
  const allFlags = [...fomoFlags, ...revengeFlags, ...overleverageFlags, ...apeFlags]
    .sort((a, b) => a.timestamp - b.timestamp)

  // Hitung penalti
  const fomoPenalty = fomoFlags.length * CONFIG.PENALTY_FOMO
  const revengePenalty = revengeFlags.length * CONFIG.PENALTY_REVENGE
  const overleveragePenalty = overleverageFlags.length * CONFIG.PENALTY_OVERLEVERAGE
  const apePenalty = apeFlags.length * CONFIG.PENALTY_APE

  const totalPenalty = fomoPenalty + revengePenalty + overleveragePenalty + apePenalty

  // Hitung reward
  const profitableStreak = calculateProfitStreak(trades)
  const streakBonus = Math.floor(profitableStreak / 3) * CONFIG.REWARD_PROFIT_STREAK
  const disciplineBonus = calculateDisciplineBonus(trades)
  const totalReward = streakBonus + disciplineBonus

  // Hitung skor akhir (clamp antara 0–100)
  const rawScore = 100 - totalPenalty + totalReward
  const score = Math.max(0, Math.min(100, rawScore))

  return {
    score,
    flags: allFlags,
    fomoCount: fomoFlags.length,
    revengeCount: revengeFlags.length,
    overleverageCount: overleverageFlags.length,
    apeCount: apeFlags.length,
    profitableStreak,
    disciplineBonus: totalReward,
    totalPenalty,
  }
}
