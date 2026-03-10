import { useState, useEffect, type FormEvent } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { DriverSelect } from '../components/DriverSelect'
import { ConstructorSelect } from '../components/ConstructorSelect'
import { useSchedule } from '../hooks/useRace'
import { usePrediction, useUpsertPrediction } from '../hooks/usePrediction'
import { useAuth } from '../hooks/useAuth'
import { CURRENT_SEASON } from '../lib/jolpica'

function isRaceLocked(date: string, time?: string): boolean {
  const raceTime = time
    ? new Date(`${date}T${time}`)
    : new Date(`${date}T00:00:00Z`)
  return Date.now() >= raceTime.getTime()
}

function formatRaceDate(date: string, time?: string): string {
  const d = time ? new Date(`${date}T${time}`) : new Date(`${date}T00:00:00Z`)
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

export function Race() {
  const { round } = useParams<{ round: string }>()
  const roundNum = Number(round)
  const { user } = useAuth()

  const { data: races, isLoading: scheduleLoading } = useSchedule()
  const race = races?.find(r => r.round === round)
  const locked = race ? isRaceLocked(race.date, race.time) : false

  const { data: existing, isLoading: predictionLoading } = usePrediction(user?.id, roundNum)
  const { mutate: upsert, isPending, isSuccess, error: saveError } = useUpsertPrediction()

  const [pole, setPole] = useState('')
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [p3, setP3] = useState('')
  const [constructor, setConstructor] = useState('')
  const [finishers, setFinishers] = useState<number | ''>('')

  // Pre-fill form when existing prediction loads
  useEffect(() => {
    if (existing) {
      setPole(existing.pole_driver_id)
      setP1(existing.p1_driver_id)
      setP2(existing.p2_driver_id)
      setP3(existing.p3_driver_id)
      setConstructor(existing.top_constructor_id)
      setFinishers(existing.finishers_count)
    }
  }, [existing])

  if (!round || isNaN(roundNum)) return <Navigate to="/schedule" replace />

  const isLoading = scheduleLoading || predictionLoading

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!user || !pole || !p1 || !p2 || !p3 || !constructor || finishers === '') return

    upsert({
      user_id: user.id,
      race_round: roundNum,
      pole_driver_id: pole,
      p1_driver_id: p1,
      p2_driver_id: p2,
      p3_driver_id: p3,
      top_constructor_id: constructor,
      finishers_count: Number(finishers),
    })
  }

  const formDisabled = locked || isPending

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && !race && (
          <p className="text-gray-400">Race not found.</p>
        )}

        {!isLoading && race && (
          <>
            <div className="mb-8">
              <p className="text-gray-500 text-sm uppercase tracking-wide mb-1">
                Round {race.round} · {CURRENT_SEASON}
              </p>
              <h1 className="text-white text-3xl font-bold mb-1">{race.raceName}</h1>
              <p className="text-gray-400">
                {race.Circuit.circuitName} · {race.Circuit.Location.locality}, {race.Circuit.Location.country}
              </p>
              <p className="text-gray-500 text-sm mt-1">{formatRaceDate(race.date, race.time)}</p>
            </div>

            {locked ? (
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg px-4 py-3 text-yellow-400 text-sm mb-6">
                Predictions are locked — this race has started.
              </div>
            ) : (
              <div className="bg-green-900/20 border border-green-700 rounded-lg px-4 py-3 text-green-400 text-sm mb-6">
                Predictions open — locks at race start.
              </div>
            )}

            {locked && existing ? (
              // Read-only view of submitted prediction
              <div className="bg-gray-900 rounded-xl p-6 space-y-3">
                <h2 className="text-white font-semibold mb-4">Your prediction</h2>
                {[
                  { label: 'Pole position', value: existing.pole_driver_id },
                  { label: 'P1 winner', value: existing.p1_driver_id },
                  { label: 'P2', value: existing.p2_driver_id },
                  { label: 'P3', value: existing.p3_driver_id },
                  { label: 'Top constructor', value: existing.top_constructor_id },
                  { label: 'Finishers', value: String(existing.finishers_count) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-white font-medium">{value}</span>
                  </div>
                ))}
              </div>
            ) : locked && !existing ? (
              <p className="text-gray-500">You didn't submit a prediction for this race.</p>
            ) : (
              // Editable prediction form
              <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-6 space-y-4">
                <h2 className="text-white font-semibold mb-2">
                  {existing ? 'Update your prediction' : 'Submit your prediction'}
                </h2>

                <DriverSelect
                  id="pole"
                  label="Pole position"
                  value={pole}
                  onChange={setPole}
                  disabled={formDisabled}
                />
                <DriverSelect
                  id="p1"
                  label="P1 winner"
                  value={p1}
                  onChange={setP1}
                  disabled={formDisabled}
                  exclude={[p2, p3].filter(Boolean)}
                />
                <DriverSelect
                  id="p2"
                  label="P2"
                  value={p2}
                  onChange={setP2}
                  disabled={formDisabled}
                  exclude={[p1, p3].filter(Boolean)}
                />
                <DriverSelect
                  id="p3"
                  label="P3"
                  value={p3}
                  onChange={setP3}
                  disabled={formDisabled}
                  exclude={[p1, p2].filter(Boolean)}
                />
                <ConstructorSelect
                  id="constructor"
                  label="Top constructor"
                  value={constructor}
                  onChange={setConstructor}
                  disabled={formDisabled}
                />

                <div>
                  <label htmlFor="finishers" className="block text-gray-300 text-sm mb-1">
                    Number of finishers (0–22)
                  </label>
                  <input
                    id="finishers"
                    type="number"
                    min={0}
                    max={22}
                    value={finishers}
                    onChange={e => setFinishers(e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={formDisabled}
                    required
                    className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-red-500 disabled:opacity-50"
                  />
                </div>

                {saveError && (
                  <p className="text-red-400 text-sm">{(saveError as Error).message}</p>
                )}
                {isSuccess && (
                  <p className="text-green-400 text-sm">Prediction saved!</p>
                )}

                <button
                  type="submit"
                  disabled={formDisabled || !pole || !p1 || !p2 || !p3 || !constructor || finishers === ''}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  {isPending ? 'Saving…' : existing ? 'Update prediction' : 'Submit prediction'}
                </button>
              </form>
            )}
          </>
        )}
      </main>
    </div>
  )
}
