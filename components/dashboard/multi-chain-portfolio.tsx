'use client'

import { usePortfolio } from '@/hooks/use-portfolio'
import { Wallet, Loader2, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface MultiChainPortfolioProps {
  walletAddress: string | undefined
}

export function MultiChainPortfolio({ walletAddress }: MultiChainPortfolioProps) {
  const { data, isLoading, error } = usePortfolio(walletAddress)

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-6 flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-4" />
        <p className="text-sm text-slate-400">Loading multi-chain assets...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-6 flex flex-col items-center justify-center min-h-[200px]">
        <AlertCircle className="h-8 w-8 text-red-400 mb-4" />
        <p className="text-sm text-red-300">{error}</p>
      </div>
    )
  }

  const hasAssets = (data?.ethereum?.length || 0) > 0 || (data?.solana?.length || 0) > 0

  if (!hasAssets) {
    return (
      <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-6 flex flex-col items-center justify-center min-h-[200px]">
        <Wallet className="h-8 w-8 text-slate-500 mb-4" />
        <p className="text-sm text-slate-400">No assets found on Ethereum or Solana.</p>
        <p className="text-xs text-slate-500 mt-2">Ensure your API keys are valid in .env.local</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
          <Wallet className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Spot Portfolio</h2>
          <p className="text-xs text-slate-500">Assets on Ethereum & Solana</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Ethereum Section */}
        {data?.ethereum && data.ethereum.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Ethereum
            </h3>
            <div className="space-y-2">
              {data.ethereum.map((token, i) => {
                // Moralis returns balance in Wei (raw integer string)
                // We need to divide by 10^decimals
                const rawBalance = parseFloat(token.balance)
                const formattedBalance = rawBalance / Math.pow(10, token.decimals)
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={`${token.token_address}-${i}`} 
                    className="flex items-center justify-between rounded-xl bg-slate-800/30 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{token.name || token.symbol}</p>
                      <p className="text-xs text-slate-500">{token.symbol}</p>
                    </div>
                    <p className="text-sm font-bold text-white">
                      {formattedBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* Solana Section */}
        {data?.solana && data.solana.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Solana
            </h3>
            <div className="space-y-2">
              {data.solana.map((token, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={`${token.mint}-${i}`} 
                  className="flex items-center justify-between rounded-xl bg-slate-800/30 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">Token {token.mint.slice(0, 4)}...{token.mint.slice(-4)}</p>
                    <p className="text-xs text-slate-500">Solana Asset</p>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {token.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
