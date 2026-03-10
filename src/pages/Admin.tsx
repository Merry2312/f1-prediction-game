import { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { useAuth } from '../hooks/useAuth'
import { useSchedule } from '../hooks/useRace'
import { fetchRaceResults, fetchQualifyingResults, fetchConstructorStandings, CURRENT_SEASON } from '../lib/jolpica'
import { supabase } from '../lib/supabase'
import type { Prediction } from '../types'

const SCORING = {
  pole: 5,
  p1: 10,
  p2: 7,
  p3: 5,
  constructor: 8,
  finishers: 5,
}

export function Admin() {
  const { round } = useParams<{ round: string }>()
  const roundNum = Number(round)
  const { user, loading } = useAuth()
  const { data: races } = useSchedule()

  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [log, setLog] = useState<string[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  const adminUserId = import.meta.env.VITE_ADMIN_USER_ID as string | undefined

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Block non-admins
  if (!user || !adminUserId || user.id !== adminUserId) {
    return <Navigate to="/" replace />
  }

  if (!round || isNaN(roundNum)) return <Navigate to="/schedule" replace />

  const race = races?.find(r => r.round === round)

  const addLog = (msg: string) => setLog(prev => [...prev, msg])

  const handleScore = async () => {
    setStatus('loading')
    setLog([])
    setErrorMsg('')

    try {
      addLog('Fetching race results from Jolpica…')
      const [raceResults, qualifyingResults, constructorStandings] = await Promise.all([
        fetchRaceResults(roundNum),
        fetchQualifyingResults(roundNum),
        fetchConstructorStandings(roundNum),
      ])

      if (!raceResults.length) throw new Error('No race results found — has this race happened yet?')

      const poleDriverId = qualifyingResults[0]?.Driver.driverId ?? null
      const p1DriverId = raceResults.find(r => r.position === '1')?.Driver.driverId ?? null
      const p2DriverId = raceResults.find(r => r.position === '2')?.Driver.driverId ?? null
      const p3DriverId = raceResults.find(r => r.position === '3')?.Driver.driverId ?? null
      const topConstructorId = constructorStandings[0]?.Constructor.constructorId ?? null
      const actualFinishers = raceResults.filter(r => r.position !== null).length

      addLog(`Pole: ${poleDriverId}`)
      addLog(`P1: ${p1DriverId} | P2: ${p2DriverId} | P3: ${p3DriverId}`)
      addLog(`Top constructor: ${topConstructorId}`)
      addLog(`Finishers: ${actualFinishers}`)
      addLog('Fetching all predictions for this round…')

      const { data: predictions, error: predictionsError } = await supabase
        .from('predictions')
        .select('*')
        .eq('race_round', roundNum)
        .eq('season', CURRENT_SEASON)

      if (predictionsError) throw predictionsError
      if (!predictions?.length) {
        addLog('No predictions found for this round.')
        setStatus('done')
        return
      }

      addLog(`Found ${predictions.length} prediction(s). Calculating scores…`)

      const scoreRows = (predictions as Prediction[]).map(p => {
        const poleCorrect = !!poleDriverId && p.pole_driver_id === poleDriverId
        const p1Correct = !!p1DriverId && p.p1_driver_id === p1DriverId
        const p2Correct = !!p2DriverId && p.p2_driver_id === p2DriverId
        const p3Correct = !!p3DriverId && p.p3_driver_id === p3DriverId
        const constructorCorrect = !!topConstructorId && p.top_constructor_id === topConstructorId
        const finishersCorrect = p.finishers_count === actualFinishers

        const totalPoints =
          (poleCorrect ? SCORING.pole : 0) +
          (p1Correct ? SCORING.p1 : 0) +
          (p2Correct ? SCORING.p2 : 0) +
          (p3Correct ? SCORING.p3 : 0) +
          (constructorCorrect ? SCORING.constructor : 0) +
          (finishersCorrect ? SCORING.finishers : 0)

        return {
          user_id: p.user_id,
          race_round: roundNum,
          season: CURRENT_SEASON,
          pole_correct: poleCorrect,
          p1_correct: p1Correct,
          p2_correct: p2Correct,
          p3_correct: p3Correct,
          constructor_correct: constructorCorrect,
          finishers_correct: finishersCorrect,
          total_points: totalPoints,
        }
      })

      addLog('Writing scores to Supabase…')

      const { error: upsertError } = await supabase
        .from('scores')
        .upsert(scoreRows, { onConflict: 'user_id,race_round,season' })

      if (upsertError) throw upsertError

      scoreRows.forEach(s => {
        addLog(`✓ user ${s.user_id.slice(0, 8)}… → ${s.total_points} pts`)
      })

      addLog(`Done! ${scoreRows.length} score(s) saved.`)
      setStatus('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />
      <main className="max-w-xl mx-auto px-6 py-10">
        <p className="text-red-500 text-xs uppercase tracking-widest font-semibold mb-1">Admin</p>
        <h1 className="text-white text-3xl font-bold mb-1">Score Round {round}</h1>
        {race && (
          <p className="text-gray-400 mb-8">{race.raceName}</p>
        )}

        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg px-4 py-3 text-yellow-300 text-sm mb-6">
          This will fetch official results from Jolpica and write scores for all users who submitted predictions for this round. It is safe to run more than once — scores are upserted.
        </div>

        <button
          onClick={handleScore}
          disabled={status === 'loading'}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg transition-colors mb-6"
        >
          {status === 'loading' ? 'Scoring…' : 'Calculate & save scores'}
        </button>

        {log.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm space-y-1">
            {log.map((line, i) => (
              <p key={i} className="text-gray-300">{line}</p>
            ))}
          </div>
        )}

        {status === 'error' && (
          <p className="text-red-400 text-sm mt-4">{errorMsg}</p>
        )}
      </main>
    </div>
  )
}
