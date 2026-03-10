import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'

export function NavBar() {
  const { user } = useAuth()
  const [username, setUsername] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const location = useLocation()

  // Close menu on navigation
  useEffect(() => { setOpen(false) }, [location])

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

  const linkClass = 'text-gray-300 hover:text-white text-sm transition-colors'

  return (
    <nav className="bg-gray-900 text-white">
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link to="/" className="text-red-500 font-bold text-xl tracking-tight">
          F1 Predictions
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-6">
          <Link to="/schedule" className={linkClass}>Schedule</Link>
          <Link to="/leaderboard" className={linkClass}>Leaderboard</Link>
          {user && (
            <Link to={`/profile/${user.id}`} className={linkClass}>
              {username ?? 'Profile'}
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Hamburger button */}
        <button
          className="sm:hidden flex flex-col justify-center gap-1.5 p-2"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-white transition-transform duration-200 ${open ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition-opacity duration-200 ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition-transform duration-200 ${open ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden border-t border-gray-800 px-4 py-4 flex flex-col gap-4">
          <Link to="/schedule" className={linkClass}>Schedule</Link>
          <Link to="/leaderboard" className={linkClass}>Leaderboard</Link>
          {user && (
            <Link to={`/profile/${user.id}`} className={linkClass}>
              {username ?? 'Profile'}
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded transition-colors text-left w-fit"
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  )
}
