import { useState, useEffect, type FormEvent } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { DriverSelect } from '../components/DriverSelect'
import { ConstructorSelect } from '../components/ConstructorSelect'
import { useSchedule } from '../hooks/useRace'
import { usePrediction, useUpsertPrediction } from '../hooks/usePrediction'
import { useAuth } from '../hooks/useAuth'
import { CURRENT_SEASON } from '../lib/jolpica'
import type { JolpicaRace, JolpicaSession } from '../types'

function isRaceLocked(qualifying?: JolpicaSession, raceDate?: string): boolean {
  if (qualifying?.date) {
    const qualTime = qualifying.time
      ? new Date(`${qualifying.date}T${qualifying.time}`)
      : new Date(`${qualifying.date}T00:00:00Z`)
    return Date.now() >= qualTime.getTime()
  }
  if (raceDate) return Date.now() >= new Date(`${raceDate}T00:00:00Z`).getTime()
  return false
}

function useLockCountdown(qualifying?: JolpicaSession, raceDate?: string) {
  const getTarget = () => {
    if (qualifying?.date) {
      return qualifying.time
        ? new Date(`${qualifying.date}T${qualifying.time}`)
        : new Date(`${qualifying.date}T00:00:00Z`)
    }
    if (raceDate) return new Date(`${raceDate}T00:00:00Z`)
    return null
  }

  const [diff, setDiff] = useState<number>(() => {
    const t = getTarget()
    return t ? t.getTime() - Date.now() : 0
  })

  useEffect(() => {
    const t = getTarget()
    if (!t) return
    const id = setInterval(() => setDiff(t.getTime() - Date.now()), 1000)
    return () => clearInterval(id)
  }, [qualifying, raceDate])

  if (diff <= 0) return null
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (days > 0) return `${days}d ${hours}h ${mins}m`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function localTz(d: Date): string {
  const offset = -d.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const h = Math.floor(Math.abs(offset) / 60)
  const m = Math.abs(offset) % 60
  return `GMT${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`
}

function formatLockDate(date: string, time?: string): string {
  const d = time ? new Date(`${date}T${time}`) : new Date(`${date}T00:00:00Z`)
  const day = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const t = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${day} · ${t} ${localTz(d)}`
}

function buildSessions(race: JolpicaRace): { label: string; session: JolpicaSession }[] {
  const isSprint = !!race.Sprint
  const sessions: { label: string; session: JolpicaSession }[] = []
  if (race.FirstPractice) sessions.push({ label: 'Practice 1', session: race.FirstPractice })
  if (isSprint) {
    if (race.SprintQualifying) sessions.push({ label: 'Sprint Quali', session: race.SprintQualifying })
    if (race.Sprint) sessions.push({ label: 'Sprint Race', session: race.Sprint })
  } else {
    if (race.SecondPractice) sessions.push({ label: 'Practice 2', session: race.SecondPractice })
    if (race.ThirdPractice) sessions.push({ label: 'Practice 3', session: race.ThirdPractice })
  }
  if (race.Qualifying) sessions.push({ label: 'Qualifying', session: race.Qualifying })
  sessions.push({ label: 'Race', session: { date: race.date, time: race.time } })
  return sessions
}

function formatSessionDate(date: string, time?: string): string {
  const d = time ? new Date(`${date}T${time}`) : new Date(`${date}T00:00:00Z`)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
}

function formatSessionTime(date: string, time: string): string {
  const d = new Date(`${date}T${time}`)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' ' + localTz(d)
}

export function Race() {
  const { round } = useParams<{ round: string }>()
  const roundNum = Number(round)
  const { user } = useAuth()

  const { data: races, isLoading: scheduleLoading } = useSchedule()
  const race = races?.find(r => r.round === round)
  const locked = race ? isRaceLocked(race.Qualifying, race.date) : false
  const countdown = useLockCountdown(race?.Qualifying, race?.date)

  const { data: existing, isLoading: predictionLoading } = usePrediction(user?.id, roundNum)
  const { mutate: upsert, isPending, isSuccess, error: saveError } = useUpsertPrediction()

  const [pole, setPole] = useState('')
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [p3, setP3] = useState('')
  const [constructor, setConstructor] = useState('')
  const [finishers, setFinishers] = useState<number | ''>('')

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
  const formDisabled = locked || isPending

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

  return (
    <div className="min-h-screen bg-f1-black">
      <NavBar />
      <main className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8">

        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-f1-red border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && !race && (
          <p className="text-f1-dim text-[14px]">Race not found.</p>
        )}

        {!isLoading && race && (
          <>
            <div className="mb-5">
              <Link
                to="/schedule"
                className="font-condensed font-semibold text-[12px] tracking-widest uppercase text-f1-muted hover:text-f1-dim transition-colors border border-f1-border px-3 py-1.5 rounded inline-flex items-center gap-1"
              >
                ← Schedule
              </Link>
            </div>

            {/* Race hero */}
            <div className="bg-f1-panel border border-f1-border border-b-0 rounded-t-lg px-4 sm:px-8 py-5 sm:py-7 flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6">
              <div className="min-w-0">
                <p className="font-condensed font-bold text-[12px] tracking-widest uppercase text-f1-red mb-2">
                  Round {race.round} · {CURRENT_SEASON} Season
                </p>
                <h1 className="font-condensed font-black text-[28px] sm:text-[44px] uppercase tracking-tight leading-none text-f1-text">
                  {race.raceName}
                </h1>
                <p className="font-condensed font-semibold text-[13px] sm:text-[15px] uppercase tracking-wide text-f1-dim mt-2 leading-snug">
                  {race.Circuit.circuitName}<br className="sm:hidden" />
                  <span className="hidden sm:inline"> · </span>
                  {race.Circuit.Location.locality}, {race.Circuit.Location.country}
                </p>
              </div>

              <div className="shrink-0">
                {!locked && countdown && (
                  <>
                    <p className="font-condensed text-[11px] tracking-widest uppercase text-f1-muted mb-2">
                      Predictions lock in
                    </p>
                    <div
                      className="font-mono text-[13px] text-f1-red px-3.5 py-2 rounded border inline-flex items-center gap-2"
                      style={{ background: 'rgba(232,0,45,0.10)', borderColor: 'rgba(232,0,45,0.20)' }}
                    >
                      🔒 {countdown}
                    </div>
                    {race.Qualifying && (
                      <p className="font-mono text-[12px] text-f1-muted mt-2">
                        {formatLockDate(race.Qualifying.date, race.Qualifying.time)}
                      </p>
                    )}
                  </>
                )}
                {locked && (
                  <div
                    className="font-condensed font-bold text-[12px] tracking-widest uppercase text-f1-gold px-3.5 py-2 rounded border inline-flex items-center gap-2"
                    style={{ background: 'rgba(255,215,0,0.08)', borderColor: 'rgba(255,215,0,0.2)' }}
                  >
                    🔒 Predictions Locked
                  </div>
                )}
              </div>
            </div>

            {/* Weekend schedule strip */}
            {(() => {
              const sessions = buildSessions(race)
              const isSprint = !!race.Sprint
              return (
                <div className="bg-f1-black/60 border-x border-b border-f1-border px-4 sm:px-8 py-4 sm:py-5">
                  <div className="flex items-center gap-3 mb-3">
                    <p className="font-condensed font-bold text-[11px] tracking-widest uppercase text-f1-muted">
                      Weekend Schedule
                    </p>
                    {isSprint && (
                      <span className="font-condensed font-bold text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded border bg-f1-gold/10 text-f1-gold border-f1-gold/30">
                        Sprint Weekend
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {sessions.map(({ label, session }) => {
                      const isRace = label === 'Race'
                      const isSp = label.startsWith('Sprint')
                      return (
                        <div
                          key={label}
                          className={`rounded-lg border px-3 py-2.5 flex flex-col gap-1 ${
                            isRace
                              ? 'border-f1-red/40 bg-f1-red/5'
                              : isSp
                              ? 'border-f1-gold/30 bg-f1-gold/5'
                              : 'border-f1-border bg-f1-black/40'
                          }`}
                        >
                          <span className={`font-condensed font-bold text-[10px] tracking-widest uppercase ${
                            isRace ? 'text-f1-red' : isSp ? 'text-f1-gold' : 'text-f1-dim'
                          }`}>
                            {label}
                          </span>
                          <span className="font-mono text-[11px] text-f1-muted leading-tight">
                            {formatSessionDate(session.date, session.time)}
                          </span>
                          {session.time && (
                            <span className={`font-mono text-[12px] font-semibold leading-tight ${
                              isRace ? 'text-f1-red' : isSp ? 'text-f1-gold' : 'text-f1-text'
                            }`}>
                              {formatSessionTime(session.date, session.time)}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* Form panel */}
            <div className="bg-f1-panel border border-f1-border border-t-0 rounded-b-lg px-4 sm:px-8 py-6 sm:py-8">

              {locked && existing ? (
                /* Read-only locked view */
                <>
                  <div className="mb-6">
                    <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-wide text-f1-text mb-1">
                      Your Prediction
                    </h2>
                    <p className="text-[13px] text-f1-muted">Qualifying has started — predictions are locked.</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { label: '🏆 Pole Position', value: existing.pole_driver_id, pts: 5 },
                      { label: '🏗 Top Constructor', value: existing.top_constructor_id, pts: 8 },
                      { label: '🥇 P1 Winner', value: existing.p1_driver_id, pts: 10 },
                      { label: '🥈 P2', value: existing.p2_driver_id, pts: 7 },
                      { label: '🥉 P3', value: existing.p3_driver_id, pts: 5 },
                      { label: '🏁 Finishers', value: String(existing.finishers_count), pts: 5 },
                    ].map(({ label, value, pts }) => (
                      <div key={label} className="bg-f1-black border border-f1-border rounded-[5px] px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-condensed font-bold text-[11px] tracking-widest uppercase text-f1-dim">{label}</span>
                          <span className="font-mono text-[10px] text-f1-muted bg-f1-panel border border-f1-border px-1.5 py-0.5 rounded">{pts} pts</span>
                        </div>
                        <span className="font-sans font-medium text-[14px] text-f1-text">{value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : locked && !existing ? (
                <p className="text-f1-muted text-[14px]">You didn't submit a prediction for this race.</p>
              ) : (
                /* Editable form */
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <h2 className="font-condensed font-extrabold text-[18px] uppercase tracking-wide text-f1-text mb-1">
                      {existing ? 'Update Your Prediction' : 'Your Prediction'}
                    </h2>
                    <p className="text-[13px] text-f1-muted">
                      All predictions are scored binary — correct or incorrect. Max 40 pts this race.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5 mb-6">
                    <DriverSelect
                      id="pole"
                      label="🏆 Pole Position"
                      value={pole}
                      onChange={setPole}
                      disabled={formDisabled}
                      pts={5}
                    />
                    <ConstructorSelect
                      id="constructor"
                      label="🏗 Top Constructor"
                      value={constructor}
                      onChange={setConstructor}
                      disabled={formDisabled}
                      pts={8}
                    />

                    {/* Podium group */}
                    <div className="sm:col-span-2 bg-f1-black border border-f1-border rounded-lg p-5 flex flex-col gap-4">
                      <p className="font-condensed font-bold text-[12px] tracking-widest uppercase text-f1-muted">
                        Podium Predictions · P1=10pts · P2=7pts · P3=5pts
                      </p>
                      {[
                        { pos: 'P1', driver: p1, setter: setP1, exclude: [p2, p3], label: 'P1 Winner', pts: 10, medalBg: 'rgba(255,215,0,0.15)', medalColor: '#FFD700', medalBorder: 'rgba(255,215,0,0.3)' },
                        { pos: 'P2', driver: p2, setter: setP2, exclude: [p1, p3], label: 'P2', pts: 7, medalBg: 'rgba(192,192,192,0.1)', medalColor: '#C0C0C0', medalBorder: 'rgba(192,192,192,0.2)' },
                        { pos: 'P3', driver: p3, setter: setP3, exclude: [p1, p2], label: 'P3', pts: 5, medalBg: 'rgba(205,127,50,0.12)', medalColor: '#CD7F32', medalBorder: 'rgba(205,127,50,0.25)' },
                      ].map(({ pos, driver, setter, exclude, label, pts, medalBg, medalColor, medalBorder }) => (
                        <div key={pos} className="flex items-center gap-3.5">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center font-condensed font-black text-[14px] shrink-0 border"
                            style={{ background: medalBg, color: medalColor, borderColor: medalBorder }}
                          >
                            {pos}
                          </div>
                          <div className="flex-1">
                            <DriverSelect
                              id={pos.toLowerCase()}
                              label={label}
                              value={driver}
                              onChange={setter}
                              disabled={formDisabled}
                              exclude={exclude.filter(Boolean)}
                              pts={pts}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Finishers */}
                    <div className="sm:col-span-2 flex flex-col gap-2">
                      <label htmlFor="finishers" className="flex items-center gap-2 font-condensed font-bold text-[11px] tracking-widest uppercase text-f1-dim">
                        🏁 Number of Cars that Finish
                        <span className="font-mono text-[10px] text-f1-muted bg-f1-black border border-f1-border px-1.5 py-0.5 rounded">5 pts</span>
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          id="finishers"
                          type="number"
                          min={0}
                          max={22}
                          value={finishers}
                          onChange={e => setFinishers(e.target.value === '' ? '' : Number(e.target.value))}
                          disabled={formDisabled}
                          required
                          className="bg-f1-black border border-f1-bright rounded-[5px] text-f1-text font-mono text-[16px] font-semibold px-3.5 py-2.5 outline-none focus:border-f1-red transition-colors disabled:opacity-50 w-28"
                        />
                        <span className="text-[13px] text-f1-muted">Enter a number between 0 and 22</span>
                      </div>
                    </div>
                  </div>

                  {saveError && (
                    <p className="text-[#FF6B6B] text-[13px] mb-4">{(saveError as Error).message}</p>
                  )}
                  {isSuccess && (
                    <p className="text-f1-green text-[13px] mb-4">✓ Prediction saved!</p>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-5 border-t border-f1-border">
                    <p className="text-[12px] text-f1-muted">
                      🔒 Locks at qualifying start · Update anytime before then
                    </p>
                    <button
                      type="submit"
                      disabled={formDisabled || !pole || !p1 || !p2 || !p3 || !constructor || finishers === ''}
                      className="bg-f1-red hover:brightness-110 disabled:opacity-40 text-white font-condensed font-bold text-[14px] tracking-widest uppercase px-8 py-3 rounded-[5px] transition-all w-full sm:w-auto"
                    >
                      {isPending ? 'Saving…' : existing ? 'Update →' : 'Save Prediction →'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
