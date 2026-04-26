import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase/server'

// POST: Menyimpan wallet address baru ke tabel users
export async function POST(request: NextRequest) {
  try {
    const { wallet_address } = await request.json()

    if (!wallet_address) {
      return NextResponse.json(
        { error: 'wallet_address is required' },
        { status: 400 }
      )
    }

    // Cek apakah wallet sudah terdaftar
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', wallet_address)
      .single()

    // Jika belum ada, buat user baru
    if (!existingUser) {
      const { data, error } = await supabase
        .from('users')
        .insert({ wallet_address })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(
        { message: 'User created', user: data },
        { status: 201 }
      )
    }

    return NextResponse.json(
      { message: 'User already exists', user: existingUser },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
