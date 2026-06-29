import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../components/Logo.jsx'
import { roleHome } from '../data/roles.js'
import { seedData, getInvites, getEmployeeByEmail, addEmployee } from '../data/store.js'
import { currentUser, managerUser, adminUser, employees as mockEmployees, shifts, swapRequests as mockSwaps } from '../data/mock.js'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1639489547592-8aa4475ff677?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'

export default function LoginPage() {
  const navigate = useNavigate()
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('gs_theme', next ? 'dark' : 'light')
  }

  function ensureDemoData() {
    const employees = JSON.parse(localStorage.getItem('gs_employees') || '[]')
    if (employees.length > 0) return
    // Fix: make currentUser id match the shifts (e-201) and dedupe
    const dedupedEmployees = mockEmployees.filter((e) => e.id !== 'e-201')
    seedData({
      currentUser: { ...currentUser, id: 'e-201' },
      managerUser,
      adminUser,
      employees: dedupedEmployees,
      shifts,
      swapRequests: mockSwaps,
    })
  }

  function demoLogin(role) {
    ensureDemoData()
    try {
      const employees = JSON.parse(localStorage.getItem('gs_employees') || '[]')
      const match = employees.find((u) => u.role === role)
      if (!match) { setError(`No ${role} account found`); return }
      localStorage.setItem('gs_user', JSON.stringify(match))
      localStorage.setItem('gs_role', match.role)
      navigate(roleHome(match.role))
    } catch {
      setError('Something went wrong. Try again.')
    }
  }

  function handleSignIn(e) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Enter your email and password'); return }

    ensureDemoData()
    try {
      const normalized = email.toLowerCase().trim()
      const employees = JSON.parse(localStorage.getItem('gs_employees') || '[]')
      const match = employees.find((u) => u.email?.toLowerCase() === normalized)
      const invites = getInvites()
      const acceptedInvite = invites.find((i) => i.email?.toLowerCase() === normalized && i.status === 'accepted')

      if (match?.role === 'admin') {
        if (match.password !== password) { setError('Invalid email or password'); return }
        localStorage.setItem('gs_user', JSON.stringify(match))
        localStorage.setItem('gs_role', match.role)
        navigate(roleHome(match.role))
        return
      }

      if (match?.role === 'employee') {
        if (!acceptedInvite) { setError('This email has not been invited yet. Ask your admin for an invite link.'); return }
        localStorage.setItem('gs_user', JSON.stringify(match))
        localStorage.setItem('gs_role', match.role)
        navigate(roleHome(match.role))
        return
      }

      if (acceptedInvite) {
        // Invite accepted but employee record missing — create it now
        const emp = addEmployee({
          name: acceptedInvite.name || normalized.split('@')[0],
          email: normalized,
          role: acceptedInvite.role || 'employee',
          title: acceptedInvite.role === 'admin' ? 'Administrator' : 'Staff',
          department: acceptedInvite.department || 'Unassigned',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(acceptedInvite.name || normalized)}&background=6366f1&color=fff&size=120`,
        })
        localStorage.setItem('gs_user', JSON.stringify(emp))
        localStorage.setItem('gs_role', emp.role)
        navigate(roleHome(emp.role))
        return
      }

      setError('Invalid email or password')
    } catch {
      setError('Something went wrong. Try again.')
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
      {/* Left — form */}
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
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@hospital.org"
                className="input-base mt-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="font-label-md text-label-md text-on-surface font-medium">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setPassword('password')}
                  className="font-label-sm text-label-sm text-primary hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="input-base mt-xs"
              />
            </div>

            {error && (
              <p className="font-label-sm text-label-sm text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-md text-base shadow-soft-md">
              Sign in
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>

            <div className="pt-sm border-t border-outline-variant/20">
              <p className="font-label-sm text-label-sm text-on-surface-variant text-center mb-2">Demo — quick sign in</p>
              <div className="grid grid-cols-2 gap-sm">
                <button type="button" onClick={() => demoLogin('employee')} className="btn-secondary py-sm text-sm justify-center">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  Employee
                </button>
                <button type="button" onClick={() => demoLogin('admin')} className="btn-secondary py-sm text-sm justify-center">
                  <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                  Admin
                </button>
              </div>
            </div>
          </form>

          <p className="mt-lg text-center font-body-sm text-body-sm text-on-surface-variant">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              Set up your organization
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right — brand panel */}
      <div className="relative hidden md:block overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
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
              The intelligent shift-swap and burnout-prediction platform trusted by 200+ healthcare teams.
            </p>

            <div className="mt-xl space-y-sm">
              {[
                { icon: 'auto_awesome', label: 'AI swap matching in 0.8s' },
                { icon: 'monitor_heart', label: 'Burnout prediction 2–3 weeks early' },
                { icon: 'forum', label: 'Conversational scheduling assistant' },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-sm rounded-xl bg-white/10 px-sm py-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">{f.icon}</span>
                  <span className="font-body-md text-body-md font-medium">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="font-label-sm text-label-sm opacity-70">
            SOC 2 · HIPAA · ISO 27001
          </div>
        </div>
      </div>
    </div>
  )
}
