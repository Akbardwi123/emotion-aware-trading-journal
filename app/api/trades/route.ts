import { NextRequest, NextResponse } from 'next/server'
import { getUserFills, getUserFunding } from '@/lib/api/hyperliquid'
import { processHyperliquidFills, calculatePnlSummary } from '@/lib/engines/pnl'
import { analyzeBehavior } from '@/lib/engines/behavior'

// ====================================
// API: /api/trades?wallet=0x...
// Mengambil data trade dari Hyperliquid, memproses True PnL,
// dan menjalankan behavior detection — semuanya di server.
// ====================================

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet')

  if (!wallet) {
    return NextResponse.json(
      { error: 'wallet query parameter is required' },
      { status: 400 }
    )
  }

  try {
    // 1. Ambil data fills dari Hyperliquid
    const fills = await getUserFills(wallet)

    if (fills.length === 0) {
      return NextResponse.json({
        trades: [],
        summary: null,
        behavior: { score: 100, flags: [], fomoCount: 0, revengeCount: 0, overleverageCount: 0, profitableStreak: 0, disciplineBonus: 0, totalPenalty: 0 },
        chartData: [],
      })
    }

    // 2. Ambil funding rate (90 hari terakhir)
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
    const funding = await getUserFunding(wallet, ninetyDaysAgo)

    // 3. Proses menjadi trade terstruktur + hitung True PnL
    const trades = processHyperliquidFills(fills, funding)

    // 4. Hitung ringkasan statistik
    const summary = calculatePnlSummary(trades)

    // 5. Jalankan behavior detection
    const behavior = analyzeBehavior(trades)

    // 6. Bangun data untuk grafik (PnL kumulatif per trade)
    let cumulativeTruePnl = 0
    let cumulativeRawPnl = 0
    const chartData = trades
      .filter((t) => !t.isOpen)
      .map((trade) => {
        cumulativeTruePnl += trade.truePnl
        cumulativeRawPnl += trade.rawPnl
        return {
          date: new Date(trade.exitTime || trade.entryTime).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          truePnl: parseFloat(cumulativeTruePnl.toFixed(2)),
          rawPnl: parseFloat(cumulativeRawPnl.toFixed(2)),
        }
      })

    return NextResponse.json({
      trades,
      summary,
      behavior,
      chartData,
    })
  } catch (error) {
    console.error('[API /trades] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trading data' },
      { status: 500 }
    )
  }
}
