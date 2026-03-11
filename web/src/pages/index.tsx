import { useEffect, useState } from 'react'
import { CloudRain, Twitter, Zap, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface RainEvent {
  id: string
  sender_twitter_id: string
  token: string
  total_amount: number
  recipient_count: number
  created_at: string
}

export default function Home() {
  const [stats, setStats] = useState({
    totalRains: 0,
    totalClaimed: 0,
    activeUsers: 0,
  })
  const [liveRains, setLiveRains] = useState<RainEvent[]>([])

  useEffect(() => {
    fetchStats()
    fetchLiveRains()
    
    // Subscribe to realtime rains
    const subscription = supabase
      .channel('rain_events')
      .on('INSERT', { event: '*', schema: 'public', table: 'rain_events' }, 
        (payload) => {
          setLiveRains(prev => [payload.new as RainEvent, ...prev].slice(0, 10))
        }
      )
      .subscribe()
    
    return () => { subscription.unsubscribe() }
  }, [])

  async function fetchStats() {
    const { count: rains } = await supabase.from('rain_events').select('*', { count: 'exact' })
    const { count: users } = await supabase.from('users').select('*', { count: 'exact' })
    const { data: claimed } = await supabase.from('claims').select('amount').eq('status', 'claimed')
    
    const totalClaimed = claimed?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
    
    setStats({
      totalRains: rains || 0,
      totalClaimed: Math.floor(totalClaimed),
      activeUsers: users || 0,
    })
  }

  async function fetchLiveRains() {
    const { data } = await supabase
      .from('rain_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    setLiveRains(data || [])
  }

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center py-16">
        <CloudRain className="w-24 h-24 text-primary mx-auto mb-6" />
        <h1 className="text-5xl font-bold mb-4">
          Make it <span className="text-primary">Rain</span> on X
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
          The first Twitter-integrated rain bot for Solana. Reward your community 
          with $SOL, $USDC, or any SPL token.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
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
          <div className="text-3xl font-bold text-primary mb-2">{stats.totalRains.toLocaleString()}</div>
          <div className="text-gray-400">Total Rains</div>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-gray-800">
          <div className="text-3xl font-bold text-secondary mb-2">{stats.totalClaimed.toLocaleString()}</div>
          <div className="text-gray-400">Tokens Claimed</div>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-gray-800">
          <div className="text-3xl font-bold text-primary mb-2">{stats.activeUsers.toLocaleString()}</div>
          <div className="text-gray-400">Active Users</div>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-surface rounded-2xl p-8 border border-gray-800">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary text-black rounded-full flex items-center justify-center mx-auto mb-4 font-bold">1</div>
            <h4 className="font-semibold mb-2">Tweet</h4>
            <p className="text-sm text-gray-400">Reply "@xpay rain 1000 $TOKEN" to any tweet</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary text-black rounded-full flex items-center justify-center mx-auto mb-4 font-bold">2</div>
            <h4 className="font-semibold mb-2">Retweet</h4>
            <p className="text-sm text-gray-400">Bot detects retweeters & checks eligibility</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary text-black rounded-full flex items-center justify-center mx-auto mb-4 font-bold">3</div>
            <h4 className="font-semibold mb-2">Claim</h4>
            <p className="text-sm text-gray-400">Recipients get DM with claim link</p>
          </div>
        </div>
      </section>

      {/* Live Rain Feed */}
      <section className="bg-surface rounded-2xl p-8 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            Live Rain Feed
          </h2>
          <span className="flex items-center gap-2 text-sm text-green-500">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
        </div>
        
        <div className="space-y-3">
          {liveRains.length > 0 ? (
            liveRains.map((rain) => (
              <div key={rain.id} className="flex items-center justify-between p-4 bg-background rounded-lg hover:border hover:border-primary/30 transition">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <CloudRain className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">
                      @{rain.sender_twitter_id} rained {rain.total_amount} ${rain.token}
                    </div>
                    <div className="text-sm text-gray-400">
                      {rain.recipient_count} recipients • {new Date(rain.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <Link 
                  to={`/claim/${rain.id}`}
                  className="text-primary hover:underline text-sm"
                >
                  View →
                </Link>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <CloudRain className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Waiting for rains... Follow @xpay to see live rains!</p>
            </div>
          )}
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
            Just reply with "@xpay rain &lt;amount&gt; &lt;token&gt;" to any tweet.
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
    </div>
  )
}