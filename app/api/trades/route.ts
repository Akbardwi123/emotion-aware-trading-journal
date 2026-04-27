import { NextRequest, NextResponse } from 'next/server'
import { getUserFills, getUserFunding } from '@/lib/api/hyperliquid'
import { processHyperliquidFills, processSpotSwaps, calculatePnlSummary } from '@/lib/engines/pnl'
import { analyzeBehavior } from '@/lib/engines/behavior'
import { supabaseAdmin as supabase } from '@/lib/supabase/server'
import { 
  sendTelegramMessage, 
  buildFomoAlert, 
  buildRevengeAlert, 
  buildOverleverageAlert, 
  buildApeAlert 
} from '@/lib/api/telegram'

// ====================================
// API: /api/trades?wallet=0x...
// Mengambil data trade dari Hyperliquid, memproses True PnL,
// dan menjalankan behavior detection — semuanya di server.
// ====================================

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet')
  const daysParam = request.nextUrl.searchParams.get('days') || 'all'

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
    const hlTrades = processHyperliquidFills(fills, funding)
    
    // 3.5 Tambahkan Mock Spot Trades (MVP Phase 2)
    const spotTrades = processSpotSwaps()
    
    // Gabungkan dan urutkan berdasarkan waktu (terlama ke terbaru)
    let trades = [...hlTrades, ...spotTrades].sort((a, b) => a.entryTime - b.entryTime)

    // Filter berdasarkan tanggal jika diminta (contoh: days=7)
    if (daysParam !== 'all') {
      const days = parseInt(daysParam)
      if (!isNaN(days) && days > 0) {
        const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000
        trades = trades.filter(t => t.entryTime >= cutoffTime || (t.exitTime && t.exitTime >= cutoffTime))
      }
    }

    // 4. Hitung ringkasan statistik
    const summary = calculatePnlSummary(trades)

    // 5. Jalankan behavior detection
    const behavior = analyzeBehavior(trades)

    // 5.5 Auto-sync ke Database Supabase untuk Leaderboard (Fitur Opsional/Realtime)
    try {
      // Cari user_id berdasarkan wallet beserta pengaturan notifikasinya
      const { data: userData } = await supabase
        .from('users')
        .select('id, telegram_chat_id, alert_preferences')
        .eq('wallet_address', wallet.toLowerCase())
        .single()

      if (userData?.id) {
        // Dapatkan tanggal Senin minggu ini
        const now = new Date()
        const day = now.getDay()
        const diff = now.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
        const monday = new Date(now.setDate(diff))
        const weekStr = monday.toISOString().split('T')[0]

        // Upsert skor ke behavior_scores
        await supabase
          .from('behavior_scores')
          .upsert({
            user_id: userData.id,
            score: behavior.score,
            fomo_count: behavior.fomoCount,
            revenge_count: behavior.revengeCount,
            overleverage_count: behavior.overleverageCount,
            week: weekStr,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,week' })

        // ==========================================
        // 5.6 REAL-TIME TELEGRAM ALERTS
        // ==========================================
        if (userData.telegram_chat_id && userData.alert_preferences) {
          const prefs = userData.alert_preferences as any
          
          // Ambil flag terbaru (terjadi dalam 24 jam terakhir)
          const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000
          const recentFlags = behavior.flags.filter(f => f.timestamp >= twentyFourHoursAgo)
          
          for (const flag of recentFlags) {
            // Cek apakah user mengizinkan alert tipe ini
            const prefKey = flag.type.toLowerCase()
            if (prefs[prefKey] === false) continue
            
            // Cek anti-spam: Jangan kirim alert dengan tipe yang sama dalam 1 jam terakhir
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
            const { data: recentAlerts } = await supabase
              .from('alerts')
              .select('id')
              .eq('user_id', userData.id)
              .eq('type', flag.type)
              .gte('sent_at', oneHourAgo)
              .limit(1)
              
            if (recentAlerts && recentAlerts.length > 0) {
              continue // Skip, sudah dikirim baru-baru ini
            }
            
            // Siapkan pesan Telegram
            let message = ''
            if (flag.type === 'FOMO') {
              message = buildFomoAlert(flag.coin, 10) // Mock price change
            } else if (flag.type === 'REVENGE') {
              message = buildRevengeAlert(flag.coin, 50, 15, 2) // Mock values
            } else if (flag.type === 'OVERLEVERAGE') {
              message = buildOverleverageAlert(flag.coin, 15, 15000, 1000) // Mock values
            } else if (flag.type === 'APE') {
              message = buildApeAlert(flag.coin, 'Jumlah Besar')
            }
            
            if (message) {
              // Kirim ke Telegram
              const sent = await sendTelegramMessage(userData.telegram_chat_id, message)
              
              if (sent) {
                // Catat ke database untuk anti-spam
                await supabase.from('alerts').insert({
                  user_id: userData.id,
                  type: flag.type,
                  message: `Alert ${flag.type} sent for ${flag.coin}`,
                })
              }
            }
          }
        }
      }
    } catch (syncError) {
      console.error('[API /trades] Failed to auto-sync score:', syncError)
      // Kita tidak melempar error di sini agar response ke client tetap sukses
    }

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
