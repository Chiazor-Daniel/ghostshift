import { useState, useEffect } from 'react'
import { Card, CardHeader, Badge, Drawer, EmptyState, Select, ListSkeleton, Pagination, ConfirmDialog, RichListItem, Modal } from '../components/ui.jsx'
import { useToast } from '../components/Toast.jsx'
import { useUser } from '../layout/AppShell.jsx'
import { realAPI } from '../services/realAPI.js'
import { formatDate, today } from '../data/store.js'

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
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({ type: 'vacation', startDate: '', endDate: '', reason: '' })
  // Per-action busy flags — prevent double-clicks on async buttons.
  const [submittingLeave, setSubmittingLeave] = useState(false)
  const [busyLeaveId, setBusyLeaveId] = useState(null)
  const [busyLeaveAction, setBusyLeaveAction] = useState(null)
  const [confirmLeave, setConfirmLeave] = useState(null)
  const [reasoning, setReasoning] = useState(null)
  const [busyReasoningId, setBusyReasoningId] = useState(null)

  useEffect(() => {
    refresh()
  }, [isAdmin, currentUser?.id])

  async function refresh() {
    if (!currentUser?.id) return
    setLoading(true)
    try {
      const params = isAdmin ? {} : { mine_only: 'true' }
      const data = await realAPI.getLeaves(params)
      setLeaves(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.push(err.message || 'Could not load absence requests', { tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submittingLeave) return
    if (!form.startDate || !form.endDate) {
      toast.push('Please select start and end dates', { tone: 'warning' })
      return
    }
    setSubmittingLeave(true)
    try {
      await realAPI.createLeave({
        type: form.type,
        start_date: form.startDate,
        end_date: form.endDate,
        reason: form.reason,
      })
      toast.push('Absence request submitted', { tone: 'success' })
      setDrawerOpen(false)
      setForm({ type: 'vacation', startDate: '', endDate: '', reason: '' })
      refresh()
    } catch (err) {
      toast.push(err.message || 'Could not submit absence request', { tone: 'error' })
    } finally {
      setSubmittingLeave(false)
    }
  }

  async function loadReasoning(lv) {
    if (busyReasoningId) return
    setBusyReasoningId(lv.id)
    try {
      const res = await realAPI.getLeaveReasoning(lv.id)
      setReasoning({ ...res, leave: lv })
    } catch (err) {
      toast.push(err.message || 'Could not load AI reasoning', { tone: 'error' })
    } finally {
      setBusyReasoningId(null)
    }
  }

  function handleDecide(id, status) {
    setConfirmLeave({ id, status, action: status === 'approved' ? 'approve' : 'reject' })
  }

  function handleCancel(id) {
    setConfirmLeave({ id, status: 'cancelled', action: 'cancel' })
  }

  async function executeLeaveAction() {
    if (!confirmLeave) return
    const { id, status } = confirmLeave
    setConfirmLeave(null)
    setBusyLeaveId(id)
    setBusyLeaveAction(status === 'approved' ? 'approve' : status === 'cancelled' ? 'cancel' : 'reject')
    try {
      if (status === 'cancelled') {
        await realAPI.cancelLeave(id)
        toast.push('Absence request cancelled', { tone: 'warning' })
      } else {
        await realAPI.decideLeave(id, { status })
        toast.push(`Absence request ${status}`, { tone: status === 'approved' ? 'success' : 'warning' })
      }
      refresh()
    } catch (err) {
      toast.push(err.message || 'Could not update absence request', { tone: 'error' })
    } finally {
      setBusyLeaveId(null)
      setBusyLeaveAction(null)
    }
  }

  const pending = leaves.filter((l) => l.status === 'pending')
  const approved = leaves.filter((l) => l.status === 'approved')
  const declined = leaves.filter((l) => l.status === 'declined' || l.status === 'rejected')

  const sortedLeaves = leaves
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const PAGE_SIZE = 8
  const pageLeaves = sortedLeaves.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display-sm font-bold text-on-surface">Absence Requests</h1>
        {!isAdmin && (
          <button onClick={() => setDrawerOpen(true)} className="btn-primary">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Request absence
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
          <CardHeader icon="event_busy" title={isAdmin ? 'All absence requests' : 'My absence requests'} />
          {loading ? (
            <div className="mt-md"><ListSkeleton variant="row" count={4} /></div>
          ) : leaves.length === 0 ? (
            <EmptyState icon="event_busy" title="No absence requests" description={isAdmin ? 'No employees have requested absence yet.' : 'You have not requested any absence yet.'} />
          ) : (
            <div className="space-y-sm mt-md">
              {pageLeaves.map((l) => {
                const statusVariant =
                  l.status === 'approved' ? 'success' :
                  (l.status === 'declined' || l.status === 'rejected') ? 'error' : 'warning'
                const statusIcon =
                  l.status === 'approved' ? 'check_circle' :
                  (l.status === 'declined' || l.status === 'rejected') ? 'cancel' : 'hourglass_top'
                const actions = isAdmin && l.status === 'pending' ? [
                  { label: 'AI reason', icon: 'auto_awesome', onClick: () => loadReasoning(l), disabled: busyReasoningId !== null },
                  { label: busyLeaveId === l.id && busyLeaveAction === 'approve' ? '…' : 'Approve', primary: true, onClick: () => handleDecide(l.id, 'approved'), disabled: busyLeaveId !== null },
                  { label: busyLeaveId === l.id && busyLeaveAction === 'reject' ? '…' : 'Decline', danger: true, onClick: () => handleDecide(l.id, 'rejected'), disabled: busyLeaveId !== null },
                ] : !isAdmin && l.status === 'pending' ? [
                  { label: busyLeaveId === l.id && busyLeaveAction === 'cancel' ? '…' : 'Cancel', onClick: () => handleCancel(l.id), disabled: busyLeaveId !== null },
                ] : []
                return (
                  <RichListItem
                    key={l.id}
                    icon={statusIcon}
                    iconColor={statusVariant}
                    title={l.employee_name || l.employeeName}
                    subtitle={`${formatDate(l.start_date || l.startDate)} – ${formatDate(l.end_date || l.endDate)}`}
                    status={{ variant: statusVariant, label: l.status }}
                    meta={l.reason}
                    details={[{ label: 'Type', value: leaveTypes.find(t => t.value === l.type)?.label || l.type }]}
                    actions={actions}
                  />
                )
              })}
              <Pagination page={page} pageSize={PAGE_SIZE} total={sortedLeaves.length} onChange={setPage} />
            </div>
          )}
        </Card>
      </section>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Request absence" subtitle="Submit a time-off request">
        <form onSubmit={handleSubmit} className="p-md space-y-md">
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">Absence type</label>
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
            <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="input-base mt-xs w-full min-h-[80px] resize-none" placeholder="Brief reason for absence" />
          </div>
          <div className="flex items-center justify-end gap-sm pt-sm border-t border-outline-variant/30">
            <button type="button" onClick={() => setDrawerOpen(false)} disabled={submittingLeave} className="btn-ghost disabled:opacity-60">Cancel</button>
            <button type="submit" disabled={submittingLeave} className="btn-primary disabled:opacity-60">
              {submittingLeave ? 'Submitting…' : 'Submit request'}
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!confirmLeave}
        onClose={() => setConfirmLeave(null)}
        onConfirm={executeLeaveAction}
        title={confirmLeave?.action === 'approve' ? 'Approve absence?' : confirmLeave?.action === 'cancel' ? 'Cancel request?' : 'Decline request?'}
        message={confirmLeave?.action === 'approve' ? 'Approve this absence request?' : confirmLeave?.action === 'cancel' ? 'Cancel your absence request?' : 'Decline this absence request?'}
        confirmLabel={confirmLeave?.action === 'approve' ? 'Approve' : confirmLeave?.action === 'cancel' ? 'Cancel' : 'Decline'}
        tone={confirmLeave?.action === 'approve' ? 'primary' : 'danger'}
      />

      {/* AI reasoning modal for leave */}
      <Modal open={!!reasoning} onClose={() => setReasoning(null)} title="AI reasoning" size="md">
        {reasoning && (
          <div className="space-y-md">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Suggested action</div>
              <div className={`font-headline-md text-2xl font-bold mt-1 ${reasoning.suggestion === 'approve' ? 'text-success' : 'text-warning'}`}>
                {reasoning.suggestion === 'approve' ? 'Approve' : 'Review carefully'}
              </div>
              <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                Overlapping shifts: <b>{reasoning.overlapping_shifts}</b>
              </div>
            </div>
            <div>
              <div className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">AI reasoning</div>
              <p className="font-body-lg text-body-lg text-on-surface leading-relaxed">
                {reasoning.reasoning}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}