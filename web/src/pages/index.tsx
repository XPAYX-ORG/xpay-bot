import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CloudRain, Twitter, Zap, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [stats, setStats] = useState({
    totalRains: 0,
    totalClaimed: 0,
    activeUsers: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    // Fetch stats from Supabase
    const { data: rains } = await supabase.from('rain_events').select('count')
    const { data: users } = await supabase.from('users').select('count')
    
    setStats({
      totalRains: rains?.[0]?.count || 0,
      totalClaimed: 0,
      activeUsers: users?.[0]?.count || 0,
    })
  }

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center py-16">
        <CloudRain className="w-24 h-24 text-primary mx-auto mb-6" />
        <h1 className="text-5xl font-bold mb-4">
          Make it <span className="text-primary">Rain</span> on Solana
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
          The first Twitter-integrated rain bot for Solana. Reward your community 
          with $SOL, $USDC, or any SPL token.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/claim"
            className="bg-primary text-black px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Claim Airdrop
          </Link>
          <a
            href="https://twitter.com/xpay"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gray-700 px-8 py-3 rounded-lg font-semibold hover:border-primary transition flex items-center gap-2"
          >
            <Twitter className="w-5 h-5" />
            Follow @xpay
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="grid md:grid-cols-3 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-gray-800">
          <div className="text-3xl font-bold text-primary mb-2">{stats.totalRains}</div>
          <div className="text-gray-400">Total Rains</div>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-gray-800">
          <div className="text-3xl font-bold text-secondary mb-2">{stats.totalClaimed}</div>
          <div className="text-gray-400">Tokens Claimed</div>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-gray-800">
          <div className="text-3xl font-bold text-primary mb-2">{stats.activeUsers}</div>
          <div className="text-gray-400">Active Users</div>
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Twitter className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Twitter Native</h3>
          <p className="text-gray-400">
            Just reply with "@xpay rain 100 $SOL" to any tweet to start raining.
          </p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-secondary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Instant Claims</h3>
          <p className="text-gray-400">
            Connect your wallet and claim instantly. No gas fees for recipients.
          </p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Anti-Bot</h3>
          <p className="text-gray-400">
            Smart filters ensure real users get the drops. Account age & follower checks.
          </p>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-surface rounded-2xl p-8 border border-gray-800">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary text-black rounded-full flex items-center justify-center mx-auto mb-4 font-bold">1</div>
            <h4 className="font-semibold mb-2">Reply to Tweet</h4>
            <p className="text-sm text-gray-400">@xpay rain 1000 $XPAY</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary text-black rounded-full flex items-center justify-center mx-auto mb-4 font-bold">2</div>
            <h4 className="font-semibold mb-2">Bot Validates</h4>
            <p className="text-sm text-gray-400">Checks retweeters & eligibility</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary text-black rounded-full flex items-center justify-center mx-auto mb-4 font-bold">3</div>
            <h4 className="font-semibold mb-2">Receive Link</h4>
            <p className="text-sm text-gray-400">DM with claim link sent</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary text-black rounded-full flex items-center justify-center mx-auto mb-4 font-bold">4</div>
            <h4 className="font-semibold mb-2">Claim Tokens</h4>
            <p className="text-sm text-gray-400">Connect wallet & claim</p>
          </div>
        </div>
      </section>
    </div>
  )
}