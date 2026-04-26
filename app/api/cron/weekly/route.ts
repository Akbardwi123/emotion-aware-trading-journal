import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase/server'
import { getUserFills, getUserFunding } from '@/lib/api/hyperliquid'
import { processHyperliquidFills, calculatePnlSummary } from '@/lib/engines/pnl'
import { analyzeBehavior } from '@/lib/engines/behavior'
import { sendTelegramMessage, buildWeeklyDigest } from '@/lib/api/telegram'

// ====================================
// CRON JOB: Weekly Digest
// Rute ini dipanggil seminggu sekali (misal: setiap Senin jam 00:00)
// untuk mengirim ringkasan performa ke pengguna yang mengaktifkan "Weekly Digest"
// ====================================

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: Request) {
  // Verifikasi bahwa request berasal dari Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Ambil semua user yang punya telegram_chat_id dan weekly_digest = true
    const { data: users, error } = await supabase
      .from('users')
      .select('id, wallet_address, telegram_chat_id, alert_preferences')
      .not('telegram_chat_id', 'is', null)

    if (error || !users || users.length === 0) {
      return NextResponse.json({
        message: 'No users to process',
        processed: 0,
      })
    }

    // Filter user yang mengaktifkan fitur weekly_digest di preferensi mereka
    const eligibleUsers = users.filter((user) => {
      // preferences default jika null adalah weekly_digest = false
      const prefs = user.alert_preferences as Record<string, boolean> | null
      return prefs?.weekly_digest === true
    })

    if (eligibleUsers.length === 0) {
      return NextResponse.json({
        message: 'No users have weekly_digest enabled',
        processed: 0,
      })
    }

    let alertsSent = 0

    // 2. Untuk setiap user, hitung statistik 7 hari terakhir
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

    for (const user of eligibleUsers) {
      try {
        // Ambil semua fills (kita paginasi jika perlu, tapi getUserFills mengambil maks 500 terbaru)
        // Idealnya getAllUserFills dipakai dengan limit time, tapi untuk performa kita pakai getUserFills standar dulu
        const fills = await getUserFills(user.wallet_address)
        
        // Filter fills hanya untuk 7 hari terakhir
        const recentFills = fills.filter(f => f.time >= sevenDaysAgo)
        if (recentFills.length === 0) continue

        // Ambil funding rate
        const funding = await getUserFunding(user.wallet_address, sevenDaysAgo)

        // Proses PnL & Behavior
        const trades = processHyperliquidFills(recentFills, funding)
        if (trades.length === 0) continue

        const summary = calculatePnlSummary(trades)
        const report = analyzeBehavior(trades)

        // 3. Bangun pesan Weekly Digest
        const message = buildWeeklyDigest(
          report.score,
          summary.totalTruePnl,
          summary.winRate,
          report.fomoCount,
          report.revengeCount
        )

        // 4. Kirim ke Telegram
        const sent = await sendTelegramMessage(user.telegram_chat_id, message)

        if (sent) {
          alertsSent++
        }
      } catch (userError) {
        console.error(`[Weekly Cron] Error processing user ${user.wallet_address}:`, userError)
        continue
      }
    }

    return NextResponse.json({
      message: 'Weekly digest cron job completed',
      usersProcessed: eligibleUsers.length,
      alertsSent,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Weekly Cron] Fatal error:', error)
    return NextResponse.json(
      { error: 'Weekly cron job failed' },
      { status: 500 }
    )
  }
}
