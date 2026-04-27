import { useState, useEffect } from 'react'

export interface EvmTokenBalance {
  token_address: string
  name: string
  symbol: string
  decimals: number
  balance: string
}

export interface SolanaTokenBalance {
  mint: string
  amount: number
  decimals: number
  symbol: string
}

export interface PortfolioData {
  ethereum: EvmTokenBalance[]
  solana: SolanaTokenBalance[]
}

export function usePortfolio(walletAddress: string | undefined) {
  const [data, setData] = useState<PortfolioData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPortfolio() {
      if (!walletAddress) {
        setData(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const res = await fetch(`/api/portfolio?wallet=${walletAddress}`)
        if (!res.ok) throw new Error('Failed to fetch portfolio data')
        
        const json = await res.json()
        if (json.portfolio) {
          setData(json.portfolio)
        }
      } catch (err) {
        console.error('Error fetching portfolio:', err)
        setError('Failed to load multi-chain portfolio')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPortfolio()
  }, [walletAddress])

  return { data, isLoading, error }
}
