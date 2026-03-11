import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface RainEvent {
  id: string
  token: string
  amount: number
  status: string
  created_at: string
}

export default function Dashboard() {
  const { publicKey } = useWallet()
  const [user, setUser] = useState<any>(null)
  const [claims, setClaims] = useState<any[]>([])
  const [rains, setRains] = useState<RainEvent[]>([])

  useEffect(() => {
    if (publicKey) {
      fetchUserData()
    }
  }, [publicKey])

  async function fetchUserData() {
    const wallet = publicKey?.toString()
    
    // Fetch user
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('solana_address', wallet)
      .single()
    
    setUser(userData)

    if (userData) {
      // Fetch claims
      const { data: claimsData } = await supabase
        .from('claims')
        .select('*, rain_event:rain_events(*)')
        .eq('receiver_twitter_id', userData.twitter_id)
        .order('created_at', { ascending: false })
      
      setClaims(claimsData || [])

      // Fetch rains sent
      const { data: rainsData } = await supabase
        .from('rain_events')
        .select('*')
        .eq('sender_twitter_id', userData.twitter_id)
        .order('created_at', { ascending: false })
      
      setRains(rainsData || [])
    }
  }

  if (!publicKey) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
        <p className="text-gray-400">Connect your Solana wallet to view your dashboard</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {user ? (
        <>
          {/* User Info */}
          <div className="bg-surface p-6 rounded-xl border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">Profile</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-gray-400 text-sm">Twitter</div>
                <div className="font-medium">@{user.twitter_handle}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Wallet</div>
                <div className="font-medium font-mono text-sm">{publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}</div>
              </div>
            </div>
          </div>

          {/* Claims */}
          <div className="bg-surface p-6 rounded-xl border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">Your Claims</h2>
            {claims.length > 0 ? (
              <div className="space-y-3">
                {claims.map((claim) => (
                  <div key={claim.id} className="flex justify-between items-center p-4 bg-background rounded-lg">
                    <div>
                      <div className="font-medium">{claim.amount} ${claim.token}</div>
                      <div className="text-sm text-gray-400">{new Date(claim.created_at).toLocaleDateString()}</div>
                    </div>
                    {claim.status === 'pending' ? (
                      <Link
                        to={`/claim/${claim.rain_event_id}`}
                        className="bg-primary text-black px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
                      >
                        Claim
                      </Link>
                    ) : (
                      <span className="text-green-500 text-sm">✓ Claimed</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No claims yet. Watch for rains on Twitter!</p>
            )}
          </div>

          {/* Rains Sent */}
          <div className="bg-surface p-6 rounded-xl border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">Rains Sent</h2>
            {rains.length > 0 ? (
              <div className="space-y-3">
                {rains.map((rain) => (
                  <div key={rain.id} className="flex justify-between items-center p-4 bg-background rounded-lg">
                    <div>
                      <div className="font-medium">{rain.total_amount} ${rain.token}</div>
                      <div className="text-sm text-gray-400">{rain.recipient_count} recipients</div>
                    </div>
                    <span className={`text-sm ${rain.status === 'completed' ? 'text-green-500' : 'text-yellow-500'}`}>
                      {rain.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No rains sent yet. Reply to a tweet with "@xpay rain &lt;amount&gt; &lt;token&gt;"</p>
            )}
          </div>
        </>
      ) : (
        <div className="bg-surface p-8 rounded-xl border border-gray-800 text-center">
          <h2 className="text-xl font-semibold mb-2">Link Your Twitter</h2>
          <p className="text-gray-400 mb-4">
            To use $XPAY, you need to link your Twitter account with your Solana wallet.
          </p>
          <button className="bg-primary text-black px-6 py-3 rounded-lg font-semibold hover:opacity-90">
            Link Twitter Account
          </button>
        </div>
      )}
    </div>
  )
}