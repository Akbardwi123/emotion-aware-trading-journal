import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase/server'

// ====================================
// API: /api/leaderboard?week=2026-04-21
// Mengambil ranking global berdasarkan behavior score
// Jika parameter week tidak diberikan, ambil minggu ini
// ====================================

export async function GET(request: NextRequest) {
  const weekParam = request.nextUrl.searchParams.get('week')

  // Hitung tanggal Senin minggu ini jika tidak diberikan
  let week = weekParam
  if (!week) {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(now.setDate(diff))
    week = monday.toISOString().split('T')[0]
  }

  try {
    // Ambil skor minggu ini, urutkan dari tertinggi
    const { data: scores, error } = await supabase
      .from('behavior_scores')
      .select(`
        score,
        fomo_count,
        revenge_count,
        overleverage_count,
        week,
        users (
          id,
          wallet_address
        )
      `)
      .eq('week', week)
      .order('score', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format data untuk frontend
    const leaderboard = (scores || []).map((entry, index) => {
      // Supabase FK join: users bisa berupa object atau array tergantung relasi
      const user = Array.isArray(entry.users) ? entry.users[0] : entry.users
      return {
        rank: index + 1,
        walletAddress: (user as { wallet_address: string } | null)?.wallet_address || 'Unknown',
        score: entry.score,
        fomoCount: entry.fomo_count,
        revengeCount: entry.revenge_count,
        overleverageCount: entry.overleverage_count,
      }
    })

    return NextResponse.json({ leaderboard, week })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
