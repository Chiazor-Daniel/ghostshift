import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../components/Logo.jsx'
import { PasswordInput } from '../components/ui.jsx'
import { roleHome } from '../data/roles.js'
import { useAuth } from '../hooks/useAuth.jsx'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1639489547592-8aa4475ff677?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  // Pre-fill from invite link so the new employee doesn't have to retype credentials
  const [email, setEmail] = useState(location.state?.prefilledEmail || '')
  const [password, setPassword] = useState(location.state?.prefilledPassword || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('gs_theme', next ? 'dark' : 'light')
  }

  async function handleSignIn(e) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Enter your email and password'); return }
    setLoading(true)
    try {
      const data = await login(email.trim(), password)
      // Always route by role unless the caller specified a redirect (e.g. invite flow)
      const redirect = location.state?.from?.pathname || roleHome(data.user.role)
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(err.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  async function demoLogin(role) {
    setError('')
    setLoading(true)
    const creds = role === 'admin'
      ? { email: 'demo.admin@riverside.health',   password: 'Demo1234!' }
      : { email: 'demo.employee@riverside.health', password: 'Demo1234!' }
    setEmail(creds.email)
    setPassword(creds.password)
    try {
      const data = await login(creds.email, creds.password)
      const redirect = roleHome(data.user.role)
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(err.message || 'Demo login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background relative">
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 w-9 h-9 flex items-center justify-center rounded-lg bg-surface border border-outline-variant/30 shadow-soft-sm hover:bg-surface-variant/50 transition-colors"
        aria-label="Toggle theme"
      >
        <span className="material-symbols-outlined text-[20px]">{dark ? 'light_mode' : 'dark_mode'}</span>
      </button>
      <div className="flex items-center justify-center p-md sm:p-xl lg:p-2xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[400px]"
        >
          <Link to="/" className="flex items-center gap-sm mb-xl md:hidden">
            <Logo size={32} />
            <span className="font-headline-md text-xl font-bold text-on-surface">GhostShift</span>
          </Link>

          <h2 className="font-headline-lg text-headline-lg text-on-surface">Welcome back</h2>
          <p className="mt-sm font-body-md text-body-md text-on-surface-variant">
            Sign in to your team's scheduling intelligence.
          </p>

          <form onSubmit={handleSignIn} className="mt-xl space-y-md">
            <div>
              <label htmlFor="email" className="font-label-md text-label-md text-on-surface font-medium">
                Work email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@yourteam.com"
                className="input-base mt-xs"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="font-label-md text-label-md text-on-surface font-medium">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="font-label-sm text-label-sm text-primary hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <PasswordInput
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="input-base mt-xs"
                required
              />
            </div>

            {error && (
              <p className="font-label-sm text-label-sm text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-md text-base shadow-soft-md disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>

            {/* Demo Login Options */}
            {/* <div className="pt-sm border-t border-outline-variant/20">
              <p className="font-label-sm text-label-sm text-on-surface-variant text-center mb-1">
                Try the full demo — live data, AI assistant, ready to explore
              </p>
              <p className="text-[11px] text-on-surface-variant/70 text-center mb-2">
                Riverside General Hospital · 14 staff · 90 days of shifts
              </p>
              <div className="grid grid-cols-2 gap-sm">
                <button type="button" onClick={() => demoLogin('employee')} className="btn-secondary py-sm text-sm justify-center">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  Demo as Employee
                </button>
                <button type="button" onClick={() => demoLogin('admin')} className="btn-secondary py-sm text-sm justify-center">
                  <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                  Demo as Admin
                </button>
              </div>
            </div> */}
          </form>

          <p className="mt-lg text-center font-body-sm text-body-sm text-on-surface-variant">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              Set up your organization
            </Link>
          </p>
        </motion.div>
      </div>

      <div className="relative hidden md:block overflow-hidden">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/55 to-primary-900/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/70 via-transparent to-transparent" />

        <div className="relative h-full flex flex-col justify-between p-xl lg:p-2xl text-on-primary">
          <Link to="/" className="flex items-center gap-sm">
            <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
              <Logo size={28} />
            </div>
            <span className="font-headline-md text-xl font-bold">GhostShift</span>
          </Link>

          <div className="max-w-md">
            <h1 className="font-display-lg text-display-lg leading-tight drop-shadow-sm">
              Work shouldn't burn you out.
            </h1>
            <p className="mt-md font-body-lg text-body-lg opacity-90 leading-relaxed">
              The intelligent shift-swap and burnout-prediction platform trusted by 200+ shift-based teams.
            </p>

            <div className="mt-xl space-y-sm">
              {[
                { icon: 'auto_awesome', label: 'AI swap matching in 0.8s' },
                { icon: 'monitor_heart', label: 'Burnout prediction 2–3 weeks early' },
                { icon: 'forum', label: 'Conversational scheduling assistant' },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-sm rounded-xl bg-white/10 px-sm py-sm">
                  <span className="material-symbols-outlined text-[18px]">{f.icon}</span>
                  <span className="font-body-md text-body-md font-medium">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="font-label-sm text-label-sm opacity-70">
            SOC 2 · ISO 27001 · GDPR-ready
          </div>
        </div>
      </div>
    </div>
  )
}