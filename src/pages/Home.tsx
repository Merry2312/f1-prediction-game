import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { NavBar } from '../components/NavBar'
import { useSchedule } from '../hooks/useRace'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { CURRENT_SEASON } from '../lib/jolpica'
import type { Score } from '../types'

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

function useUserScores(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-scores', userId, CURRENT_SEASON],
    enabled: !!userId,
    queryFn: async (): Promise<Score[]> => {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', userId!)
        .eq('season', CURRENT_SEASON)
        .order('race_round', { ascending: false })
      if (error) throw error
      return data as Score[]
    },
  })
}

function useCountdown(target: Date | undefined) {
  const [diff, setDiff] = useState<number>(() => (target ? target.getTime() - Date.now() : 0))

  useEffect(() => {
    if (!target) return
    setDiff(target.getTime() - Date.now())
    const id = setInterval(() => setDiff(target.getTime() - Date.now()), 1000)
    return () => clearInterval(id)
  }, [target?.getTime()])

  if (!target || diff <= 0) return null
  return {
    days: String(Math.floor(diff / 86400000)).padStart(2, '0'),
    hours: String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0'),
    minutes: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
  }
}

const SCORE_FIELDS = [
  { key: 'pole_correct' as const, label: 'Pole' },
  { key: 'p1_correct' as const, label: 'P1' },
  { key: 'p2_correct' as const, label: 'P2' },
  { key: 'p3_correct' as const, label: 'P3' },
  { key: 'constructor_correct' as const, label: 'Constructor' },
  { key: 'finishers_correct' as const, label: 'Finishers' },
]

const RANK_COLORS = ['text-f1-gold', 'text-f1-silver', 'text-f1-bronze']
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #FFD700, #ff8c00)',
  'linear-gradient(135deg, #E8002D, #ff6b6b)',
  'linear-gradient(135deg, #CD7F32, #a0522d)',
  'linear-gradient(135deg, #444, #888)',
  'linear-gradient(135deg, #1e3a5f, #3b6fa0)',
  'linear-gradient(135deg, #2d5a27, #4caf50)',
]

