import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function CheckeredFlag() {
  return (
    <div
      className="w-8 h-5 rounded-sm shrink-0"
      style={{
        background: 'repeating-conic-gradient(#fff 0% 25%, #000 0% 50%) 0 0 / 6px 6px',
      }}
    />
  )
}

export function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, username })
      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }
    }

    navigate('/')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'radial-gradient(ellipse at center top, rgba(232,0,45,0.06) 0%, transparent 60%), #0A0A0A' }}
    >
      <div className="w-full max-w-[420px]">
        <div className="bg-f1-panel border border-f1-border rounded-xl p-12">
          <div className="flex items-center gap-3 mb-2">
            <CheckeredFlag />
            <span className="font-condensed font-black text-[32px] uppercase tracking-wide text-f1-text">
              F1 Predictions
            </span>
          </div>
          <p className="text-f1-muted text-[13px] mb-9">Create your account to join the competition</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="font-condensed font-bold text-[11px] tracking-widest uppercase text-f1-dim">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                minLength={3}
                placeholder="YourCallsign"
                className="bg-f1-black border border-f1-bright rounded-[5px] text-f1-text font-sans text-[14px] px-3.5 py-3 outline-none focus:border-f1-red transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="font-condensed font-bold text-[11px] tracking-widest uppercase text-f1-dim">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="bg-f1-black border border-f1-bright rounded-[5px] text-f1-text font-sans text-[14px] px-3.5 py-3 outline-none focus:border-f1-red transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="font-condensed font-bold text-[11px] tracking-widest uppercase text-f1-dim">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                className="bg-f1-black border border-f1-bright rounded-[5px] text-f1-text font-sans text-[14px] px-3.5 py-3 outline-none focus:border-f1-red transition-colors"
              />
            </div>

            {error && (
              <p className="text-[#FF6B6B] text-[13px]">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-f1-red hover:brightness-110 disabled:opacity-50 text-white font-condensed font-bold text-[14px] tracking-widest uppercase py-3.5 rounded-[5px] transition-all"
            >
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <p className="text-center mt-5 text-[13px] text-f1-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-f1-red font-semibold hover:brightness-110">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
