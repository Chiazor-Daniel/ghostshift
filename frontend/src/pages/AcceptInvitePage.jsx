import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../components/Logo.jsx'
import { realAPI } from '../services/realAPI.js'
import { useToast } from '../components/Toast.jsx'

export default function AcceptInvitePage() {
  const { token } = useParams()
  const toast = useToast()
  const [status, setStatus] = useState('processing')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [department, setDepartment] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('Invite link is missing.')
      return
    }
    ;(async () => {
      try {
        const result = await realAPI.previewInvite(token)
        setEmail(result.invite?.email || '')
        setName(result.invite?.name || '')
        setRole(result.invite?.role || '')
        setDepartment(result.invite?.department || '')
        setOrgName(result.organization?.name || '')
        setStatus('success')
      } catch (err) {
        setStatus('error')
        setError(err.message || 'This invite link is invalid or has already been used.')
      }
    })()
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!password || password.length < 8) {
      toast.push('Password must be at least 8 characters', { tone: 'warning' })
      return
    }
    if (password !== confirm) {
      toast.push('Passwords do not match', { tone: 'warning' })
      return
    }
    setSubmitting(true)
    try {
      await realAPI.acceptInvite(token, password)
      setAccepted(true)
    } catch (err) {
      toast.push(err.message || 'Could not activate invite', { tone: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-md bg-background">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="inline-flex items-center gap-sm mb-xl">
          <Logo size={36} />
          <span className="font-headline-md text-xl font-bold text-on-surface">GhostShift</span>
        </Link>

        {status === 'processing' && (
          <div className="text-center space-y-md">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">hourglass_top</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">Opening invite…</h1>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-md">
            <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">error</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">Invite not found</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">{error}</p>
            <Link to="/login" className="btn-primary inline-flex justify-center w-full">
              Go to sign in
            </Link>
          </div>
        )}

        {accepted && (
          <div className="text-center space-y-md">
            <div className="w-16 h-16 rounded-2xl bg-success/10 text-success flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">You're all set</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Your account has been created. Sign in with your email and the password you just set.
            </p>
            <Link to="/login" state={{ prefilledEmail: email }} className="btn-primary inline-flex justify-center w-full">
              Sign in
            </Link>
          </div>
        )}

        {status === 'success' && !accepted && (
          <>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold text-center mb-2">
              Join {orgName || 'GhostShift'}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant text-center mb-md">
              Welcome, <strong className="text-on-surface">{name}</strong>.
              {department && <> You'll be in the <strong className="text-on-surface">{department}</strong> department.</>}
              Create a password to activate your account.
            </p>

            <form onSubmit={handleSubmit} className="space-y-md">
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant">Email</label>
                <input type="email" value={email} readOnly className="input-base w-full mt-xs bg-surface-variant/40" />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="input-base w-full mt-xs"
                  required
                  minLength={8}
                  autoFocus
                />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant">Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="input-base w-full mt-xs"
                  required
                  minLength={8}
                />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full justify-center disabled:opacity-60">
                {submitting ? 'Creating account…' : 'Create account & join'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}