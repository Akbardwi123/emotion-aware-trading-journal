'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Activity, Settings, Menu, X, Loader2 } from 'lucide-react'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/leaderboard', label: 'Leaderboard' },
]

export function Navbar() {
  const { address, isConnected } = useAccount()
  const pathname = usePathname()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  // Saat wallet terhubung, simpan alamat wallet ke database Supabase
  useEffect(() => {
    async function registerWallet() {
      if (!isConnected || !address) return
      
      setIsRegistering(true)
      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet_address: address }),
        })
        
        if (!response.ok) {
          console.error('[Navbar] Failed to register wallet:', response.status)
        }
      } catch (err) {
        console.error('[Navbar] Error registering wallet:', err)
      } finally {
        setIsRegistering(false)
      }
    }
    
    registerWallet()
  }, [isConnected, address])

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

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

        <div className="flex items-center gap-4">
          {/* Status Indicator */}
          {isRegistering && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Syncing...</span>
            </div>
          )}

          {/* Connect Wallet Button (dari RainbowKit) */}
          <ConnectButton 
            showBalance={false}
            chainStatus="icon"
            accountStatus="avatar"
          />

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-slate-900/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
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
                className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  pathname === '/settings'
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
