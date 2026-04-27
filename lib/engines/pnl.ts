// ====================================
// True PnL Engine
// Menghitung keuntungan/kerugian SEBENARNYA setelah semua biaya tersembunyi
// Rumus: True PnL = Realized PnL - Trading Fee - Gas Fee - Funding Rate Cost
// ====================================

import type { HyperliquidFill, HyperliquidFunding } from '@/lib/api/hyperliquid'

// ----- TYPE DEFINITIONS -----

export interface ProcessedTrade {
  id: string              // ID unik (hash dari fill pertama)
  coin: string            // Aset yang diperdagangkan (ETH, BTC, dll)
  side: 'LONG' | 'SHORT' | 'BUY' | 'SELL'
  marketType: 'PERP' | 'SPOT'
  entryPrice: number
  exitPrice: number | null
  size: number
  rawPnl: number          // PnL mentah (hanya selisih harga)
  totalFee: number        // Total trading fee (gas fee untuk spot)
  fundingCost: number     // Total funding rate yang dibayar (0 untuk spot)
  truePnl: number         // PnL sebenarnya setelah semua biaya
  entryTime: number       // Timestamp masuk posisi
  exitTime: number | null // Timestamp keluar posisi
  isOpen: boolean         // Apakah posisi masih terbuka
  protocol: string        // Sumber data: 'hyperliquid' | 'solana' | 'ethereum'
}

export interface PnlSummary {
  totalTruePnl: number       // Total True PnL keseluruhan
  totalRawPnl: number        // Total PnL mentah (tanpa biaya)
  totalFees: number          // Total fee yang dibayar
  totalFunding: number       // Total funding rate cost
  hiddenCosts: number        // Biaya tersembunyi = fees + funding
  winRate: number            // Persentase trade yang profit (0-100)
  totalTrades: number        // Jumlah trade yang sudah ditutup
  winCount: number
  lossCount: number
  biggestWin: number
  biggestLoss: number
  averageWin: number
  averageLoss: number
  profitFactor: number       // Total profit / Total loss (>1 = bagus)
  maxDrawdown: number        // Penurunan modal terbesar dari puncak
  sharpeRatio: number        // Risk-adjusted return (>1 = bagus, >2 = sangat bagus)
}

// ----- CORE FUNCTIONS -----

/**
 * Mengolah data fill mentah dari Hyperliquid menjadi daftar trade yang rapi
 * Setiap "trade" adalah satu siklus open → close pada satu aset
 */
export function processHyperliquidFills(
  fills: HyperliquidFill[],
  funding: HyperliquidFunding[]
): ProcessedTrade[] {
  const trades: ProcessedTrade[] = []

  // Kelompokkan fills berdasarkan koin
  const fillsByCoin = new Map<string, HyperliquidFill[]>()
  for (const fill of fills) {
    const existing = fillsByCoin.get(fill.coin) || []
    existing.push(fill)
    fillsByCoin.set(fill.coin, existing)
  }

  // Kelompokkan funding berdasarkan koin
  const fundingByCoin = new Map<string, HyperliquidFunding[]>()
  for (const fund of funding) {
    const existing = fundingByCoin.get(fund.coin) || []
    existing.push(fund)
    fundingByCoin.set(fund.coin, existing)
  }

  // Proses setiap koin
  for (const [coin, coinFills] of fillsByCoin) {
    // Urutkan berdasarkan waktu
    const sortedFills = coinFills.sort((a, b) => a.time - b.time)
    const coinFunding = fundingByCoin.get(coin) || []

    let currentTrade: {
      entryFills: HyperliquidFill[]
      exitFills: HyperliquidFill[]
      side: 'LONG' | 'SHORT'
    } | null = null

    for (const fill of sortedFills) {
      const isOpen = fill.dir.includes('Open')

      if (isOpen && !currentTrade) {
        // Mulai trade baru
        currentTrade = {
          entryFills: [fill],
          exitFills: [],
          side: fill.dir.includes('Long') ? 'LONG' : 'SHORT',
        }
      } else if (isOpen && currentTrade) {
        // Tambah ke posisi yang sudah ada (averaging)
        currentTrade.entryFills.push(fill)
      } else if (!isOpen && currentTrade) {
        // Menutup posisi
        currentTrade.exitFills.push(fill)

        // Cek apakah posisi sudah sepenuhnya tertutup
        const entrySize = currentTrade.entryFills.reduce(
          (sum, f) => sum + parseFloat(f.sz),
          0
        )
        const exitSize = currentTrade.exitFills.reduce(
          (sum, f) => sum + parseFloat(f.sz),
          0
        )

        if (exitSize >= entrySize * 0.99) {
          // Posisi ditutup — hitung True PnL
          const trade = buildProcessedTrade(currentTrade, coinFunding, coin)
          trades.push(trade)
          currentTrade = null
        }
      }
    }

    // Jika masih ada posisi terbuka
    if (currentTrade) {
      const openTrade = buildProcessedTrade(currentTrade, coinFunding, coin)
      trades.push(openTrade)
    }
  }

  // Urutkan berdasarkan waktu entry
  return trades.sort((a, b) => a.entryTime - b.entryTime)
}

/**
 * Helper: Membangun objek ProcessedTrade dari kumpulan fills
 */
