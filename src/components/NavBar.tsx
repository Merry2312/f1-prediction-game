import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSchedule } from '../hooks/useRace'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'

export function NavBar() {
  const { user } = useAuth()
  const [username, setUsername] = useState<string | null>(null)
  const { data: races } = useSchedule()

  const isAdmin = !!user && user.id === import.meta.env.VITE_ADMIN_USER_ID

  // Most recent past race, for the admin scoring link
  const lastRound = races
    ?.filter(r => {
      const t = r.time ? new Date(`${r.date}T${r.time}`) : new Date(`${r.date}T00:00:00Z`)
      return Date.now() >= t.getTime()
    })
    .at(-1)?.round

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setUsername(data.username)
      })
  }, [user])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
      <Link to="/" className="text-red-500 font-bold text-xl tracking-tight">
        F1 Predictions
      </Link>
      <div className="flex items-center gap-6">
        <Link to="/schedule" className="text-gray-300 hover:text-white text-sm transition-colors">
          Schedule
        </Link>
        {isAdmin && lastRound && (
          <Link
            to={`/admin/score/${lastRound}`}
            className="text-yellow-400 hover:text-yellow-300 text-sm transition-colors"
          >
            Score round {lastRound}
          </Link>
        )}
        {username && <span className="text-gray-400 text-sm">{username}</span>}
        <button
          onClick={handleSignOut}
          className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
