import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
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

      // Aggregate per user
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

export function Leaderboard() {
  const { data: rows, isLoading, isError } = useLeaderboard()

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-white text-3xl font-bold mb-1">Leaderboard</h1>
        <p className="text-gray-400 mb-8">{CURRENT_SEASON} season standings</p>

        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isError && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300">
            Failed to load leaderboard.
          </div>
        )}

        {rows && rows.length === 0 && (
          <p className="text-gray-500">No scores yet — check back after the first race is scored.</p>
        )}

        {rows && rows.length > 0 && (
          <ol className="space-y-2">
            {rows.map((row, index) => (
              <li key={row.user_id}>
                <Link
                  to={`/profile/${row.user_id}`}
                  className="flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl px-5 py-4 transition-colors"
                >
                  <span className={`text-lg font-bold w-7 shrink-0 ${
                    index === 0 ? 'text-yellow-400' :
                    index === 1 ? 'text-gray-300' :
                    index === 2 ? 'text-amber-600' :
                    'text-gray-600'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="text-white font-semibold flex-1">{row.username}</span>
                  <span className="text-gray-400 text-sm">{row.races_scored} race{row.races_scored !== 1 ? 's' : ''}</span>
                  <span className="text-white font-bold text-lg">{row.total_points} pts</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  )
}
