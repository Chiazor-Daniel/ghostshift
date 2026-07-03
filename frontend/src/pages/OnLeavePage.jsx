import { useState } from 'react'
import { motion } from 'framer-motion'
import Logo from '../components/Logo.jsx'
import { useToast } from '../components/Toast.jsx'
import { realAPI } from '../services/realAPI.js'
import { formatDateFull } from '../data/store.js'

export default function OnLeavePage({ leave, user }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  async function handleReturn() {
    if (busy || !leave?.id) return
    setBusy(true)
    try {
      await realAPI.returnFromLeave(leave.id)
      toast.push('Welcome back! Your admin has been notified.', { tone: 'success', duration: 6000 })
      window.dispatchEvent(new CustomEvent('gs:data-changed', { detail: { type: 'leave_return' } }))
      window.location.href = '/app/employee'
    } catch (err) {
      toast.push(err.message || 'Could not mark return', { tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const typeLabel = (leave?.type || 'leave').replace(/_/g, ' ')
  const today = new Date().toISOString().slice(0, 10)
  const started = !leave?.start_date || leave.start_date <= today
  const heading = started ? 'You are on leave' : 'Your leave is approved'
  const subtitle = started
    ? `Enjoy your time off, ${user?.name?.split(' ')[0] || 'there'}. Your schedule is paused until you return.`
    : `Hi ${user?.name?.split(' ')[0] || 'there'}, your absence was approved. App access is limited until your leave ends or you mark yourself as back.`

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-surface to-accent/5 flex items-center justify-center p-md">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-md">
            <Logo size={36} />
          </div>
          <h1 className="font-display-md text-display-md font-bold text-on-surface">{heading}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
            {subtitle}
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-outline-variant/50 shadow-soft-lg p-xl space-y-md">
          <div className="flex items-center gap-md p-md rounded-xl bg-warning/10 border border-warning/20">
            <span className="material-symbols-outlined text-warning text-[32px]">beach_access</span>
            <div>
              <p className="font-label-md text-label-md font-semibold text-on-surface capitalize">{typeLabel}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {formatDateFull(leave?.start_date)} → {formatDateFull(leave?.end_date)}
              </p>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                {leave?.duration_days} day{leave?.duration_days === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          {leave?.shift_plan?.applied?.length > 0 && (
            <div className="text-sm text-on-surface-variant bg-surface-variant/40 rounded-xl p-md">
              <p className="font-semibold text-on-surface mb-1">Your shifts were covered</p>
              <p>
                {leave.shift_plan.applied.length} shift{leave.shift_plan.applied.length === 1 ? '' : 's'} were
                reassigned or posted to the marketplace before your leave was approved.
              </p>
            </div>
          )}

          <p className="font-body-sm text-body-sm text-on-surface-variant text-center">
            App access is limited during your absence. When you&apos;re ready to work again, tap below —
            your admin will be notified.
          </p>

          <button
            type="button"
            onClick={handleReturn}
            disabled={busy}
            className="btn-primary w-full justify-center py-md text-base disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[20px]">waving_hand</span>
            {busy ? 'Updating…' : "I'm back"}
          </button>
        </div>

        <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-lg">
          Questions? Contact your administrator.
        </p>
      </motion.div>
    </div>
  )
}
