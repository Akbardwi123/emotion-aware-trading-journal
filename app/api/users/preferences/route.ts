import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase/server'

// GET: Mengambil alert preferences dari user berdasarkan wallet
export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet')

  if (!wallet) {
    return NextResponse.json(
      { error: 'wallet query parameter is required' },
      { status: 400 }
    )
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('alert_preferences')
      .eq('wallet_address', wallet)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return the preferences, or default values if null
    const preferences = data?.alert_preferences || {
      fomo: true,
      revenge: true,
      overleverage: true,
      weekly_digest: false,
    }

    return NextResponse.json({ preferences })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

// PATCH: Memperbarui alert preferences user
export async function PATCH(request: NextRequest) {
  try {
    const { wallet_address, preferences } = await request.json()

    if (!wallet_address || !preferences) {
      return NextResponse.json(
        { error: 'wallet_address and preferences are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('users')
      .update({ alert_preferences: preferences })
      .eq('wallet_address', wallet_address)
      .select('alert_preferences')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Preferences updated successfully',
      preferences: data.alert_preferences,
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
