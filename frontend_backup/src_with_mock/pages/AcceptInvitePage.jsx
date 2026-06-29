import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../components/Logo.jsx'
import { acceptInvite } from '../data/store.js'

export default function AcceptInvitePage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('processing')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('Invite link is missing.')
      return
    }
    const result = acceptInvite(token)
    if (result.error) {
      setStatus('error')
      setError(result.error)
    } else {
      setStatus('success')
      setEmail(result.invite.email)
      // Redirect to login after a short delay so the user sees the confirmation
      const id = setTimeout(() => navigate('/login'), 2500)
      return () => clearTimeout(id)
    }
  }, [token, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center p-md bg-background">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md text-center"
      >
        <Link to="/" className="inline-flex items-center gap-sm mb-xl">
          <Logo size={36} />
          <span className="font-headline-md text-xl font-bold text-on-surface">GhostShift</span>
        </Link>

        {status === 'processing' && (
          <div className="space-y-md">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">hourglass_top</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">Activating your invite…</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Just a moment while we set up your account.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-md">
            <div className="w-16 h-16 rounded-2xl bg-success/10 text-success flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">You're all set</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              <strong className="text-on-surface">{email}</strong> has been activated. You can now sign in with any password.
            </p>
            <Link to="/login" className="btn-primary inline-flex justify-center w-full">
              Continue to sign in
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-md">
            <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">error</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">Invite not found</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">{error || 'This invite link is invalid or has already been used.'}</p>
            <Link to="/login" className="btn-primary inline-flex justify-center w-full">
              Go to sign in
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  )
}
