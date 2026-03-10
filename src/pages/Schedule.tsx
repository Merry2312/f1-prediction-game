import { NavBar } from '../components/NavBar'
import { useSchedule } from '../hooks/useRace'
import { CURRENT_SEASON } from '../lib/jolpica'
import type { JolpicaRace } from '../types'

function raceStatus(race: JolpicaRace): 'past' | 'next' | 'upcoming' {
  const raceTime = race.time
    ? new Date(`${race.date}T${race.time}`)
    : new Date(`${race.date}T00:00:00Z`)

  if (Date.now() > raceTime.getTime()) return 'past'
  return 'upcoming'
}

function formatDate(date: string, time?: string): string {
  const d = time ? new Date(`${date}T${time}`) : new Date(`${date}T00:00:00Z`)
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function Schedule() {
  const { data: races, isLoading, isError } = useSchedule()

  // Mark the first upcoming race as "next"
  let foundNext = false
  const racesWithStatus = races?.map(race => {
    let status = raceStatus(race)
    if (status === 'upcoming' && !foundNext) {
      status = 'next'
      foundNext = true
    }
    return { race, status }
  })

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-white text-3xl font-bold mb-1">{CURRENT_SEASON} Season</h1>
        <p className="text-gray-400 mb-8">Full race calendar</p>

        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isError && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300">
            Failed to load schedule. The Jolpica API may be unavailable — try again shortly.
          </div>
        )}

        {racesWithStatus && (
          <ol className="space-y-3">
            {racesWithStatus.map(({ race, status }) => (
              <li
                key={race.round}
                className={`flex items-center gap-4 rounded-xl px-5 py-4 border transition-colors ${
                  status === 'next'
                    ? 'bg-red-600/10 border-red-500'
                    : status === 'past'
                    ? 'bg-gray-900 border-gray-800 opacity-60'
                    : 'bg-gray-900 border-gray-800'
                }`}
              >
                <span className="text-gray-500 text-sm w-6 text-right shrink-0">
                  {race.round}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${status === 'past' ? 'text-gray-400' : 'text-white'}`}>
                    {race.raceName}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {race.Circuit.Location.locality}, {race.Circuit.Location.country}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-gray-300 text-sm">{formatDate(race.date, race.time)}</p>
                  {status === 'next' && (
                    <span className="text-red-400 text-xs font-semibold uppercase tracking-wide">Next race</span>
                  )}
                  {status === 'past' && (
                    <span className="text-gray-600 text-xs uppercase tracking-wide">Completed</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  )
}
