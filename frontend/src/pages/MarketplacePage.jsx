import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useUser } from '../layout/AppShell.jsx'
import { Card, Badge, Drawer, EmptyState, Select, ListSkeleton, Pagination, ConfirmDialog } from '../components/ui.jsx'
import { useToast } from '../components/Toast.jsx'
import { realAPI } from '../services/realAPI.js'
import { formatDate, formatDateFull, timeLabel, today } from '../data/store.js'
import { isShiftOpen } from '../lib/shiftUtils.js'
import { useDebouncedRefresh } from '../hooks/useDebouncedRefresh.js'

const adminTabs = [
  { id: 'browse', label: 'Browse open shifts' },
]
const employeeTabs = [
  { id: 'browse', label: 'Browse shifts' },
  { id: 'requests', label: 'My requests' },
]

export default function MarketplacePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('browse')
  const [filter, setFilter] = useState('all')
  const [dept, setDept] = useState(() => searchParams.get('dept') || 'all')
  const [role, setRole] = useState('all')

  useEffect(() => {
    const deptParam = searchParams.get('dept')
    if (deptParam) setDept(deptParam)
  }, [searchParams])

  const [openShifts, setOpenShifts] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [drawerShift, setDrawerShift] = useState(null)
  const [editShift, setEditShift] = useState(null)
  const [requestModal, setRequestModal] = useState(null)
  const [browsePage, setBrowsePage] = useState(1)
  const [requestsPage, setRequestsPage] = useState(1)
  // Per-action busy flags — prevent double-clicks on async buttons.
  const [requestingShiftId, setRequestingShiftId] = useState(null)
  const [deletingShiftId, setDeletingShiftId] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [autoFillShiftId, setAutoFillShiftId] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const toast = useToast()
  const { user: currentUser } = useUser()
  const isAdmin = currentUser?.role === 'admin'
  const pageTabs = isAdmin ? adminTabs : employeeTabs

  useEffect(() => {
    refresh()
  }, [])

  useDebouncedRefresh(refresh)

  async function refresh(opts = {}) {
    const silent = opts?.silent === true
    const hasData = openShifts.length > 0 || requests.length > 0
    if (!silent && !hasData) setLoading(true)
    try {
      const [shifts, swaps] = await Promise.all([realAPI.getShifts(), realAPI.getSwaps()])
      setOpenShifts((shifts || []).filter((s) => isShiftOpen(s)))
      setRequests(swaps || [])
    } catch (err) {
      toast.push(err.message || 'Could not load shifts', { tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const myRequests = requests.filter((s) => s.requester_id === currentUser?.id)

  const depts = ['all', ...Array.from(new Set(openShifts.map((s) => s.department).filter(Boolean)))]
  const roles = ['all', ...Array.from(new Set(openShifts.map((s) => s.role).filter(Boolean)))]

  async function requestPickup(shift) {
    if (requestingShiftId) return
    setRequestingShiftId(shift.id)
    try {
      await realAPI.createSwap({ from_shift_id: shift.id, kind: 'pickup', reason: 'Picking up this shift' })
      setRequestModal({ ...shift, kind: 'pickup' })
      refresh()
    } catch (err) {
      toast.push(err.message || 'Could not request pickup', { tone: 'error' })
    } finally {
      setRequestingShiftId(null)
    }
  }

  async function handleAutoFill(shift) {
    if (autoFillShiftId) return
    setAutoFillShiftId(shift.id)
    try {
      const result = await realAPI.autoFillShift(shift.id)
      const name = result?.assigned_to?.name || 'best match'
      const score = result?.match_score ?? '—'
      toast.push(`Auto-assigned to ${name} (match: ${score}%)`, { tone: 'success' })
      setDrawerShift(null)
      refresh()
    } catch (err) {
      const msg = err?.message || 'Could not auto-fill'
      toast.push(msg, { tone: 'error' })
    } finally {
      setAutoFillShiftId(null)
    }
  }

  function handleDeleteShift(shift) {
    if (deletingShiftId) return
    setConfirmAction({ type: 'delete', shift, message: 'Delete this open shift? This cannot be undone.' })
  }

  async function executeConfirmAction() {
    if (!confirmAction) return
    const action = confirmAction
    setConfirmAction(null)

    if (action.type === 'delete') {
      const { shift } = action
      setDeletingShiftId(shift.id)
      try {
        await realAPI.deleteShift(shift.id)
        setDrawerShift(null)
        setEditShift(null)
        refresh()
        toast.push('Shift deleted', { tone: 'info' })
      } catch (err) {
        toast.push(err.message || 'Could not delete shift', { tone: 'error' })
      } finally {
        setDeletingShiftId(null)
      }
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    if (!editShift || savingEdit) return
    setSavingEdit(true)
    try {
      await realAPI.updateShift(editShift.id, {
        title: editShift.title,
        role: editShift.role || editShift.title,
        department: editShift.department,
        date: editShift.date,
        start_hour: Number(editShift.start_hour ?? editShift.startHour ?? 0),
        duration_hours: Number(editShift.duration_hours ?? editShift.durationHours ?? 8),
        urgency: editShift.urgency,
        eligible_count: Number(editShift.eligible_count ?? editShift.eligible ?? 0),
        description: editShift.description,
      })
      setDrawerShift({ ...editShift })
      setEditShift(null)
      refresh()
      toast.push('Shift updated', { tone: 'success' })
    } catch (err) {
      toast.push(err.message || 'Could not save shift', { tone: 'error' })
    } finally {
      setSavingEdit(false)
    }
  }

  const filtered = openShifts.filter((s) => {
    if (s.date < today().toISOString().slice(0, 10)) return false
    if (filter === 'high' && s.urgency !== 'high') return false
    if (filter === 'me' && (s.eligible_count || 0) <= 0) return false
    if (dept !== 'all' && s.department !== dept) return false
    if (role !== 'all' && s.role !== role) return false
    return true
  })

  useEffect(() => { setBrowsePage(1) }, [filter, dept, role])
  useEffect(() => {
    setBrowsePage(1); setRequestsPage(1)
  }, [tab])

  const BROWSE_PAGE_SIZE = 12
  const REQUESTS_PAGE_SIZE = 9
  const browsePageItems = filtered.slice((browsePage - 1) * BROWSE_PAGE_SIZE, browsePage * BROWSE_PAGE_SIZE)
  const employeeRequestsItems = myRequests.slice((requestsPage - 1) * REQUESTS_PAGE_SIZE, requestsPage * REQUESTS_PAGE_SIZE)

  const slotsRemaining = (s) => Math.max(0, (s.required_staff || 1) - ((s.assigned_staff || []).length))

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display-sm font-bold text-on-surface">
          Shift Marketplace
        </h1>
        {tab === 'requests' && myRequests.length > 0 && (
          <button
            onClick={() => { toast.push('Cleared request history', { tone: 'info' }) }}
            className="text-sm text-on-surface-variant hover:text-error transition-colors"
          >
            Clear history
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 bg-surface-variant/60 p-1 rounded-xl mb-5 w-fit overflow-x-auto">
        {pageTabs.map((t) => {
          const badge = t.id === 'requests' ? myRequests.length : 0
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg font-label-sm md:font-label-md text-label-sm md:text-label-md transition-all whitespace-nowrap ${
                tab === t.id
                  ? 'bg-surface shadow-soft-sm text-primary font-bold'
                  : 'text-on-surface-variant'
              }`}
            >
              {t.label}
              {badge > 0 && (
                <span className="ml-1.5 chip bg-primary/10 text-primary text-[10px]">{badge}</span>
              )}
            </button>
          )
        })}
      </div>

      {tab === 'browse' && (
        <section className="page-section">
          <Card hover={false}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 bg-surface-variant/60 p-1 rounded-xl">
                {[
                  { id: 'all', label: 'All shifts' },
                  { id: 'high', label: 'High urgency' },
                  ...(!isAdmin ? [{ id: 'me', label: 'Eligible for me' }] : []),
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg font-label-sm md:font-label-md text-label-sm md:text-label-md transition-all ${
                      filter === f.id
                        ? 'bg-surface shadow-soft-sm text-primary font-bold'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <Select value={dept} onChange={setDept} options={depts.map((d) => ({ value: d, label: d === 'all' ? 'All departments' : d }))} className="w-40" />
              <Select value={role} onChange={setRole} options={roles.map((r) => ({ value: r, label: r === 'all' ? 'All roles' : r }))} className="w-36" />
              <div className="flex-1" />
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {filtered.length} open shifts
              </span>
            </div>
          </Card>

          {loading ? (
            <ListSkeleton variant="grid" count={6} />
          ) : filtered.length === 0 ? (
            <EmptyState icon="event" title="No open shifts" description="No open shifts match your filters." />
          ) : (
            <div className="grid grid-cols-1 gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {browsePageItems.map((s) => {
                  const requested = myRequests.find((r) => r.from_shift_id === s.id)
                  const requiredStaff = s.required_staff || 1
                  const assignedCount = (s.assigned_staff || []).length
                  const queue = requests.filter(r => r.from_shift_id === s.id && r.status === 'pending')
                  const userQueuePosition = requested ? queue.findIndex(q => q.requester_id === currentUser?.id) + 1 : 0
                  const isFull = slotsRemaining(s) === 0

                  return (
                    <motion.div
                      key={s.id}
                      whileHover={requested || isFull ? {} : { y: -2 }}
                      onClick={() => setDrawerShift(s)}
                      className={requested || isFull ? '' : 'cursor-pointer'}
                    >
                      <Card hover={!requested && !isFull}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`w-2 h-2 rounded-full ${
                            isFull ? 'bg-error' : s.urgency === 'high' ? 'bg-error' : s.urgency === 'medium' ? 'bg-warning' : 'bg-info'
                          }`} />
                          <span className="font-label-sm text-label-sm text-on-surface-variant">{s.department}</span>
                          <div className="flex-1" />
                          {isFull ? (
                            <span className="chip bg-error/10 text-error text-[10px]">Full</span>
                          ) : requiredStaff > 1 ? (
                            <span className="chip bg-primary/10 text-primary text-[10px]">
                              {assignedCount}/{requiredStaff} filled
                            </span>
                          ) : requested ? (
                            <span className="chip bg-warning/10 text-warning text-[10px]">Requested</span>
                          ) : (
                            <span className={`chip text-[10px] ${
                              s.urgency === 'high' ? 'bg-error/10 text-error' : s.urgency === 'medium' ? 'bg-warning/10 text-warning' : 'bg-info/10 text-info'
                            }`}>{s.urgency || 'medium'}</span>
                          )}
                        </div>

                        <h3 className="font-headline-md text-lg font-bold text-on-surface">{s.role || s.title}</h3>

                        <div className="flex items-center gap-4 mt-3 text-sm text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                            {formatDateFull(s.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                            {timeLabel(s.start_hour)}–{timeLabel(s.start_hour + s.duration_hours)}
                          </span>
                        </div>

                        {queue.length > 0 && (
                          <div className="mt-3 p-2 rounded-lg bg-surface-variant/30">
                            <div className="font-label-sm text-label-sm text-on-surface-variant mb-1">
                              {queue.length} request{queue.length === 1 ? '' : 's'}
                            </div>
                            {userQueuePosition > 0 && (
                              <div className="font-label-sm text-label-sm text-primary font-semibold">
                                Your position: #{userQueuePosition}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                              {s.eligible_count || 0} eligible
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {isAdmin && !isFull && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleAutoFill(s) }}
                                disabled={autoFillShiftId === s.id}
                                title="Find the best free+qualified person and assign them automatically"
                                className="chip bg-secondary/15 text-secondary border border-secondary/30 hover:bg-secondary/25 transition-colors text-[10px] font-semibold flex items-center gap-1 disabled:opacity-60"
                              >
                                <span className="material-symbols-outlined text-[12px]">
                                  {autoFillShiftId === s.id ? 'progress_activity' : 'auto_awesome'}
                                </span>
                                {autoFillShiftId === s.id ? 'Filling…' : 'Auto-fill'}
                              </button>
                            )}
                            {isFull ? (
                              <span className="text-xs text-error flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">block</span> Full
                              </span>
                            ) : requested ? (
                              <span className="text-xs text-warning flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">hourglass_top</span> Pending
                              </span>
                            ) : (
                              <span className="text-xs text-primary flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">open_in_new</span> Details
                              </span>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
              <Pagination page={browsePage} pageSize={BROWSE_PAGE_SIZE} total={filtered.length} onChange={setBrowsePage} />
            </div>
          )}
        </section>
      )}

      {/* Employee: My requests */}
      {!isAdmin && tab === 'requests' && (
        <section className="page-section">
          {loading ? (
            <ListSkeleton variant="grid" count={6} />
          ) : myRequests.length === 0 ? (
            <EmptyState
              icon="assignment"
              title="No requests yet"
              description="Browse open shifts and take one — it'll appear here pending approval."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {employeeRequestsItems.map((req) => {
                const shift = openShifts.find(s => s.id === req.from_shift_id)
                const displayRole = shift?.role || req.role || 'Shift request'
                const displayDept = shift?.department || ''
                const displayDate = shift?.date || req.created_at
                const displayStart = shift?.start_hour || 0
                const displayDuration = shift?.duration_hours || 0
                return (
                  <Card key={req.id} hover={false}>
                    <div className="flex items-start justify-between mb-sm">
                      <div>
                        <Badge variant={req.status === 'pending' ? 'warning' : req.status === 'approved' ? 'success' : req.status === 'rejected' || req.status === 'declined' ? 'error' : 'warning'}>
                          {req.status === 'pending' ? 'Pending approval' : req.status === 'approved' ? 'Confirmed' : 'Declined'}
                        </Badge>
                        <h3 className="font-headline-md text-lg font-bold text-on-surface mt-sm">{displayRole}</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{displayDept}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-outline-variant/30">
                      <div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Date</div>
                        <div className="font-label-md text-label-md text-on-surface">{displayDate ? formatDate(displayDate) : '—'}</div>
                      </div>
                      <div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant">Time</div>
                        <div className="font-label-md text-label-md text-on-surface">
                          {timeLabel(displayStart)} · {displayDuration}h
                        </div>
                      </div>
                    </div>

                    {req.status === 'pending' && (
                      <div className="mt-4 flex items-center gap-2 bg-warning/5 border border-warning/20 rounded-xl px-3 py-2">
                        <span className="material-symbols-outlined text-warning text-[16px]">hourglass_top</span>
                        <span className="text-xs text-on-surface-variant">Awaiting manager approval — you'll be notified when it's confirmed</span>
                      </div>
                    )}
                    {req.status === 'approved' && (
                      <div className="mt-4 flex items-center gap-2 bg-success/5 border border-success/20 rounded-xl px-3 py-2">
                        <span className="material-symbols-outlined text-success text-[16px]">check_circle</span>
                        <span className="text-xs text-on-surface-variant">Confirmed — added to your schedule</span>
                      </div>
                    )}
                    {(req.status === 'declined' || req.status === 'rejected') && (
                      <div className="mt-4 flex items-center gap-2 bg-error/5 border border-error/20 rounded-xl px-3 py-2">
                        <span className="material-symbols-outlined text-error text-[16px]">cancel</span>
                        <span className="text-xs text-on-surface-variant">This request was declined</span>
                      </div>
                    )}
                  </Card>
                )
              })}
              <Pagination page={requestsPage} pageSize={REQUESTS_PAGE_SIZE} total={myRequests.length} onChange={setRequestsPage} />
            </div>
          )}
        </section>
      )}

      <Drawer
        open={!!drawerShift || !!editShift}
        onClose={() => { setDrawerShift(null); setEditShift(null) }}
        title={editShift ? 'Edit shift' : drawerShift ? (drawerShift.role || drawerShift.title) : 'Shift'}
        subtitle={drawerShift && !editShift ? `${drawerShift.department} · ${formatDate(drawerShift.date)}` : editShift ? `${editShift.department} · ${formatDate(editShift.date)}` : ''}
        width="w-[480px]"
      >
        {editShift && (
          <form onSubmit={handleSaveEdit} className="p-md space-y-md">
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Shift title / role</label>
              <input value={editShift.role || editShift.title || ''} onChange={(e) => setEditShift({ ...editShift, role: e.target.value, title: e.target.value })} className="input-base mt-xs w-full" />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Department</label>
              <input value={editShift.department || ''} onChange={(e) => setEditShift({ ...editShift, department: e.target.value })} className="input-base mt-xs w-full" />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Date</label>
              <input type="date" value={(editShift.date || today().toISOString()).slice(0, 10)} onChange={(e) => setEditShift({ ...editShift, date: e.target.value })} className="input-base mt-xs w-full" />
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant">Start hour</label>
                <Select value={String(editShift.start_hour ?? 0)} onChange={(v) => setEditShift({ ...editShift, start_hour: Number(v) })} options={Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: timeLabel(i) }))} className="w-full mt-xs" />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant">Duration (hours)</label>
                <Select value={String(editShift.duration_hours || 8)} onChange={(v) => setEditShift({ ...editShift, duration_hours: Number(v) })} options={[4, 6, 8, 10, 12, 16, 24].map(h => ({ value: String(h), label: `${h} hours` }))} className="w-full mt-xs" />
              </div>
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Urgency</label>
              <Select value={editShift.urgency || 'medium'} onChange={(v) => setEditShift({ ...editShift, urgency: v })} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} className="w-full mt-xs" />
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant">Eligible count</label>
                <input type="number" value={editShift.eligible_count || 0} onChange={(e) => setEditShift({ ...editShift, eligible_count: Number(e.target.value) })} className="input-base mt-xs w-full" />
              </div>
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Description</label>
              <textarea value={editShift.description || ''} onChange={(e) => setEditShift({ ...editShift, description: e.target.value })} className="input-base mt-xs w-full min-h-[80px] resize-none" />
            </div>
            <div className="flex items-center justify-end gap-sm pt-sm border-t border-outline-variant/30">
              <button type="button" onClick={() => setEditShift(null)} disabled={savingEdit} className="btn-ghost disabled:opacity-60">Cancel</button>
              <button type="submit" disabled={savingEdit} className="btn-primary disabled:opacity-60">
                {savingEdit ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        )}

        {drawerShift && !editShift && (() => {
          const req = myRequests.find((r) => r.from_shift_id === drawerShift.id)
          const requiredStaff = drawerShift.required_staff || 1
          const assignedCount = (drawerShift.assigned_staff || []).length
          const queue = requests.filter(r => r.from_shift_id === drawerShift.id && r.status === 'pending')
          const userQueuePosition = req ? queue.findIndex(q => q.requester_id === currentUser?.id) + 1 : 0
          const isFull = slotsRemaining(drawerShift) === 0
          return (
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isFull ? 'bg-error' : drawerShift.urgency === 'high' ? 'bg-error' : drawerShift.urgency === 'medium' ? 'bg-warning' : 'bg-info'}`} />
                <span className="font-label-sm text-label-sm text-on-surface-variant">{drawerShift.department}</span>
                <div className="flex-1" />
              </div>

              <div>
                <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">{drawerShift.role || drawerShift.title}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    {formatDateFull(drawerShift.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    {timeLabel(drawerShift.start_hour)}–{timeLabel(drawerShift.start_hour + drawerShift.duration_hours)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">hourglass_bottom</span>
                    {drawerShift.duration_hours}h
                  </span>
                </div>
              </div>

              {requiredStaff > 1 && (
                <div className={`rounded-xl p-4 ${isFull ? 'bg-error/5 border border-error/20' : 'bg-primary/5 border border-primary/20'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-label-md text-label-md font-bold text-on-surface">
                      {isFull ? 'Shift Full' : `${assignedCount}/${requiredStaff} slots filled`}
                    </div>
                    <div className={`chip text-xs ${isFull ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
                      {slotsRemaining(drawerShift)} slot{slotsRemaining(drawerShift) === 1 ? '' : 's'} remaining
                    </div>
                  </div>
                  <div className="w-full bg-surface-variant/60 rounded-full h-2 overflow-hidden">
                    <div className={`h-full transition-all ${isFull ? 'bg-error' : 'bg-primary'}`} style={{ width: `${(assignedCount / requiredStaff) * 100}%` }} />
                  </div>
                </div>
              )}

              {isAdmin ? (
                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => handleAutoFill(drawerShift)}
                    disabled={isFull || autoFillShiftId === drawerShift.id}
                    className="btn-primary w-full justify-center disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {autoFillShiftId === drawerShift.id ? 'progress_activity' : 'auto_awesome'}
                    </span>
                    {autoFillShiftId === drawerShift.id ? 'Auto-filling…' : isFull ? 'Shift is full' : 'Auto-fill (AI)'}
                  </button>
                  <p className="font-label-sm text-label-sm text-on-surface-variant text-center -mt-1">
                    Finds the best free+qualified person and assigns them in one click
                  </p>
                  <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/30">
                    <button onClick={() => setEditShift({ ...drawerShift })} className="btn-secondary flex-1 justify-center">
                      <span className="material-symbols-outlined text-[18px]">edit</span> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteShift(drawerShift)}
                      disabled={deletingShiftId === drawerShift.id}
                      className="btn-ghost flex-1 justify-center text-error hover:bg-error/10 disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      {deletingShiftId === drawerShift.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              ) : req ? (
                <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 text-center">
                  <span className="material-symbols-outlined text-warning text-[24px]">hourglass_top</span>
                  <p className="font-label-md text-label-md font-semibold text-on-surface mt-1">Already requested</p>
                  {userQueuePosition > 0 && (
                    <p className="text-xs text-primary font-semibold mt-1">Your position: #{userQueuePosition} of {queue.length}</p>
                  )}
                  <p className="text-xs text-on-surface-variant mt-1">Awaiting manager approval. Check <button onClick={() => { setDrawerShift(null); setTab('requests') }} className="text-primary underline">My requests</button> for status.</p>
                </div>
              ) : isFull ? (
                <div className="bg-error/5 border border-error/20 rounded-xl p-4 text-center">
                  <span className="material-symbols-outlined text-error text-[24px]">block</span>
                  <p className="font-label-md text-label-md font-semibold text-on-surface mt-1">Shift is full</p>
                  <p className="text-xs text-on-surface-variant mt-1">All slots have been filled or requested.</p>
                </div>
              ) : (
                <>
                  <div className="bg-surface-variant/40 rounded-xl p-4">
                    <div className="font-label-sm text-label-sm text-on-surface-variant mb-2">Your eligibility</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-on-surface">
                        <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                        Department match
                      </div>
                      <div className="flex items-center gap-2 text-sm text-on-surface">
                        <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                        {drawerShift.eligible_count || 0} other staff eligible for this shift
                      </div>
                      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">info</span>
                        {queue.length} already applied
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => requestPickup(drawerShift)}
                    disabled={requestingShiftId !== null}
                    className="btn-primary w-full justify-center disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[18px]">{requestingShiftId === drawerShift.id ? 'progress_activity' : 'check'}</span>
                    {requestingShiftId === drawerShift.id ? 'Requesting…' : 'Request pickup'}
                  </button>
                </>
              )}
            </div>
          )
        })()}
      </Drawer>

      {requestModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/40 z-[110] flex items-center justify-center p-4" onClick={() => setRequestModal(null)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-surface rounded-2xl p-6 md:p-xl max-w-md w-full shadow-soft-xl mx-4">
            <div className="w-12 h-12 rounded-full bg-warning/10 text-warning flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[24px]">hourglass_top</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold text-center">Pickup request submitted</h3>
            <p className="font-body-md text-body-md text-on-surface-variant text-center mt-sm">
              Your request for <strong>{requestModal.role || requestModal.title}</strong> on {formatDate(requestModal.date)} has been sent to your manager for approval.
            </p>
            <button onClick={() => { setRequestModal(null); setDrawerShift(null); navigate('/app/employee') }} className="btn-primary w-full justify-center mt-4">
              View my schedule
            </button>
            <button onClick={() => { setRequestModal(null); setDrawerShift(null) }} className="btn-secondary w-full justify-center mt-2">
              Keep browsing
            </button>
          </motion.div>
        </motion.div>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={executeConfirmAction}
        title="Delete shift?"
        message={confirmAction?.message || 'Are you sure?'}
        confirmLabel="Delete"
        tone="danger"
      />
    </>
  )
}
