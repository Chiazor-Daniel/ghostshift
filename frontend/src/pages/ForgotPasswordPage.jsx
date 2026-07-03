import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../components/Logo.jsx'
import { PasswordInput } from '../components/ui.jsx'
import realAPI from '../services/realAPI.js'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1639489547592-8aa4475ff677?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'

/**
 * Single page that handles both "request reset" and "complete reset".
 * If the URL has a ?token=… query param, it shows the "set new password" form.
 * Otherwise it shows the "enter your email" form.
 *
 * Both flows are intentionally non-leaky: requesting a reset always returns
 * the same "check your email" message regardless of whether the account exists.
 */
export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const tokenFromUrl = searchParams.get('token') || ''

  // ── Reset mode (token in URL) ──────────────────────────────────
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)

  // ── Request mode (no token) ────────────────────────────────────
  const [email, setEmail] = useState('')
  const [requestLoading, setRequestLoading] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [devToken, setDevToken] = useState('')

  // If a reset token is in the URL, intercept the request that the user
  // would otherwise have to make manually (the reset link is shown to the
  // user via the dev-only backend log when they request a reset).
  const isResetMode = Boolean(tokenFromUrl)

  async function handleRequest(e) {
    e.preventDefault()
    setRequestError('')
    if (!email) { setRequestError('Enter your email'); return }
    setRequestLoading(true)
    try {
      const res = await realAPI.forgotPassword(email.trim().toLowerCase())
      if (res?.dev_token) {
        setDevToken(res.dev_token)
        // Dev mode: skip email and go straight to reset form.
        navigate(`/forgot-password?token=${encodeURIComponent(res.dev_token)}`, { replace: true })
        return
      }
      setRequestSent(true)
    } catch (err) {
      setRequestError(err.message || 'Could not send reset email')
    } finally {
      setRequestLoading(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setResetError('')
    if (!newPassword || newPassword.length < 8) {
      setResetError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match')
      return
    }
    setResetLoading(true)
    try {
      await realAPI.resetPassword(tokenFromUrl, newPassword)
      setResetSuccess(true)
      // Auto-redirect to login after a short delay so the user can sign in
      setTimeout(() => navigate('/login', { replace: true }), 1800)
    } catch (err) {
      setResetError(err.message || 'Could not reset password')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2 bg-surface">
      <div className="flex items-center justify-center p-lg md:p-2xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-sm mb-xl">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Logo size={26} />
            </div>
            <span className="font-headline-md text-xl font-bold text-on-surface">GhostShift</span>
          </Link>

          {isResetMode ? (
            <>
              <h1 className="font-display-md text-display-md text-on-surface font-semibold">
                Set a new password
              </h1>
              <p className="mt-sm font-body-md text-body-md text-on-surface-variant">
                Choose a new password for your account. You'll be signed in on the next screen.
              </p>

              {resetSuccess ? (
                <div className="mt-lg rounded-xl bg-success-container/40 border border-success/30 p-md flex items-start gap-sm">
                  <span className="material-symbols-outlined text-success">check_circle</span>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface font-semibold">
                      Password updated
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Redirecting you to sign in…
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleReset} className="mt-lg space-y-md">
                  <div>
                    <label htmlFor="new_password" className="font-label-md text-label-md text-on-surface font-medium">
                      New password
                    </label>
                    <PasswordInput
                      id="new_password"
                      name="new_password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      className="input-base mt-xs"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="confirm_password" className="font-label-md text-label-md text-on-surface font-medium">
                      Confirm new password
                    </label>
                    <PasswordInput
                      id="confirm_password"
                      name="confirm_password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Type it again"
                      className="input-base mt-xs"
                      required
                    />
                  </div>

                  {resetError && (
                    <p className="font-label-sm text-label-sm text-error flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      {resetError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="btn-primary w-full justify-center py-md text-base shadow-soft-md disabled:opacity-60"
                  >
                    {resetLoading ? 'Updating…' : 'Update password'}
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </form>
              )}

              <p className="mt-lg text-center font-body-sm text-body-sm text-on-surface-variant">
                Remembered it?{' '}
                <Link to="/login" className="text-primary font-semibold hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display-md text-display-md text-on-surface font-semibold">
                Forgot your password?
              </h1>
              <p className="mt-sm font-body-md text-body-md text-on-surface-variant">
                Enter the email tied to your account and we'll send a reset link.
              </p>

              {requestSent ? (
                <div className="mt-lg rounded-xl bg-success-container/40 border border-success/30 p-md flex flex-col gap-sm">
                  <div className="flex items-start gap-sm">
                    <span className="material-symbols-outlined text-success">mark_email_read</span>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface font-semibold">
                        Check your email
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        If an account exists for {email}, a reset link has been sent.
                        The link is valid for one hour.
                      </p>
                    </div>
                  </div>
                  {devToken && (
                    <div className="mt-md pt-sm border-t border-outline-variant/30">
                      <Link to={`/forgot-password?token=${encodeURIComponent(devToken)}`} className="btn-primary w-full justify-center">
                        Proceed to reset password
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleRequest} className="mt-lg space-y-md">
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
                      placeholder="you@yourteam.com"
                      className="input-base mt-xs"
                      required
                    />
                  </div>

                  {requestError && (
                    <p className="font-label-sm text-label-sm text-error flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      {requestError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={requestLoading}
                    className="btn-primary w-full justify-center py-md text-base shadow-soft-md disabled:opacity-60"
                  >
                    {requestLoading ? 'Sending…' : 'Send reset link'}
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </form>
              )}

              <p className="mt-lg text-center font-body-sm text-body-sm text-on-surface-variant">
                Remembered it?{' '}
                <Link to="/login" className="text-primary font-semibold hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
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
              Always a way back in.
            </h1>
            <p className="mt-md font-body-lg text-body-lg opacity-90 leading-relaxed">
              Reset your password in under a minute — or use the invite link your admin sent you.
            </p>
          </div>

          <div className="font-label-sm text-label-sm opacity-70">
            SOC 2 · ISO 27001 · GDPR-ready
          </div>
        </div>
      </div>
    </div>
  )
}