function buildProcessedTrade(
  tradeData: {
    entryFills: HyperliquidFill[]
    exitFills: HyperliquidFill[]
    side: 'LONG' | 'SHORT'
  },
  coinFunding: HyperliquidFunding[],
  coin: string
): ProcessedTrade {
  const { entryFills, exitFills, side } = tradeData

  // Hitung rata-rata harga entry (weighted average)
  const totalEntryNotional = entryFills.reduce(
    (sum, f) => sum + parseFloat(f.px) * parseFloat(f.sz),
    0
  )
  const totalEntrySize = entryFills.reduce(
    (sum, f) => sum + parseFloat(f.sz),
    0
  )
  const entryPrice = totalEntryNotional / totalEntrySize

  // Hitung rata-rata harga exit
  const isOpen = exitFills.length === 0
  let exitPrice: number | null = null
  if (!isOpen) {
    const totalExitNotional = exitFills.reduce(
      (sum, f) => sum + parseFloat(f.px) * parseFloat(f.sz),
      0
    )
    const totalExitSize = exitFills.reduce(
      (sum, f) => sum + parseFloat(f.sz),
      0
    )
    exitPrice = totalExitNotional / totalExitSize
  }

  // Hitung Raw PnL (selisih harga x ukuran)
  let rawPnl = 0
  if (exitPrice !== null) {
    if (side === 'LONG') {
      rawPnl = (exitPrice - entryPrice) * totalEntrySize
    } else {
      rawPnl = (entryPrice - exitPrice) * totalEntrySize
    }
  }

  // Hitung total fee dari semua fills
  const totalFee =
    entryFills.reduce((sum, f) => sum + parseFloat(f.fee), 0) +
    exitFills.reduce((sum, f) => sum + parseFloat(f.fee), 0)

  // Hitung funding cost selama posisi terbuka
  const entryTime = Math.min(...entryFills.map((f) => f.time))
  const exitTime = isOpen
    ? null
    : Math.max(...exitFills.map((f) => f.time))

  const fundingCost = coinFunding
    .filter((f) => {
      const withinStart = f.time >= entryTime
      const withinEnd = exitTime ? f.time <= exitTime : true
      return withinStart && withinEnd
    })
    .reduce((sum, f) => sum + Math.abs(parseFloat(f.usdc)), 0)

  // TRUE PnL = Raw PnL - Fee - Funding Cost
  const truePnl = rawPnl - totalFee - fundingCost

  return {
    id: entryFills[0].hash,
    coin,
    side,
    marketType: 'PERP',
    entryPrice,
    exitPrice,
    size: totalEntrySize,
    rawPnl,
    totalFee,
    fundingCost,
    truePnl,
    entryTime,
    exitTime,
    isOpen,
    protocol: 'hyperliquid',
  }
}

// ====================================
// SPOT SIMULATION (MVP PHASE 2)
// ====================================

/**
 * Mensimulasikan hasil parsing dari transaksi Spot On-Chain (Solana/EVM)
 * Ini digunakan karena menarik historical price dari DEX membutuhkan API Enterprise.
 */
export function processSpotSwaps(): ProcessedTrade[] {
  // Mock data has been removed for production.
  // In the future, this is where you would fetch and parse historical EVM/Solana swaps
  // using an Enterprise API.
  return []
}

/**
 * Menghitung ringkasan statistik keseluruhan dari daftar trade
 */
export function calculatePnlSummary(trades: ProcessedTrade[]): PnlSummary {
  const closedTrades = trades.filter((t) => !t.isOpen)

  const wins = closedTrades.filter((t) => t.truePnl > 0)
  const losses = closedTrades.filter((t) => t.truePnl <= 0)

  const totalTruePnl = closedTrades.reduce((sum, t) => sum + t.truePnl, 0)
  const totalRawPnl = closedTrades.reduce((sum, t) => sum + t.rawPnl, 0)
  const totalFees = closedTrades.reduce((sum, t) => sum + t.totalFee, 0)
  const totalFunding = closedTrades.reduce((sum, t) => sum + t.fundingCost, 0)

  const totalProfit = wins.reduce((sum, t) => sum + t.truePnl, 0)
  const totalLoss = Math.abs(losses.reduce((sum, t) => sum + t.truePnl, 0))

  // Hitung Max Drawdown
  let peak = 0
  let maxDrawdown = 0
  let cumulative = 0
  for (const trade of closedTrades) {
    cumulative += trade.truePnl
    if (cumulative > peak) peak = cumulative
    const drawdown = peak - cumulative
    if (drawdown > maxDrawdown) maxDrawdown = drawdown
  }

  // Hitung Sharpe Ratio (jika ada cukup data)
  let sharpeRatio = 0
  if (closedTrades.length > 1) {
    const returns = closedTrades.map((t) => t.truePnl)
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
      (returns.length - 1)
    const stdDev = Math.sqrt(variance)
    sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0
  }

  return {
    totalTruePnl,
    totalRawPnl,
    totalFees,
    totalFunding,
    hiddenCosts: totalFees + totalFunding,
    winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
    totalTrades: closedTrades.length,
    winCount: wins.length,
    lossCount: losses.length,
    biggestWin: wins.length > 0 ? Math.max(...wins.map((t) => t.truePnl)) : 0,
    biggestLoss: losses.length > 0 ? Math.min(...losses.map((t) => t.truePnl)) : 0,
    averageWin: wins.length > 0 ? totalProfit / wins.length : 0,
    averageLoss: losses.length > 0 ? -(totalLoss / losses.length) : 0,
    profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0,
    maxDrawdown,
    sharpeRatio,
  }
}
