import { Link } from 'react-router-dom'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { CloudRain, Home, Trophy, User } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-white">
      <nav className="border-b border-gray-800 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-2">
              <CloudRain className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold">$XPAY</span>
            </Link>
            
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
                <Home className="w-5 h-5" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <Link to="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
                <User className="w-5 h-5" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link to="/leaderboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
                <Trophy className="w-5 h-5" />
                <span className="hidden sm:inline">Leaderboard</span>
              </Link>
              <WalletMultiButton className="!bg-primary !text-black hover:!opacity-90" />
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}