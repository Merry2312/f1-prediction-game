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

  // Accuracy per category (only scored races)
  const scoredCount = data?.scores.length ?? 0
  const accuracy = scoredCount === 0 ? null : SCORE_FIELDS.map(f => ({
    label: f.label,
    correct: data!.scores.filter(s => s[f.key] === true).length,
    total: scoredCount,
  }))

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isError && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300">
            Failed to load profile.
          </div>
        )}

        {data && (
          <>
            <div className="mb-8">
              <h1 className="text-white text-3xl font-bold">{data.username}</h1>
              {isOwnProfile && <p className="text-gray-500 text-sm mt-1">Your profile</p>}
              <p className="text-red-400 text-xl font-bold mt-2">{totalPoints} pts total</p>
            </div>

            {accuracy && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 mb-8">
                <h2 className="text-white font-semibold mb-3">Accuracy</h2>
                <div className="grid grid-cols-3 gap-3">
                  {accuracy.map(({ label, correct, total }) => (
                    <div key={label} className="text-center">
                      <p className="text-white font-bold text-lg">{Math.round((correct / total) * 100)}%</p>
                      <p className="text-gray-500 text-xs">{label}</p>
                      <p className="text-gray-600 text-xs">{correct}/{total}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h2 className="text-white font-semibold mb-3">Race history</h2>

            {data.predictions.length === 0 && (
              <p className="text-gray-500">No predictions submitted yet.</p>
            )}

            <div className="space-y-3">
              {data.predictions
                .sort((a, b) => a.race_round - b.race_round)
                .map(pred => {
                  const score = data.scores.find(s => s.race_round === pred.race_round)
                  const race = races?.find(r => Number(r.round) === pred.race_round)

                  return (
                    <Link
                      key={pred.race_round}
                      to={`/race/${pred.race_round}`}
                      className="block bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl px-5 py-4 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-white font-semibold">
                            {race?.raceName ?? `Round ${pred.race_round}`}
                          </p>
                          <p className="text-gray-500 text-xs">Round {pred.race_round}</p>
                        </div>
                        {score ? (
                          <span className="text-white font-bold text-lg">{score.total_points} pts</span>
                        ) : (
                          <span className="text-gray-600 text-sm">Not scored</span>
                        )}
                      </div>

                      {score && (
                        <div className="flex gap-2 flex-wrap">
                          {SCORE_FIELDS.map(f => (
                            <span
                              key={f.key}
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                score[f.key] === true
                                  ? 'bg-green-900/50 text-green-400'
                                  : score[f.key] === false
                                  ? 'bg-red-900/50 text-red-400'
                                  : 'bg-gray-800 text-gray-500'
                              }`}
                            >
                              {f.label} {score[f.key] === true ? `+${f.points}` : score[f.key] === false ? '✗' : '—'}
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
