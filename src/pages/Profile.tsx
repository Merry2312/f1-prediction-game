import { useQuery } from '@tanstack/react-query'
import { useParams, Navigate, Link } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { useAuth } from '../hooks/useAuth'
import { useSchedule } from '../hooks/useRace'
import { supabase } from '../lib/supabase'
import { CURRENT_SEASON } from '../lib/jolpica'
import type { Prediction, Score } from '../types'

function useProfileData(userId: string) {
  return useQuery({
    queryKey: ['profile', userId, CURRENT_SEASON],
    queryFn: async () => {
      const [{ data: predictions, error: pErr }, { data: scores, error: sErr }, { data: profile, error: prErr }] =
        await Promise.all([
          supabase.from('predictions').select('*').eq('user_id', userId).eq('season', CURRENT_SEASON),
          supabase.from('scores').select('*').eq('user_id', userId).eq('season', CURRENT_SEASON),
          supabase.from('profiles').select('username').eq('id', userId).single(),
        ])

      if (pErr) throw pErr
      if (sErr) throw sErr
      if (prErr) throw prErr

      return {
        predictions: predictions as Prediction[],
        scores: scores as Score[],
        username: (profile as { username: string }).username,
      }
    },
  })
}

const SCORE_FIELDS: { key: keyof Score; label: string; points: number }[] = [
  { key: 'pole_correct', label: 'Pole', points: 5 },
  { key: 'p1_correct', label: 'P1', points: 10 },
  { key: 'p2_correct', label: 'P2', points: 7 },
  { key: 'p3_correct', label: 'P3', points: 5 },
  { key: 'constructor_correct', label: 'Constructor', points: 8 },
  { key: 'finishers_correct', label: 'Finishers', points: 5 },
]

export function Profile() {
  const { userId } = useParams<{ userId: string }>()
  const { user } = useAuth()
  const { data: races } = useSchedule()
  const { data, isLoading, isError } = useProfileData(userId!)

  if (!userId) return <Navigate to="/" replace />

  const isOwnProfile = user?.id === userId
  const totalPoints = data?.scores.reduce((sum, s) => sum + (s.total_points ?? 0), 0) ?? 0
  const scoredCount = data?.scores.length ?? 0
  const bestRound = scoredCount > 0 ? Math.max(...data!.scores.map(s => s.total_points ?? 0)) : 0
  const accuracy = scoredCount === 0 ? null : SCORE_FIELDS.map(f => ({
    label: f.label,
    correct: data!.scores.filter(s => s[f.key] === true).length,
    total: scoredCount,
  }))

  const initial = data?.username?.[0].toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-f1-black">
      <NavBar />
      <main className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8">

        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-f1-red border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isError && (
          <div className="bg-f1-red/10 border border-f1-red/30 rounded-lg p-4 text-f1-text text-[14px]">
            Failed to load profile.
          </div>
        )}

        {data && (
          <>
            {/* Profile header */}
            <div className="flex items-center gap-5 mb-8">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center font-condensed font-black text-[28px] text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #E8002D, #ff6b6b)' }}
              >
                {initial}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-condensed font-black text-[36px] uppercase tracking-tight leading-none text-f1-text">
                    {data.username}
                  </h1>
                  {isOwnProfile && (
                    <span className="font-condensed font-bold text-[11px] tracking-widest uppercase text-f1-red bg-f1-red/10 border border-f1-red/25 px-2.5 py-1 rounded">
                      You
                    </span>
                  )}
                </div>
                <p className="font-condensed font-bold text-[22px] text-f1-red mt-0.5">
                  {totalPoints} pts total
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Points', value: totalPoints, sub: `${CURRENT_SEASON} season` },
                { label: 'Races Scored', value: scoredCount, sub: 'competed' },
                { label: 'Best Round', value: bestRound, sub: 'highest score', color: '#00C851' },
                { label: 'Avg / Race', value: scoredCount > 0 ? Math.round(totalPoints / scoredCount) : 0, sub: 'points average' },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="bg-f1-panel border border-f1-border rounded-lg p-5 relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 h-[2px] w-2/5 bg-f1-red" />
                  <p className="font-condensed font-bold text-[11px] tracking-widest uppercase text-f1-muted mb-2">{label}</p>
                  <p className="font-condensed font-black text-[34px] leading-none" style={color ? { color } : {}}>
                    {value}
                  </p>
                  <p className="text-[12px] text-f1-dim mt-1">{sub}</p>
                </div>
              ))}
            </div>

            {/* Accuracy grid */}
            {accuracy && (
              <div className="bg-f1-panel border border-f1-border rounded-lg p-6 mb-8">
                <h2 className="font-condensed font-bold text-[16px] tracking-widest uppercase text-f1-dim mb-4 flex items-center gap-3">
                  Accuracy by Category
                  <span className="flex-1 h-px bg-f1-border" />
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                  {accuracy.map(({ label, correct, total }) => (
                    <div key={label} className="text-center">
                      <p className="font-condensed font-black text-[22px] text-f1-text">
                        {Math.round((correct / total) * 100)}%
                      </p>
                      <p className="font-condensed font-bold text-[11px] uppercase tracking-wide text-f1-muted mt-0.5">{label}</p>
                      <p className="font-mono text-[11px] text-f1-muted mt-0.5">{correct}/{total}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Race history */}
            <h2 className="font-condensed font-bold text-[16px] tracking-widest uppercase text-f1-dim mb-4 flex items-center gap-3">
              Race History
              <span className="flex-1 h-px bg-f1-border" />
            </h2>

            {data.predictions.length === 0 && (
              <p className="text-f1-muted text-[14px]">No predictions submitted yet.</p>
            )}

            <div className="flex flex-col gap-3 pb-10">
              {data.predictions
                .sort((a, b) => a.race_round - b.race_round)
                .map(pred => {
                  const score = data.scores.find(s => s.race_round === pred.race_round)
                  const race = races?.find(r => Number(r.round) === pred.race_round)

                  return (
                    <Link
                      key={pred.race_round}
                      to={`/race/${pred.race_round}`}
                      className="bg-f1-panel border border-f1-border hover:border-f1-bright rounded-lg px-5 py-4 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-condensed font-bold text-[11px] tracking-widest uppercase text-f1-muted">
                            Round {pred.race_round}
                          </p>
                          <p className="font-condensed font-extrabold text-[18px] uppercase tracking-tight text-f1-text">
                            {race?.raceName ?? `Round ${pred.race_round}`}
                          </p>
                        </div>
                        {score ? (
                          <div className="text-right">
                            <span className="font-condensed font-black text-[24px] text-f1-red">{score.total_points}</span>
                            <span className="font-condensed text-[12px] text-f1-muted ml-1">/40 pts</span>
                          </div>
                        ) : (
                          <span className="font-condensed font-semibold text-[12px] uppercase tracking-wide text-f1-muted">
                            Not scored
                          </span>
                        )}
                      </div>

                      {score && (
                        <div className="flex gap-2 flex-wrap">
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
                              {score[f.key] === true ? '✓' : score[f.key] === false ? '✗' : '—'}
                              {' '}{f.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  )
                })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
