import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Link } from 'react-router-dom'
import { Twitter, Wallet, History, Gift } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface RainEvent {
  id: string
  token: string
  total_amount: number
  amount: number
  status: string
  recipient_count: number
  created_at: string
}

export default function Dashboard() {
  const { publicKey, connected } = useWallet()
  const [user, setUser] = useState<any>(null)
  const [claims, setClaims] = useState<any[]>([])
  const [rains, setRains] = useState<RainEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [linkingTwitter, setLinkingTwitter] = useState(false)

  useEffect(() => {
    if (connected && publicKey) {
      checkUser()
    } else {
      setLoading(false)
    }
  }, [connected, publicKey])

  async function checkUser() {
    if (!publicKey) return
    
    const wallet = publicKey.toString()
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('solana_address', wallet)
      .single()
    
    if (existingUser) {
      setUser(existingUser)
      fetchUserData(existingUser.twitter_id)
    }
    
    setLoading(false)
  }

  async function fetchUserData(twitterId: string) {
    // Fetch claims
    const { data: claimsData } = await supabase
      .from('claims')
      .select('*, rain_event:rain_events(*)')
      .eq('receiver_twitter_id', twitterId)
      .order('created_at', { ascending: false })
    
    setClaims(claimsData || [])

    // Fetch rains sent
    const { data: rainsData } = await supabase
      .from('rain_events')
      .select('*')
      .eq('sender_twitter_id', twitterId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    setRains(rainsData || [])
  }

  function linkTwitter() {
    setLinkingTwitter(true)
    
    // Twitter OAuth URL
    const clientId = import.meta.env.VITE_TWITTER_CLIENT_ID
    const redirectUri = `${import.meta.env.VITE_APP_URL}/auth/callback`
    const scope = 'tweet.read users.read offline.access'
    
    const authUrl = `https://twitter.com/i/oauth2/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `code_challenge=challenge&` +
      `code_challenge_method=plain&` +
      `state=${publicKey?.toString()}`
    
    window.location.href = authUrl
  }

  if (!connected) {
    return (
      <div className="text-center py-16">
        <Wallet className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
        <p className="text-gray-400">Connect your Solana wallet to view your dashboard</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
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
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Twitter className="w-5 h-5 text-primary" />
              Profile
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-gray-400 text-sm">Twitter</div>
                <div className="font-medium">@{user.twitter_handle}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Wallet</div>
                <div className="font-medium font-mono text-sm">
                  {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                </div>
              </div>
            </div>
          </div>

          {/* Pending Claims */}
          <div className="bg-surface p-6 rounded-xl border border-gray-800">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-green-500" />
              Pending Claims
            </h2>
            {claims.filter(c => c.status === 'pending').length > 0 ? (
              <div className="space-y-3">
                {claims.filter(c => c.status === 'pending').map((claim) => (
                  <div key={claim.id} className="flex justify-between items-center p-4 bg-background rounded-lg">
                    <div>
                      <div className="font-medium">{claim.amount} ${claim.token}</div>
                      <div className="text-sm text-gray-400">
                        From @{claim.rain_event?.sender_twitter_id}
                      </div>
                    </div>
                    <Link
                      to={`/claim/${claim.rain_event_id}`}
                      className="bg-primary text-black px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
                    >
                      Claim
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No pending claims. Watch for rains on Twitter!</p>
            )}
          </div>

          {/* Transaction History */}
          <div className="bg-surface p-6 rounded-xl border border-gray-800">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-secondary" />
              Transaction History
            </h2>
            {claims.filter(c => c.status === 'claimed').length > 0 ? (
              <div className="space-y-3">
                {claims.filter(c => c.status === 'claimed').map((claim) => (
                  <div key={claim.id} className="flex justify-between items-center p-4 bg-background rounded-lg">
                    <div>
                      <div className="font-medium text-green-500">
                        +{claim.amount} ${claim.token}
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(claim.claimed_at).toLocaleDateString()}
                      </div>
                    </div>
                    <a 
                      href={`https://solscan.io/tx/${claim.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      View →
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No transactions yet.</p>
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
              <p className="text-gray-400">
                No rains sent yet. Reply to a tweet with "@xpay rain &lt;amount&gt; &lt;token&gt;"
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="bg-surface p-8 rounded-xl border border-gray-800 text-center">
          <Twitter className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Link Your Twitter</h2>
          <p className="text-gray-400 mb-6">
            To use $XPAY, you need to link your Twitter account with your Solana wallet.
            This allows us to verify your identity and send you claim notifications.
          </p>
          <button 
            onClick={linkTwitter}
            disabled={linkingTwitter}
            className="bg-primary text-black px-6 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            <Twitter className="w-5 h-5" />
            {linkingTwitter ? 'Connecting...' : 'Connect Twitter'}
          </button>
        </div>
      )}
    </div>
  )
}