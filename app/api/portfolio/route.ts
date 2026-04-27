import { NextRequest, NextResponse } from 'next/server'
import { getEvmTokenBalances } from '@/lib/api/moralis'
import { getSolanaBalances } from '@/lib/api/helius'

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet')

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 })
  }

  try {
    // Jalankan pengambilan data secara paralel untuk mempercepat response
    const [ethBalances, solBalances] = await Promise.allSettled([
      getEvmTokenBalances(wallet, 'eth'),
      getSolanaBalances(wallet),
    ])

    const portfolio = {
      ethereum: ethBalances.status === 'fulfilled' ? ethBalances.value : [],
      solana: solBalances.status === 'fulfilled' ? solBalances.value : [],
    }

    return NextResponse.json({ portfolio })
  } catch (error) {
    console.error('Error fetching portfolio:', error)
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 })
  }
}
