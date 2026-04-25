'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Activity, Settings } from 'lucide-react'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/leaderboard', label: 'Leaderboard' },
]

export function Navbar() {
  const { address, isConnected } = useAccount()
  const pathname = usePathname()

  // Saat wallet terhubung, simpan alamat wallet ke database Supabase
  useEffect(() => {
    if (isConnected && address) {
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: address }),
      })
    }
  }, [isConnected, address])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Emo<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Trade</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
          {isConnected && (
            <Link
              href="/settings"
              className={`rounded-lg p-2 transition-colors ${
                pathname === '/settings'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Connect Wallet Button (dari RainbowKit) */}
        <ConnectButton 
          showBalance={false}
          chainStatus="icon"
          accountStatus="avatar"
        />
      </div>
    </nav>
  )
}
