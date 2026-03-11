import { useEffect, useState } from 'react'
import { Trophy, Medal, Award } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface LeaderboardEntry {
  twitter_handle: string
  total_claimed: number
  rain_count: number
}

export default function Leaderboard() {
  const [topClaimers, setTopClaimers] = useState<LeaderboardEntry[]>([])
  const [topSenders, setTopSenders] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  async function fetchLeaderboard() {
    // Top claimers
    const { data: claimers } = await supabase
      .from('claims')
      .select('receiver_twitter_id, amount')
      .eq('status', 'claimed')
    
    if (claimers) {
      const aggregated = claimers.reduce((acc: any, curr) => {
        if (!acc[curr.receiver_twitter_id]) {
          acc[curr.receiver_twitter_id] = { total: 0, count: 0 }
        }
        acc[curr.receiver_twitter_id].total += curr.amount
        acc[curr.receiver_twitter_id].count += 1
        return acc
      }, {})
      
      setTopClaimers(
        Object.entries(aggregated)
          .map(([handle, data]: [string, any]) => ({
            twitter_handle: handle,
            total_claimed: data.total,
            rain_count: data.count,
          }))
          .sort((a, b) => b.total_claimed - a.total_claimed)
          .slice(0, 10)
      )
    }

    // Top senders
    const { data: senders } = await supabase
      .from('rain_events')
      .select('sender_twitter_id, total_amount')
    
    if (senders) {
      const aggregated = senders.reduce((acc: any, curr) => {
        if (!acc[curr.sender_twitter_id]) {
          acc[curr.sender_twitter_id] = { total: 0, count: 0 }
        }
        acc[curr.sender_twitter_id].total += curr.total_amount
        acc[curr.sender_twitter_id].count += 1
        return acc
      }, {})
      
      setTopSenders(
        Object.entries(aggregated)
          .map(([handle, data]: [string, any]) => ({
            twitter_handle: handle,
            total_claimed: data.total,
            rain_count: data.count,
          }))
          .sort((a, b) => b.total_claimed - a.total_claimed)
          .slice(0, 10)
      )
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Leaderboard</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Top Claimers */}
        <div className="bg-surface rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold">Top Claimers</h2>
          </div>
          
          <div className="space-y-3">
            {topClaimers.map((entry, index) => (
              <div key={entry.twitter_handle} className="flex items-center gap-4 p-3 bg-background rounded-lg">
                <div className="w-8 h-8 flex items-center justify-center font-bold">
                  {index === 0 ? <Medal className="w-6 h-6 text-yellow-500" /> :
                   index === 1 ? <Medal className="w-6 h-6 text-gray-400" /> :
                   index === 2 ? <Medal className="w-6 h-6 text-amber-600" /> :
                   index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium">@{entry.twitter_handle}</div>
                  <div className="text-sm text-gray-400">{entry.rain_count} rains claimed</div>
                </div>
                <div className="text-primary font-semibold">
                  {entry.total_claimed.toFixed(2)}
                </div>
              </div>
            ))}
            {topClaimers.length === 0 && (
              <p className="text-gray-400 text-center py-8">No claims yet. Be the first!</p>
            )}
          </div>
        </div>

        {/* Top Senders */}
        <div className="bg-surface rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">Top Rain Makers</h2>
          </div>
          
          <div className="space-y-3">
            {topSenders.map((entry, index) => (
              <div key={entry.twitter_handle} className="flex items-center gap-4 p-3 bg-background rounded-lg">
                <div className="w-8 h-8 flex items-center justify-center font-bold">
                  {index === 0 ? <Medal className="w-6 h-6 text-yellow-500" /> :
                   index === 1 ? <Medal className="w-6 h-6 text-gray-400" /> :
                   index === 2 ? <Medal className="w-6 h-6 text-amber-600" /> :
                   index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium">@{entry.twitter_handle}</div>
                  <div className="text-sm text-gray-400">{entry.rain_count} rains sent</div>
                </div>
                <div className="text-secondary font-semibold">
                  {entry.total_claimed.toFixed(2)}
                </div>
              </div>
            ))}
            {topSenders.length === 0 && (
              <p className="text-gray-400 text-center py-8">No rains sent yet. Start raining!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}