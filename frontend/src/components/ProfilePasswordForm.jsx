import { useState } from 'react'
import { Card } from './ui.jsx'
import { useToast } from './Toast.jsx'
import { realAPI } from '../services/realAPI.js'

export default function ProfilePasswordForm() {
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (newPass.length < 8) {
      toast.push('New password must be at least 8 characters', { tone: 'warning' })
      return
    }
    if (newPass !== confirm) {
      toast.push('Passwords do not match', { tone: 'warning' })
      return
    }
    setBusy(true)
    try {
      await realAPI.changePassword(current, newPass)
      setCurrent('')
      setNewPass('')
      setConfirm('')
      toast.push('Password updated', { tone: 'success' })
    } catch (err) {
      toast.push(err.message || 'Could not update password', { tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="mb-md">
        <h2 className="font-headline-md text-headline-lg text-on-surface font-bold">Profile & password</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">Update your account password</p>
      </div>
      <Card hover={false}>
        <form onSubmit={submit} className="space-y-md max-w-md">
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">Current password</label>
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="input-base w-full mt-xs" required />
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">New password</label>
            <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="input-base w-full mt-xs" required minLength={8} />
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">Confirm new password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input-base w-full mt-xs" required minLength={8} />
          </div>
          <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </Card>
    </>
  )
}
