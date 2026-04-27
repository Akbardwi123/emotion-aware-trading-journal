/**
 * Layanan integrasi Moralis API untuk Ethereum, Base, Polygon, dll.
 * Digunakan untuk mengambil balance ERC20 dan riwayat transfer.
 */

const MORALIS_API_KEY = process.env.MORALIS_API_KEY
const BASE_URL = 'https://deep-index.moralis.io/api/v2.2'

export interface EvmTokenBalance {
  token_address: string
  name: string
  symbol: string
  decimals: number
  balance: string
  usd_value?: number
}

export async function getEvmTokenBalances(walletAddress: string, chain: string = 'eth'): Promise<EvmTokenBalance[]> {
  if (!MORALIS_API_KEY) {
    console.warn('MORALIS_API_KEY is missing. Skipping EVM balances.')
    return []
  }

  try {
    const response = await fetch(`${BASE_URL}/wallets/${walletAddress}/tokens?chain=${chain}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': MORALIS_API_KEY
      }
    })

    if (!response.ok) throw new Error('Moralis API error')

    const data = await response.json()
    return data.result as EvmTokenBalance[]
  } catch (error) {
    console.error(`Error fetching EVM balances for ${chain}:`, error)
    return []
  }
}
