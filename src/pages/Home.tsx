import { NavBar } from '../components/NavBar'

export function Home() {
  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-white text-4xl font-bold mb-4">Welcome to F1 Predictions</h1>
        <p className="text-gray-400 text-lg">
          Predict race outcomes, score points, and climb the leaderboard.
        </p>
      </main>
    </div>
  )
}
