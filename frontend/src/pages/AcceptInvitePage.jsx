import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../components/Logo.jsx'
import { realAPI } from '../services/realAPI.js'

export default function AcceptInvitePage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('processing')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('Invite link is missing.')
      return
    }
    (async () => {
      try {
        const result = await realAPI.acceptInvite(token)
        setEmail(result.invite?.email || '')
        setName(result.invite?.name || '')
        setTempPassword(result.created_user?.temp_password || '')
        setStatus('success')
      } catch (err) {
        setStatus('error')
        setError(err.message || 'This invite link is invalid or has already been used.')
      }
    })()
  }, [token])

  async function copy() {
    if (!tempPassword) return
    try {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

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
              <strong className="text-on-surface">{name || email}</strong> has been activated.
            </p>

            {tempPassword && (
              <div className="rounded-xl border border-outline-variant/40 bg-surface-variant/40 p-md text-left space-y-2">
                <p className="font-label-sm text-label-sm text-on-surface-variant">Your temporary password</p>
                <div className="flex items-center gap-sm">
                  <code className="flex-1 font-mono text-sm bg-background px-3 py-2 rounded-md border border-outline-variant/30 select-all">
                    {tempPassword}
                  </code>
                  <button onClick={copy} className="btn-secondary px-md py-sm text-sm">
                    <span className="material-symbols-outlined text-[16px]">{copied ? 'check' : 'content_copy'}</span>
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Save this password — you'll use it to sign in. You can change it after signing in.
                </p>
              </div>
            )}

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