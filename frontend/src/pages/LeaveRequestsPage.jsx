import { useState } from 'react'
import { Card, CardHeader, Badge, Drawer, EmptyState, Select } from '../components/ui.jsx'
import { useToast } from '../components/Toast.jsx'
import { useUser } from '../layout/AppShell.jsx'
import { getLeaveRequests, addLeaveRequest, approveLeave, declineLeave, formatDate, today } from '../data/store.js'

const leaveTypes = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'sick', label: 'Sick leave' },
  { value: 'personal', label: 'Personal' },
  { value: 'bereavement', label: 'Bereavement' },
  { value: 'jury', label: 'Jury duty' },
  { value: 'other', label: 'Other' },
]

export default function LeaveRequestsPage() {
  const toast = useToast()
  const { user: currentUser } = useUser()
  const isAdmin = currentUser?.role === 'admin'
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form, setForm] = useState({ type: 'vacation', startDate: '', endDate: '', reason: '' })
  const [, forceRender] = useState(0)
  const rerender = () => forceRender((x) => x + 1)

  const allLeaves = getLeaveRequests()
  const myLeaves = allLeaves.filter((l) => l.employeeId === currentUser?.id)
  const leaves = isAdmin ? allLeaves : myLeaves
  const pending = leaves.filter((l) => l.status === 'pending')
  const approved = leaves.filter((l) => l.status === 'approved')
  const declined = leaves.filter((l) => l.status === 'declined')

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.startDate || !form.endDate) {
      toast.push('Please select start and end dates', { tone: 'warning' })
      return
    }
    addLeaveRequest({
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason,
    })
    setDrawerOpen(false)
    setForm({ type: 'vacation', startDate: '', endDate: '', reason: '' })
    rerender()
    toast.push('Leave request submitted', { tone: 'success' })
  }

  function handleApprove(id) {
    approveLeave(id)
    rerender()
    toast.push('Leave request approved', { tone: 'success' })
  }

  function handleDecline(id) {
    declineLeave(id)
    rerender()
    toast.push('Leave request declined', { tone: 'warning' })
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display-sm font-bold text-on-surface">Leave Requests</h1>
        {!isAdmin && (
          <button onClick={() => setDrawerOpen(true)} className="btn-primary">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Request leave
          </button>
        )}
      </div>

      <section className="page-section">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card hover>
            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Total requests</div>
            <div className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1">{leaves.length}</div>
          </Card>
          <Card hover>
            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Pending</div>
            <div className="font-headline-lg text-headline-lg font-bold text-warning mt-1">{pending.length}</div>
          </Card>
          <Card hover>
            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Approved</div>
            <div className="font-headline-lg text-headline-lg font-bold text-success mt-1">{approved.length}</div>
          </Card>
          <Card hover>
            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Declined</div>
            <div className="font-headline-lg text-headline-lg font-bold text-error mt-1">{declined.length}</div>
          </Card>
        </div>

        <Card hover={false}>
          <CardHeader icon="event_busy" title={isAdmin ? 'All leave requests' : 'My leave requests'} />
          {leaves.length === 0 ? (
            <EmptyState icon="event_busy" title="No leave requests" description={isAdmin ? 'No employees have requested leave yet.' : 'You have not requested any leave yet.'} />
          ) : (
            <div className="space-y-sm mt-md">
              {leaves
                .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                .map((l) => (
                  <div key={l.id} className="flex items-center gap-md p-md rounded-xl border border-outline-variant/30 hover:border-primary/40 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      l.status === 'approved' ? 'bg-success/10 text-success' :
                      l.status === 'declined' ? 'bg-error/10 text-error' :
                      'bg-warning/10 text-warning'
                    }`}>
                      <span className="material-symbols-outlined text-[20px]">
                        {l.status === 'approved' ? 'check_circle' : l.status === 'declined' ? 'cancel' : 'hourglass_top'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-sm flex-wrap">
                        <span className="font-label-md text-label-md font-bold text-on-surface">{l.employeeName}</span>
                        <Badge variant={l.status === 'approved' ? 'success' : l.status === 'declined' ? 'error' : 'warning'}>
                          {l.status}
                        </Badge>
                        <span className="chip bg-surface-variant text-on-surface-variant text-xs">{leaveTypes.find(t => t.value === l.type)?.label || l.type}</span>
                      </div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                        {formatDate(l.startDate)} – {formatDate(l.endDate)}
                        {l.reason && ` · ${l.reason}`}
                      </div>
                    </div>
                    {isAdmin && l.status === 'pending' && (
                      <div className="flex gap-sm">
                        <button onClick={() => handleApprove(l.id)} className="btn-primary py-xs px-sm text-xs">Approve</button>
                        <button onClick={() => handleDecline(l.id)} className="btn-ghost py-xs px-sm text-xs text-error hover:bg-error/10">Decline</button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </Card>
      </section>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Request leave" subtitle="Submit a time-off request">
        <form onSubmit={handleSubmit} className="p-md space-y-md">
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">Leave type</label>
            <Select value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={leaveTypes} className="w-full mt-xs" />
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Start date</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input-base mt-xs w-full" min={today().toISOString().slice(0, 10)} />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">End date</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input-base mt-xs w-full" min={form.startDate || today().toISOString().slice(0, 10)} />
            </div>
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">Reason (optional)</label>
            <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="input-base mt-xs w-full min-h-[80px] resize-none" placeholder="Brief reason for leave" />
          </div>
          <div className="flex items-center justify-end gap-sm pt-sm border-t border-outline-variant/30">
            <button type="button" onClick={() => setDrawerOpen(false)} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary">Submit request</button>
          </div>
        </form>
      </Drawer>
    </>
  )
}
