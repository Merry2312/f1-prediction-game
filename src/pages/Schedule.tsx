import { Link } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { useSchedule } from '../hooks/useRace'
import { useAuth } from '../hooks/useAuth'
import { CURRENT_SEASON } from '../lib/jolpica'
import type { JolpicaRace } from '../types'

const COUNTRY_FLAGS: Record<string, string> = {
  'Australia': '🇦🇺', 'China': '🇨🇳', 'Japan': '🇯🇵', 'Bahrain': '🇧🇭',
  'Saudi Arabia': '🇸🇦', 'UAE': '🇦🇪', 'United Arab Emirates': '🇦🇪',
  'USA': '🇺🇸', 'United States': '🇺🇸', 'Mexico': '🇲🇽', 'Brazil': '🇧🇷',
  'Canada': '🇨🇦', 'Spain': '🇪🇸', 'Monaco': '🇲🇨', 'Italy': '🇮🇹',
  'UK': '🇬🇧', 'United Kingdom': '🇬🇧', 'Austria': '🇦🇹', 'Belgium': '🇧🇪',
  'Hungary': '🇭🇺', 'Netherlands': '🇳🇱', 'Singapore': '🇸🇬',
  'Azerbaijan': '🇦🇿', 'France': '🇫🇷', 'Portugal': '🇵🇹',
  'Qatar': '🇶🇦', 'Kuwait': '🇰🇼', 'Las Vegas': '🇺🇸',
}

function getFlag(country: string): string {
  return COUNTRY_FLAGS[country] ?? '🏁'
}

function raceStatus(race: JolpicaRace): 'past' | 'next' | 'upcoming' {
  const raceTime = race.time
    ? new Date(`${race.date}T${race.time}`)
    : new Date(`${race.date}T00:00:00Z`)
  if (Date.now() > raceTime.getTime()) return 'past'
  return 'upcoming'
}

function formatRaceDate(date: string, time?: string): string {
  const d = time ? new Date(`${date}T${time}`) : new Date(`${date}T00:00:00Z`)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

function formatRaceTime(date: string, time?: string): string {
  if (!time) return ''
  const d = new Date(`${date}T${time}`)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'
}

export function Schedule() {
  const { data: races, isLoading, isError } = useSchedule()
  const { user } = useAuth()
  const isAdmin = !!user && user.id === import.meta.env.VITE_ADMIN_USER_ID

  let foundNext = false
  const racesWithStatus = races?.map(race => {
    let status = raceStatus(race)
    if (status === 'upcoming' && !foundNext) {
      status = 'next'
      foundNext = true
    }
    return { race, status }
  })

  const total = races?.length ?? 0
  const completed = racesWithStatus?.filter(r => r.status === 'past').length ?? 0

  return (
    <div className="min-h-screen bg-f1-black">
      <NavBar />
      <main className="max-w-[1200px] mx-auto px-4 sm:px-8">
        {/* Page header */}
        <div className="pt-10 pb-8 border-b border-f1-border mb-8">
          <h1 className="font-condensed font-black text-[40px] uppercase tracking-tight leading-none text-f1-text">
            {CURRENT_SEASON} Season Schedule
          </h1>
          <p className="text-f1-dim text-[14px] mt-1.5">
            {total} races · {completed} completed · Click a race to predict or view results
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-f1-red border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isError && (
          <div className="bg-f1-red/10 border border-f1-red/30 rounded-lg p-4 text-f1-text text-[14px]">
            Failed to load schedule. The Jolpica API may be unavailable — try again shortly.
          </div>
        )}

        {racesWithStatus && (
          <div className="flex flex-col gap-2.5 pb-10">
            {racesWithStatus.map(({ race, status }) => (
              <div key={race.round}>
                <Link
                  to={`/race/${race.round}`}
                  className={`group flex items-center gap-5 rounded-lg px-6 py-4 border transition-all duration-150 relative overflow-hidden ${
                    status === 'next'
                      ? 'bg-f1-panel border-f1-red'
                      : status === 'past'
                      ? 'bg-f1-panel border-f1-border opacity-60 hover:opacity-80'
                      : 'bg-f1-panel border-f1-border hover:border-f1-bright hover:bg-[#1e1e1e]'
                  }`}
                >
                  {/* Left accent bar on hover / active */}
                  <div className={`absolute left-0 top-0 w-[3px] h-full transition-colors duration-150 ${
                    status === 'next' ? 'bg-f1-red' : 'bg-transparent group-hover:bg-f1-red'
                  }`} />

                  {/* Round number */}
                  <span className={`font-condensed font-black text-[28px] w-10 text-center shrink-0 ${
                    status === 'next' ? 'text-f1-red' : 'text-f1-muted'
                  }`}>
                    {String(race.round).padStart(2, '0')}
                  </span>

                  {/* Race info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-condensed font-extrabold text-[20px] uppercase tracking-tight text-f1-text truncate">
                      {race.raceName}
                    </p>
                    <p className="font-condensed font-medium text-[13px] uppercase tracking-wide text-f1-dim mt-0.5">
                      {getFlag(race.Circuit.Location.country)} {race.Circuit.circuitName}
                    </p>
                  </div>

                  {/* Date */}
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="font-mono text-[13px] text-f1-dim">{formatRaceDate(race.date, race.time)}</p>
                    {race.time && (
                      <p className={`font-mono text-[11px] mt-0.5 ${status === 'next' ? 'text-f1-red' : 'text-f1-muted'}`}>
                        {formatRaceTime(race.date, race.time)}
                      </p>
                    )}
                  </div>

                  {/* Status badge */}
                  <div className="shrink-0">
                    {status === 'next' && (
                      <span className="font-condensed font-bold text-[11px] tracking-widest uppercase px-3 py-1.5 rounded border bg-f1-red/15 text-f1-red border-f1-red/30">
                        🔴 This Week
                      </span>
                    )}
                    {status === 'past' && (
                      <span className="font-condensed font-bold text-[11px] tracking-widest uppercase px-3 py-1.5 rounded border bg-f1-green/10 text-f1-green border-f1-green/20">
                        ✓ Completed
                      </span>
                    )}
                    {status === 'upcoming' && (
                      <span className="font-condensed font-bold text-[11px] tracking-widest uppercase px-3 py-1.5 rounded border bg-white/7 text-f1-muted border-f1-border">
                        Upcoming
                      </span>
                    )}
                  </div>

                  {/* Action button */}
                  <div className="shrink-0">
                    {status === 'next' && (
                      <span className="font-condensed font-bold text-[11px] tracking-widest uppercase px-3.5 py-1.5 rounded bg-f1-red text-white">
                        Predict
                      </span>
                    )}
                    {status === 'past' && (
                      <span className="font-condensed font-bold text-[11px] tracking-widest uppercase px-3.5 py-1.5 rounded border border-f1-bright text-f1-dim">
                        Results
                      </span>
                    )}
                    {status === 'upcoming' && (
                      <span className="font-condensed font-bold text-[11px] tracking-widest uppercase px-3.5 py-1.5 rounded border border-f1-border text-f1-muted opacity-40 cursor-not-allowed">
                        Predict
                      </span>
                    )}
                  </div>
                </Link>

                {isAdmin && status === 'past' && (
                  <Link
                    to={`/admin/score/${race.round}`}
                    className="mt-1 ml-14 inline-block text-[12px] text-f1-gold hover:brightness-110 transition-colors font-condensed font-semibold tracking-wide uppercase"
                  >
                    Score round {race.round} →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