export function Home() {
  const { user } = useAuth()
  const { data: races, isLoading: scheduleLoading, isError: scheduleError } = useSchedule()
  const { data: leaderboard } = useLeaderboard()
  const { data: userScores } = useUserScores(user?.id)

  const nextRace = races?.find(race => {
    const t = race.time ? new Date(`${race.date}T${race.time}`) : new Date(`${race.date}T00:00:00Z`)
    return Date.now() < t.getTime()
  })

  // Countdown to qualifying (lock time) of next race
  const lockTarget = nextRace?.Qualifying?.date
    ? nextRace.Qualifying.time
      ? new Date(`${nextRace.Qualifying.date}T${nextRace.Qualifying.time}`)
      : new Date(`${nextRace.Qualifying.date}T00:00:00Z`)
    : nextRace
    ? (nextRace.time ? new Date(`${nextRace.date}T${nextRace.time}`) : new Date(`${nextRace.date}T00:00:00Z`))
    : undefined

  const countdown = useCountdown(lockTarget)

  // User stats
  const totalPoints = userScores?.reduce((s, r) => s + (r.total_points ?? 0), 0) ?? 0
  const racesScored = userScores?.length ?? 0
  const bestRound = racesScored > 0 ? Math.max(...userScores!.map(s => s.total_points ?? 0)) : 0
  const bestRaceName = races?.find(r => {
    const best = userScores?.find(s => s.total_points === bestRound)
    return best && Number(r.round) === best.race_round
  })?.raceName?.replace(' Grand Prix', ' GP').replace('Grand Prix', 'GP') ?? '—'

  const myRank = leaderboard ? leaderboard.findIndex(r => r.user_id === user?.id) + 1 : 0
  const accuracy = racesScored > 0 ? Math.round(totalPoints / (racesScored * 40) * 100) : 0

  // Recent predictions (last 2 scored rounds)
  const recentScored = userScores?.slice(0, 2) ?? []

  return (
    <div className="min-h-screen bg-f1-black">
      <NavBar />
      <main className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-8 pb-12">

        {/* Next race hero */}
        {scheduleLoading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-f1-red border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {scheduleError && (
          <div className="bg-f1-red/10 border border-f1-red/30 rounded-lg p-4 text-f1-text text-[14px] mb-6">
            Failed to load schedule. The Jolpica API may be unavailable.
          </div>
        )}

        {nextRace && (
          <div className="bg-f1-panel border border-f1-border rounded-lg p-10 mb-6 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            {/* Red left accent bar */}
            <div className="absolute left-0 top-0 w-1 h-full bg-f1-red" />

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-f1-red f1-pulse-dot inline-block" />
                <span className="font-condensed font-bold text-[11px] tracking-widest uppercase text-f1-red">
                  Next Race — Round {nextRace.round}
                </span>
              </div>
              <h2 className="font-condensed font-black text-[34px] sm:text-[36px] uppercase tracking-tight leading-none text-f1-text">
                {nextRace.raceName}
              </h2>
              <p className="font-condensed font-semibold text-[14px] uppercase tracking-wide text-f1-dim mt-2">
                📍 {nextRace.Circuit.circuitName} · {nextRace.Circuit.Location.locality} ·{' '}
                {new Date(`${nextRace.date}T00:00:00Z`).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
                })}
              </p>
              <div className="flex items-center gap-3 mt-5">
                <Link
                  to={`/race/${nextRace.round}`}
                  className="bg-f1-red hover:brightness-110 text-white font-condensed font-bold text-[13px] tracking-widest uppercase px-6 py-2.5 rounded-[5px] transition-all inline-flex items-center gap-2"
                >
                  ✏ Make Prediction
                </Link>
                <Link
                  to="/schedule"
                  className="border border-f1-bright text-f1-dim hover:text-f1-text hover:border-f1-dim font-condensed font-bold text-[13px] tracking-widest uppercase px-6 py-2.5 rounded-[5px] transition-all inline-flex items-center gap-2"
                >
                  View Schedule
                </Link>
              </div>
            </div>

            {/* Countdown */}
            {countdown && (
              <div className="shrink-0">
                <p className="font-condensed text-[11px] tracking-widest uppercase text-f1-muted mb-3 text-center">
                  Locks in
                </p>
                <div className="flex gap-4 text-center">
                  {[
                    { val: countdown.days, label: 'Days' },
                    { val: countdown.hours, label: 'Hrs' },
                    { val: countdown.minutes, label: 'Min' },
                  ].map(({ val, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1">
                      <div className="font-condensed font-black text-[40px] leading-none text-f1-text bg-f1-black border border-f1-bright px-4 py-2 rounded-lg min-w-[68px] text-center">
                        {val}
                      </div>
                      <span className="font-condensed text-[10px] tracking-widest uppercase text-f1-muted">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!scheduleLoading && !scheduleError && !nextRace && (
          <div className="bg-f1-panel border border-f1-border rounded-lg p-8 mb-6 text-center">
            <p className="font-condensed font-bold text-[20px] uppercase text-f1-dim">Season Complete</p>
            <p className="text-f1-muted text-[14px] mt-1">No upcoming races this season.</p>
          </div>
        )}

        {/* Stats row */}
        {user && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'My Points', value: totalPoints, sub: 'Season total' },
              { label: 'Rank', value: myRank > 0 ? `#${myRank}` : '—', sub: `of ${leaderboard?.length ?? 0} players`, color: myRank === 1 ? '#FFD700' : undefined },
              { label: 'Accuracy', value: `${accuracy}%`, sub: 'Avg per race' },
              { label: 'Best Round', value: bestRound || '—', sub: bestRound ? bestRaceName : 'No scores yet', color: bestRound ? '#00C851' : undefined },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="bg-f1-panel border border-f1-border rounded-lg p-5 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 h-[2px] w-2/5 bg-f1-red" />
                <p className="font-condensed font-bold text-[11px] tracking-widest uppercase text-f1-muted mb-2">{label}</p>
                <p className="font-condensed font-black text-[34px] leading-none" style={color ? { color } : {}}>
                  {value}
                </p>
                <p className="text-[12px] text-f1-dim mt-1 truncate">{sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Two-column content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* Recent predictions */}
          <div>
            <h3 className="font-condensed font-extrabold text-[16px] tracking-widest uppercase text-f1-dim mb-4 flex items-center gap-3">
              Recent Predictions
              <span className="flex-1 h-px bg-f1-border" />
            </h3>

            {recentScored.length === 0 && !scheduleLoading && (
              <div className="bg-f1-panel border border-f1-border rounded-lg p-6 text-center">
                <p className="text-f1-muted text-[14px]">
                  {user ? 'No scored races yet — come back after the first race.' : 'Sign in to track your predictions.'}
                </p>
              </div>
            )}

            {recentScored.map(score => {
              const race = races?.find(r => Number(r.round) === score.race_round)
              return (
                <Link
                  key={score.race_round}
                  to={`/race/${score.race_round}`}
                  className="bg-f1-panel border border-f1-border hover:border-f1-bright rounded-lg overflow-hidden mb-3 block transition-colors"
                >
                  <div className="flex items-center px-5 py-3.5 border-b border-f1-border gap-3">
                    <div className="flex-1">
                      <p className="font-condensed font-bold text-[11px] tracking-widest uppercase text-f1-muted">
                        Round {score.race_round}
                      </p>
                      <p className="font-condensed font-extrabold text-[18px] uppercase tracking-tight text-f1-text">
                        {race?.raceName ?? `Round ${score.race_round}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-condensed font-black text-[22px] text-f1-red">{score.total_points}</span>
                      <span className="font-condensed text-[12px] text-f1-muted">/40 pts</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap px-5 py-3">
                    {SCORE_FIELDS.map(f => (
                      <span
                        key={f.key}
                        className={`font-condensed font-bold text-[11px] tracking-wide uppercase px-2.5 py-1 rounded flex items-center gap-1 border ${
                          score[f.key] === true
                            ? 'bg-f1-green/12 text-f1-green border-f1-green/25'
                            : score[f.key] === false
                            ? 'bg-f1-red/10 text-[#ff4d6d] border-f1-red/20'
                            : 'bg-f1-black text-f1-muted border-f1-border'
                        }`}
                      >
                        {score[f.key] === true ? '✓' : '✗'} {f.label}
                      </span>
                    ))}
                  </div>
                </Link>
              )
            })}

            {user && recentScored.length > 0 && (
              <Link
                to={`/profile/${user.id}`}
                className="text-f1-dim hover:text-f1-text font-condensed font-semibold text-[12px] tracking-widest uppercase transition-colors"
              >
                View all predictions →
              </Link>
            )}
          </div>

          {/* Mini leaderboard */}
          <div>
            <h3 className="font-condensed font-extrabold text-[16px] tracking-widest uppercase text-f1-dim mb-4 flex items-center gap-3">
              Leaderboard
              <span className="flex-1 h-px bg-f1-border" />
            </h3>

            <div className="bg-f1-panel border border-f1-border rounded-lg overflow-hidden">
              <div className="px-5 py-3.5 border-b border-f1-border">
                <span className="font-condensed font-bold text-[13px] tracking-widest uppercase text-f1-dim">
                  Season Standings
                </span>
              </div>

              {!leaderboard && (
                <div className="px-5 py-6 text-center">
                  <div className="w-5 h-5 border-2 border-f1-red border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              )}

              {leaderboard?.length === 0 && (
                <div className="px-5 py-4">
                  <p className="text-f1-muted text-[13px]">No scores yet.</p>
                </div>
              )}

              {leaderboard?.map((row, index) => {
                const isMe = user?.id === row.user_id
                return (
                  <Link
                    key={row.user_id}
                    to={`/profile/${row.user_id}`}
                    className={`flex items-center gap-3.5 px-5 py-3 border-b border-f1-border last:border-b-0 hover:bg-white/3 transition-colors ${
                      isMe ? 'bg-f1-red/5 border-l-[3px] border-l-f1-red' : ''
                    }`}
                  >
                    <span className={`font-condensed font-black text-[18px] w-6 text-center ${RANK_COLORS[index] ?? 'text-f1-muted'}`}>
                      {index + 1}
                    </span>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center font-condensed font-extrabold text-[12px] text-white shrink-0"
                      style={{ background: AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length] }}
                    >
                      {row.username[0].toUpperCase()}
                    </div>
                    <span className="flex-1 font-sans font-medium text-[14px] text-f1-text">
                      {row.username}
                      {isMe && (
                        <span className="ml-2 font-condensed font-bold text-[10px] tracking-widest uppercase text-f1-red">← you</span>
                      )}
                    </span>
                    <div>
                      <span className="font-condensed font-bold text-[16px] text-f1-red">{row.total_points}</span>
                      <span className="font-condensed text-[10px] tracking-wide uppercase text-f1-muted ml-1">pts</span>
                    </div>
                  </Link>
                )
              })}
            </div>

            <Link
              to="/leaderboard"
              className="mt-2.5 w-full flex justify-center items-center border border-f1-bright hover:border-f1-dim text-f1-dim hover:text-f1-text font-condensed font-bold text-[12px] tracking-widest uppercase py-2.5 rounded-[5px] transition-all"
            >
              Full Leaderboard →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
