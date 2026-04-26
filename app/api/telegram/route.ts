import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase/server'

// POST: User menyimpan Telegram Chat ID mereka ke database
// Dipanggil dari halaman Settings di frontend
export async function POST(request: NextRequest) {
  try {
    const { wallet_address, telegram_chat_id } = await request.json()

    if (!wallet_address || !telegram_chat_id) {
      return NextResponse.json(
        { error: 'wallet_address and telegram_chat_id are required' },
        { status: 400 }
      )
    }

    // Update user dengan telegram_chat_id
    const { data, error } = await supabase
      .from('users')
      .update({ telegram_chat_id })
      .eq('wallet_address', wallet_address)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Telegram linked successfully',
      user: data,
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
