import { Link } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { useSchedule } from '../hooks/useRace'

export function Home() {
  const { data: races, isLoading, isError } = useSchedule()

  const nextRace = races?.find(race => {
    const raceTime = race.time
      ? new Date(`${race.date}T${race.time}`)
      : new Date(`${race.date}T00:00:00Z`)
    return Date.now() < raceTime.getTime()
  })

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-white text-4xl font-bold mb-4">Welcome to F1 Predictions</h1>
        <p className="text-gray-400 text-lg mb-10">
          Predict race outcomes, score points, and climb the leaderboard.
        </p>

        {isLoading && (
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        )}

        {isError && (
          <p className="text-red-400 text-sm">Failed to load schedule.</p>
        )}

        {nextRace && (
          <div>
            <p className="text-gray-500 text-sm uppercase tracking-wide mb-3">Next race</p>
            <Link
              to={`/race/${nextRace.round}`}
              className="block bg-gray-900 border border-red-500 rounded-xl px-6 py-5 hover:bg-gray-800 transition-colors max-w-md"
            >
              <p className="text-gray-400 text-sm mb-1">
                Round {nextRace.round} · {new Date(`${nextRace.date}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}
              </p>
              <p className="text-white text-xl font-bold mb-1">{nextRace.raceName}</p>
              <p className="text-gray-400 text-sm">
                {nextRace.Circuit.Location.locality}, {nextRace.Circuit.Location.country}
              </p>
              <p className="text-red-400 text-sm font-medium mt-3">Make your prediction →</p>
            </Link>
          </div>
        )}

        {!isLoading && !isError && !nextRace && (
          <p className="text-gray-500">No upcoming races this season.</p>
        )}
      </main>
    </div>
  )
}
