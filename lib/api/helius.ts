/**
 * Layanan integrasi Helius API untuk Solana.
 * Digunakan untuk mengambil balance dan transaksi Token di jaringan Solana.
 */

const HELIUS_API_KEY = process.env.HELIUS_API_KEY
const BASE_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`

export interface SolanaTokenBalance {
  mint: string
  amount: number
  decimals: number
  symbol: string
}

export async function getSolanaBalances(walletAddress: string): Promise<SolanaTokenBalance[]> {
  if (!HELIUS_API_KEY) {
    console.warn('HELIUS_API_KEY is missing. Skipping Solana balances.')
    return []
  }

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'my-id',
        method: 'getTokenAccountsByOwner',
        params: [
          walletAddress,
          { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
          { encoding: 'jsonParsed' },
        ],
      }),
    })

    if (!response.ok) throw new Error('Helius API error')

    const data = await response.json()
    const balances: SolanaTokenBalance[] = []

    // Parse Helius response
    if (data.result && data.result.value) {
      for (const account of data.result.value) {
        const info = account.account.data.parsed.info
        const amount = parseFloat(info.tokenAmount.uiAmount)
        if (amount > 0) {
          balances.push({
            mint: info.mint,
            amount: amount,
            decimals: info.tokenAmount.decimals,
            symbol: 'SOL_TOKEN', // Memerlukan Das API Helius untuk metadara asli
          })
        }
      }
    }

    return balances
  } catch (error) {
    console.error('Error fetching Solana balances:', error)
    return []
  }
}
