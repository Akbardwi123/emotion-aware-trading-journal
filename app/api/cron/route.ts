import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { getUserFills, getUserFunding } from '@/lib/api/hyperliquid'
import { processHyperliquidFills } from '@/lib/engines/pnl'
import { analyzeBehavior } from '@/lib/engines/behavior'
import {
  sendTelegramMessage,
  buildFomoAlert,
  buildRevengeAlert,
  buildOverleverageAlert,
} from '@/lib/api/telegram'

// ====================================
// CRON JOB: Monitoring Otomatis
// Rute ini dipanggil secara berkala oleh Vercel Cron
// untuk mengecek trade terbaru semua user dan mengirim alert
//
// Setup di vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron",
//     "schedule": "*/5 * * * *"   ← setiap 5 menit
//   }]
// }
// ====================================

// Kunci rahasia untuk memastikan hanya Vercel Cron yang bisa memanggil
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: Request) {
  // Verifikasi bahwa request berasal dari Vercel Cron (opsional tapi direkomendasikan)
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Ambil semua user yang punya telegram_chat_id
    const { data: users, error } = await supabase
      .from('users')
      .select('id, wallet_address, telegram_chat_id')
      .not('telegram_chat_id', 'is', null)

    if (error || !users || users.length === 0) {
      return NextResponse.json({
        message: 'No users with Telegram configured',
        processed: 0,
      })
    }

    let alertsSent = 0

    // 2. Untuk setiap user, cek trade terbaru
    for (const user of users) {
      try {
        // Ambil fills terbaru dari Hyperliquid
        const fills = await getUserFills(user.wallet_address)
        if (fills.length === 0) continue

        // Ambil funding rate (30 hari terakhir)
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
        const funding = await getUserFunding(user.wallet_address, thirtyDaysAgo)

        // Proses menjadi trade terstruktur
        const trades = processHyperliquidFills(fills, funding)
        if (trades.length === 0) continue

        // Jalankan behavior detection
        const report = analyzeBehavior(trades)

        // 3. Cek apakah ada flag BARU (dalam 10 menit terakhir)
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000
        const recentFlags = report.flags.filter(
          (flag) => flag.timestamp > tenMinutesAgo
        )

        // 4. Kirim alert untuk setiap flag baru
        for (const flag of recentFlags) {
          // Cek apakah alert ini sudah pernah dikirim (hindari spam)
          const { data: existingAlert } = await supabase
            .from('alerts')
            .select('id')
            .eq('user_id', user.id)
            .eq('type', flag.type)
            .gte('sent_at', new Date(tenMinutesAgo).toISOString())
            .single()

          if (existingAlert) continue // Sudah pernah dikirim, skip

          // Bangun pesan berdasarkan tipe
          let message = flag.description
          if (flag.type === 'FOMO') {
            message = buildFomoAlert(flag.coin, 5)
          } else if (flag.type === 'REVENGE') {
            message = buildRevengeAlert(flag.coin, 50, 5, 1.5)
          } else if (flag.type === 'OVERLEVERAGE') {
            message = buildOverleverageAlert(flag.coin, 20, 10000, 500)
          }

          // Kirim ke Telegram
          const sent = await sendTelegramMessage(user.telegram_chat_id, message)

          if (sent) {
            // Simpan log alert ke database
            await supabase.from('alerts').insert({
              user_id: user.id,
              type: flag.type,
              message: flag.description,
            })
            alertsSent++
          }
        }

        // 5. Update behavior score di database
        const currentWeek = getWeekStart()
        await supabase
          .from('behavior_scores')
          .upsert(
            {
              user_id: user.id,
              score: report.score,
              fomo_count: report.fomoCount,
              revenge_count: report.revengeCount,
              overleverage_count: report.overleverageCount,
              week: currentWeek,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,week' }
          )
      } catch (userError) {
        console.error(`[Cron] Error processing user ${user.wallet_address}:`, userError)
        // Lanjutkan ke user berikutnya
        continue
      }
    }

    return NextResponse.json({
      message: 'Cron job completed',
      usersProcessed: users.length,
      alertsSent,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron] Fatal error:', error)
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    )
  }
}

/**
 * Helper: Mendapatkan tanggal Senin minggu ini (untuk grouping mingguan)
 */
function getWeekStart(): string {
  const now = new Date()
  const day = now.getDay() // 0 = Minggu, 1 = Senin, ...
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Adjust ke Senin
  const monday = new Date(now.setDate(diff))
  return monday.toISOString().split('T')[0] // Format: 'YYYY-MM-DD'
}
