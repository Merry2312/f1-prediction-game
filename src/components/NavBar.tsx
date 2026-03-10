import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'

export function NavBar() {
  const { user } = useAuth()
  const [username, setUsername] = useState<string | null>(null)

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
      <div className="flex items-center gap-4">
        {username && <span className="text-gray-300 text-sm">{username}</span>}
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
