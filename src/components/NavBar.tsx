import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'

function CheckeredFlag() {
  return (
    <div
      className="w-7 h-[18px] rounded-sm shrink-0"
      style={{
        background: 'repeating-conic-gradient(#fff 0% 25%, #000 0% 50%) 0 0 / 6px 6px',
      }}
    />
  )
}

export function NavBar() {
  const { user } = useAuth()
  const [username, setUsername] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => { setOpen(false) }, [location])

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
      .then(({ data }) => { if (data) setUsername(data.username) })
  }, [user])

  const handleSignOut = async () => { await supabase.auth.signOut() }

  const initial = username ? username[0].toUpperCase() : user?.email?.[0].toUpperCase() ?? '?'

  function NavItem({ to, label }: { to: string; label: string }) {
    const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
    return (
      <Link
        to={to}
        className={`font-condensed font-semibold text-[13px] tracking-widest uppercase px-3.5 py-1.5 transition-all duration-150 ${
          active
            ? 'text-f1-text bg-f1-red/10 border-b-2 border-f1-red rounded-t'
            : 'text-f1-dim hover:text-f1-text hover:bg-white/5 rounded'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <nav className="bg-f1-carbon border-b border-f1-border sticky top-0 z-50 h-14">
      <div className="max-w-[1200px] mx-auto px-8 h-full flex items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 mr-10 shrink-0">
          <CheckeredFlag />
          <span className="font-condensed font-black text-[22px] uppercase tracking-wide text-f1-text">
            F1 Predictions
          </span>
          <span className="bg-f1-red text-white font-condensed font-bold text-[11px] tracking-widest uppercase px-2 py-0.5 rounded ml-1">
            Beta
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-1 flex-1">
          <NavItem to="/" label="Home" />
          <NavItem to="/schedule" label="Schedule" />
          <NavItem to="/leaderboard" label="Leaderboard" />
        </div>

        {/* Avatar / sign out */}
        <div className="hidden sm:flex items-center gap-3 ml-auto">
          {user && (
            <div className="relative group">
              <Link
                to={`/profile/${user.id}`}
                className="w-8 h-8 rounded-full flex items-center justify-center font-condensed font-black text-[13px] text-white cursor-pointer shrink-0"
                style={{ background: 'linear-gradient(135deg, #E8002D, #ff6b6b)' }}
              >
                {initial}
              </Link>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="font-condensed font-semibold text-[12px] tracking-widest uppercase text-f1-muted hover:text-f1-dim transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden ml-auto flex flex-col justify-center gap-1.5 p-2"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-f1-text transition-transform duration-200 ${open ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`block w-6 h-0.5 bg-f1-text transition-opacity duration-200 ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-f1-text transition-transform duration-200 ${open ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden border-t border-f1-border bg-f1-carbon px-6 py-4 flex flex-col gap-3">
          <Link to="/" className="font-condensed font-semibold text-[14px] uppercase tracking-widest text-f1-dim hover:text-f1-text">Home</Link>
          <Link to="/schedule" className="font-condensed font-semibold text-[14px] uppercase tracking-widest text-f1-dim hover:text-f1-text">Schedule</Link>
          <Link to="/leaderboard" className="font-condensed font-semibold text-[14px] uppercase tracking-widest text-f1-dim hover:text-f1-text">Leaderboard</Link>
          {user && (
            <Link to={`/profile/${user.id}`} className="font-condensed font-semibold text-[14px] uppercase tracking-widest text-f1-dim hover:text-f1-text">
              {username ?? 'Profile'}
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="font-condensed font-bold text-[13px] uppercase tracking-widest text-f1-red text-left w-fit"
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  )
}
