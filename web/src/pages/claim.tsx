import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { Clock, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Claim() {
  const { rainId } = useParams()
  const navigate = useNavigate()
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()
  
  const [claim, setClaim] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (rainId) {
      fetchClaim()
    } else {
      setLoading(false)
    }
  }, [rainId, publicKey])

  async function fetchClaim() {
    if (!publicKey) return
    
    const wallet = publicKey.toString()
    
    // Fetch claim by rain event ID
    const { data } = await supabase
      .from('claims')
      .select('*, rain_event:rain_events(*)')
      .eq('rain_event_id', rainId)
      .single()
    
    setClaim(data)
    setLoading(false)
  }

  async function handleClaim() {
    if (!publicKey || !claim) return
    
    setClaiming(true)
    setError('')

    try {
      // In production, this would call the bot's API to execute the transfer
      // For now, we'll just mark it as claimed in the database
      
      const { error } = await supabase
        .from('claims')
        .update({ 
          status: 'claimed',
          claimed_at: new Date().toISOString()
        })
        .eq('id', claim.id)
      
      if (error) throw error
      
      // Refresh claim data
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

  if (!rainId) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <CloudRain className="w-16 h-16 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Enter Claim Code</h1>
        <p className="text-gray-400 mb-6">Enter the rain event ID from your DM</p>
        <input
          type="text"
          placeholder="Rain Event ID"
          className="w-full bg-surface border border-gray-700 rounded-lg px-4 py-3 mb-4"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              navigate(`/claim/${(e.target as HTMLInputElement).value}`)
            }
          }}
        />
      </div>
    )
  }

  if (!claim) {
    return (
      <div className="text-center py-16">
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
              Connect your wallet and claim your tokens. Gas fees covered by sender.
            </p>
            
            {!publicKey ? (
              <p className="text-yellow-500">Connect your wallet to claim</p>
            ) : (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="w-full bg-primary text-black py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {claiming ? 'Claiming...' : 'Claim Now'}
              </button>
            )}
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
import { CloudRain } from 'lucide-react'