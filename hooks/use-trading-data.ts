'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import type { ProcessedTrade, PnlSummary } from '@/lib/engines/pnl'
import type { BehaviorReport } from '@/lib/engines/behavior'

// ====================================
// Custom Hook: useTradingData
// Mengambil data trading dari API /api/trades berdasarkan
// wallet address yang terhubung via Wagmi.
// ====================================

interface ChartDataPoint {
  date: string
  truePnl: number
  rawPnl: number
}

interface TradingData {
  trades: ProcessedTrade[]
  summary: PnlSummary | null
  behavior: BehaviorReport | null
  chartData: ChartDataPoint[]
}

interface UseTradingDataReturn {
  data: TradingData
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useTradingData(days: string = 'all'): UseTradingDataReturn {
  const { address, isConnected } = useAccount()

  const [data, setData] = useState<TradingData>({
    trades: [],
    summary: null,
    behavior: null,
    chartData: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!isConnected || !address) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/trades?wallet=${address}&days=${days}`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()

      setData({
        trades: result.trades || [],
        summary: result.summary || null,
        behavior: result.behavior || null,
        chartData: result.chartData || [],
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch data'
      setError(message)
      console.error('[useTradingData]', message)
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected, days])

  // Fetch otomatis saat wallet connect
  useEffect(() => {
    if (isConnected && address) {
      fetchData()
    }
  }, [isConnected, address, fetchData])

  return { data, isLoading, error, refetch: fetchData }
}
