import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { Clock, CheckCircle, XCircle, Twitter } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Claim() {
  const { rainId } = useParams()
  const navigate = useNavigate()
  const { publicKey, connected, connect } = useWallet()
  const { connection } = useConnection()
  
  const [claim, setClaim] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState('')
  const [twitterLinked, setTwitterLinked] = useState(false)

  useEffect(() => {
    if (rainId && connected) {
      fetchClaim()
    } else {
      setLoading(false)
    }
  }, [rainId, connected, publicKey])

  async function fetchClaim() {
    if (!publicKey || !rainId) return
    
    // Check if user has linked Twitter
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('solana_address', publicKey.toString())
      .single()
    
    if (user) {
      setTwitterLinked(true)
      
      // Fetch claim
      const { data } = await supabase
        .from('claims')
        .select('*, rain_event:rain_events(*)')
        .eq('rain_event_id', rainId)
        .eq('receiver_twitter_id', user.twitter_id)
        .single()
      
      setClaim(data)
    }
    
    setLoading(false)
  }

  async function handleClaim() {
    if (!publicKey || !claim) return
    
    setClaiming(true)
    setError('')

    try {
      // Call API to execute claim
      const response = await fetch(`${import.meta.env.VITE_API_URL}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId: claim.id,
          receiverAddress: publicKey.toString(),
        }),
      })
      
      if (!response.ok) throw new Error('Claim failed')
      
      const result = await response.json()
      
      // Update claim status
      await supabase
        .from('claims')
        .update({ 
          status: 'claimed',
          claimed_at: new Date().toISOString(),
          tx_hash: result.txHash,
        })
        .eq('id', claim.id)
      
      // Refresh
      await fetchClaim()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setClaiming(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🌧</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Connect Wallet</h1>
        <p className="text-gray-400 mb-6">Connect your Solana wallet to claim your tokens</p>
        <button 
          onClick={() => connect()}
          className="bg-primary text-black px-6 py-3 rounded-lg font-semibold"
        >
          Connect Wallet
        </button>
      </div>
    )
  }

  if (!twitterLinked) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <Twitter className="w-16 h-16 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Verify Twitter</h1>
        <p className="text-gray-400 mb-6">
          Link your Twitter account to verify eligibility and claim tokens
        </p>
        <Link 
          to="/dashboard"
          className="bg-primary text-black px-6 py-3 rounded-lg font-semibold"
        >
          Go to Dashboard
        </Link>
      </div>
    )
  }

  if (!claim) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Claim Not Found</h1>
        <p className="text-gray-400">This rain event doesn't exist or you're not eligible.</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-surface rounded-2xl p-8 border border-gray-800 text-center">
        <h1 className="text-2xl font-bold mb-6">🌧 Rain Claim</h1>
        
        <div className="text-5xl font-bold text-primary mb-2">
          {claim.amount}
        </div>
        <div className="text-xl text-gray-400 mb-8">
          ${claim.token}
        </div>

        {claim.status === 'claimed' ? (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Already Claimed!</h2>
            <p className="text-gray-400">
              You claimed this on {new Date(claim.claimed_at).toLocaleDateString()}
            </p>
            {claim.tx_hash && (
              <a 
                href={`https://solscan.io/tx/${claim.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm mt-4 inline-block"
              >
                View Transaction →
              </a>
            )}
          </>
        ) : claim.status === 'expired' ? (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Expired</h2>
            <p className="text-gray-400">This rain has expired and been refunded to the sender.</p>
          </>
        ) : (
          <>
            <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ready to Claim!</h2>
            <p className="text-gray-400 mb-6">
              You have {claim.amount} ${claim.token} waiting. 
              Click below to claim to your wallet.
            </p>
            
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full bg-primary text-black py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {claiming ? 'Claiming...' : 'Claim Now'}
            </button>
          </>
        )}

        {error && (
          <p className="text-red-500 mt-4">{error}</p>
        )}
      </div>
    </div>
  )
}

// Missing import fix
import { Link } from 'react-router-dom'