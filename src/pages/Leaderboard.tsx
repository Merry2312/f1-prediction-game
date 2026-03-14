import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { CURRENT_SEASON } from '../lib/jolpica'

interface LeaderboardRow {
  user_id: string
  username: string
  total_points: number
  races_scored: number
}

function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard', CURRENT_SEASON],
    queryFn: async (): Promise<LeaderboardRow[]> => {
      const { data, error } = await supabase
        .from('scores')
        .select('user_id, total_points, profiles(username)')
        .eq('season', CURRENT_SEASON)

      if (error) throw error

      const map = new Map<string, LeaderboardRow>()
      for (const row of data as Array<{ user_id: string; total_points: number; profiles: { username: string }[] | { username: string } | null }>) {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
        const existing = map.get(row.user_id)
        if (existing) {
          existing.total_points += row.total_points ?? 0
          existing.races_scored += 1
        } else {
          map.set(row.user_id, {
            user_id: row.user_id,
            username: profile?.username ?? 'Unknown',
            total_points: row.total_points ?? 0,
            races_scored: 1,
          })
        }
      }

      return Array.from(map.values()).sort((a, b) => b.total_points - a.total_points)
    },
  })
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #FFD700, #ff8c00)',
  'linear-gradient(135deg, #E8002D, #ff6b6b)',
  'linear-gradient(135deg, #CD7F32, #a0522d)',
  'linear-gradient(135deg, #444, #888)',
  'linear-gradient(135deg, #1e3a5f, #3b6fa0)',
  'linear-gradient(135deg, #2d5a27, #4caf50)',
]

export function Leaderboard() {
  const { data: rows, isLoading, isError } = useLeaderboard()
  const { user } = useAuth()

  const totalRaces = rows && rows.length > 0 ? Math.max(...rows.map(r => r.races_scored)) : 0

  return (
    <div className="min-h-screen bg-f1-black">
      <NavBar />
      <main className="max-w-[1200px] mx-auto px-4 sm:px-8">
        {/* Page header */}
        <div className="pt-10 pb-8 border-b border-f1-border mb-8">
          <h1 className="font-condensed font-black text-[40px] uppercase tracking-tight leading-none text-f1-text">
            Leaderboard
          </h1>
          <p className="text-f1-dim text-[14px] mt-1.5">
            {CURRENT_SEASON} Season · {totalRaces} race{totalRaces !== 1 ? 's' : ''} scored
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-f1-red border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isError && (
          <div className="bg-f1-red/10 border border-f1-red/30 rounded-lg p-4 text-f1-text text-[14px]">
            Failed to load leaderboard.
          </div>
        )}

        {rows && rows.length === 0 && (
          <p className="text-f1-muted text-[14px]">No scores yet — check back after the first race is scored.</p>
        )}

        {rows && rows.length > 0 && (
          <div className="bg-f1-panel border border-f1-border rounded-lg overflow-hidden mb-10">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[56px_1fr_90px_90px_90px_90px] px-6 py-3 border-b border-f1-border bg-f1-black">
              <span className="font-condensed font-bold text-[11px] tracking-widest uppercase text-f1-muted">#</span>
              <span className="font-condensed font-bold text-[11px] tracking-widest uppercase text-f1-muted">Player</span>
              <span className="font-condensed font-bold text-[11px] tracking-widest uppercase text-f1-muted text-right">Races</span>
              <span className="font-condensed font-bold text-[11px] tracking-widest uppercase text-f1-muted text-right">Avg/Race</span>
              <span className="font-condensed font-bold text-[11px] tracking-widest uppercase text-f1-muted text-right">Best</span>
              <span className="font-condensed font-bold text-[11px] tracking-widest uppercase text-f1-muted text-right">Points</span>
            </div>

            {rows.map((row, index) => {
              const isMe = user?.id === row.user_id
              const avgPerRace = row.races_scored > 0 ? Math.round(row.total_points / row.races_scored) : 0
              const rankColor =
                index === 0 ? 'text-f1-gold' :
                index === 1 ? 'text-f1-silver' :
                index === 2 ? 'text-f1-bronze' : 'text-f1-muted'

              return (
                <Link
                  key={row.user_id}
                  to={`/profile/${row.user_id}`}
                  className={`flex sm:grid sm:grid-cols-[56px_1fr_90px_90px_90px_90px] items-center px-6 py-3.5 border-b border-f1-border last:border-b-0 transition-colors hover:bg-white/2 ${
                    isMe ? 'bg-f1-red/5 border-l-[3px] border-l-f1-red' : ''
                  }`}
                >
                  <span className={`font-condensed font-black text-[24px] w-14 sm:w-auto shrink-0 ${rankColor}`}>
                    {index + 1}
                  </span>

                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-condensed font-extrabold text-[14px] text-white shrink-0"
                      style={{ background: AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length] }}
                    >
                      {row.username[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-sans font-medium text-[15px] text-f1-text">{row.username}</span>
                        {isMe && (
                          <span className="font-condensed font-bold text-[11px] tracking-widest uppercase text-f1-red">you</span>
                        )}
                      </div>
                      <p className="text-[11px] text-f1-muted">{row.races_scored}/{totalRaces} predicted</p>
                    </div>
                  </div>

                  <span className="font-mono text-[14px] font-semibold text-f1-dim text-right hidden sm:block">
                    {row.races_scored}
                  </span>
                  <span className="font-mono text-[14px] font-semibold text-f1-dim text-right hidden sm:block">
                    {avgPerRace}
                  </span>
                  <span className="font-mono text-[14px] font-semibold text-f1-dim text-right hidden sm:block">
                    —
                  </span>
                  <span className="font-condensed font-black text-[22px] text-f1-text ml-auto sm:ml-0 text-right">
                    {row.total_points}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
