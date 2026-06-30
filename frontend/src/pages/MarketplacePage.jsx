import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { useUser } from '../layout/AppShell.jsx'
import { Card, Badge, Drawer, EmptyState, Select } from '../components/ui.jsx'
import { useToast } from '../components/Toast.jsx'
import { realAPI } from '../services/realAPI.js'
import { formatDate, timeLabel, today } from '../data/store.js'

const tabs = (admin) => [
  { id: 'browse', label: 'Browse shifts' },
  { id: 'requests', label: admin ? 'All requests' : 'My requests' },
]

export default function MarketplacePage() {
  const [searchParams] = useSearchParams()
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
  const toast = useToast()
  const { user: currentUser } = useUser()
  const isAdmin = currentUser?.role === 'admin'
  const pageTabs = tabs(isAdmin)

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    try {
      const [shifts, swaps] = await Promise.all([realAPI.getShifts(), realAPI.getSwaps()])
      setOpenShifts((shifts || []).filter(s => s.status === 'open'))
      setRequests(swaps || [])
    } catch (err) {
      toast.push(err.message || 'Could not load marketplace', { tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const myRequests = requests.filter((s) => s.requester_id === currentUser?.id)
  const allRequests = isAdmin ? requests : myRequests

  const depts = ['all', ...Array.from(new Set(openShifts.map((s) => s.department).filter(Boolean)))]
  const roles = ['all', ...Array.from(new Set(openShifts.map((s) => s.role).filter(Boolean)))]

  async function takeShift(shift) {
    try {
      const requiredStaff = shift.required_staff || 1
      const assignedCount = (shift.assigned_staff || []).length
      if (assignedCount >= requiredStaff) {
        toast.push('This shift is full. No slots available.', { tone: 'error' })
        return
      }
      const swap = await realAPI.createSwap({
        from_shift_id: shift.id,
        reason: `Requesting ${shift.role || shift.title} shift at ${shift.department}`,
      })
      const queue = requests.filter(r => r.from_shift_id === shift.id && r.status === 'pending')
      const position = queue.findIndex(q => q.id === swap.id) + 1
      setRequestModal({ ...shift, queuePosition: position, totalRequests: queue.length })
      refresh()
    } catch (err) {
      toast.push(err.message || 'Could not submit request', { tone: 'error' })
    }
  }

  async function handleDeleteShift(shift) {
    if (!confirm('Delete this open shift? This cannot be undone.')) return
    try {
      await realAPI.deleteShift(shift.id)
      setDrawerShift(null)
      setEditShift(null)
      refresh()
      toast.push('Shift deleted', { tone: 'info' })
    } catch (err) {
      toast.push(err.message || 'Could not delete shift', { tone: 'error' })
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    if (!editShift) return
    try {
      await realAPI.updateShift(editShift.id, {
        title: editShift.title,
        role: editShift.role || editShift.title,
        department: editShift.department,
        date: editShift.date,
        start_hour: Number(editShift.start_hour ?? editShift.startHour ?? 0),
        duration_hours: Number(editShift.duration_hours ?? editShift.durationHours ?? 8),
        urgency: editShift.urgency,
        pay_differential: editShift.pay_differential || editShift.payDifferential,
        eligible_count: Number(editShift.eligible_count ?? editShift.eligible ?? 0),
        description: editShift.description,
        certifications: editShift.certifications || [],
      })
      setDrawerShift({ ...editShift })
      setEditShift(null)
      refresh()
      toast.push('Shift updated', { tone: 'success' })
    } catch (err) {
      toast.push(err.message || 'Could not save shift', { tone: 'error' })
    }
  }

  const filtered = openShifts.filter((s) => {
    if (filter === 'high' && s.urgency !== 'high') return false
    if (filter === 'me' && (s.eligible_count || 0) <= 0) return false
    if (dept !== 'all' && s.department !== dept) return false
    if (role !== 'all' && s.role !== role) return false
    return true
  })

  const slotsRemaining = (s) => Math.max(0, (s.required_staff || 1) - ((s.assigned_staff || []).length))

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display-sm font-bold text-on-surface">Shift Marketplace</h1>
        {tab === 'requests' && myRequests.length > 0 && (
          <button
            onClick={() => { toast.push('Cleared request history', { tone: 'info' }) }}
            className="text-sm text-on-surface-variant hover:text-error transition-colors"
          >
            Clear history
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 bg-surface-variant/60 p-1 rounded-xl mb-5 w-fit">
        {pageTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg font-label-sm md:font-label-md text-label-sm md:text-label-md transition-all ${
              tab === t.id
                ? 'bg-surface shadow-soft-sm text-primary font-bold'
                : 'text-on-surface-variant'
            }`}
          >
            {t.label}
            {t.id === 'requests' && myRequests.length > 0 && !isAdmin && (
              <span className="ml-1.5 chip bg-primary/10 text-primary text-[10px]">{myRequests.length}</span>
            )}
          </button>
        ))}
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
            <div className="p-lg text-center text-on-surface-variant">Loading…</div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="storefront" title="No open shifts" description="No open shifts match your filters." />
          ) : (
            <div className="grid grid-cols-1 gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((s) => {
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
                            {new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                            {timeLabel(s.start_hour)}–{timeLabel(s.start_hour + s.duration_hours)}
                          </span>
                        </div>

                        {s.certifications?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {s.certifications.map((c) => (
                              <span key={c} className="chip bg-surface-variant text-on-surface-variant text-[10px]">{c}</span>
                            ))}
                          </div>
                        )}

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

                        <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {s.pay_differential && <span className="chip bg-primary/10 text-primary text-xs font-semibold">{s.pay_differential}</span>}
                            <span className="font-label-sm text-label-sm text-on-surface-variant">
                              {s.eligible_count || 0} eligible
                            </span>
                          </div>
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
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {tab === 'requests' && (
        <section className="page-section">
          {allRequests.length === 0 ? (
            <EmptyState
              icon="assignment"
              title="No requests yet"
              description={isAdmin ? 'No swap requests have been submitted yet.' : "Browse open shifts and take one — it'll appear here pending approval."}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allRequests.map((req) => {
                const shift = openShifts.find(s => s.id === req.from_shift_id)
                const displayRole = shift?.role || req.role || 'Shift request'
                const displayDept = shift?.department || ''
                const displayDate = shift?.date || req.submitted_at || req.submittedAt
                const displayStart = shift?.start_hour || 0
                const displayDuration = shift?.duration_hours || 0
                const displayPay = shift?.pay_differential || ''
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
                      <div className="text-right">
                        <div className="font-headline-md text-headline-md font-bold text-primary leading-none">{displayPay}</div>
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
                <label className="font-label-sm text-label-sm text-on-surface-variant">Pay differential</label>
                <input value={editShift.pay_differential || ''} onChange={(e) => setEditShift({ ...editShift, pay_differential: e.target.value })} className="input-base mt-xs w-full" placeholder="e.g. +20%" />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant">Eligible count</label>
                <input type="number" value={editShift.eligible_count || 0} onChange={(e) => setEditShift({ ...editShift, eligible_count: Number(e.target.value) })} className="input-base mt-xs w-full" />
              </div>
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Certifications (comma-separated)</label>
              <input value={(editShift.certifications || []).join(', ')} onChange={(e) => setEditShift({ ...editShift, certifications: e.target.value.split(',').map(c => c.trim()).filter(Boolean) })} className="input-base mt-xs w-full" placeholder="BLS, ACLS" />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Description</label>
              <textarea value={editShift.description || ''} onChange={(e) => setEditShift({ ...editShift, description: e.target.value })} className="input-base mt-xs w-full min-h-[80px] resize-none" />
            </div>
            <div className="flex items-center justify-end gap-sm pt-sm border-t border-outline-variant/30">
              <button type="button" onClick={() => setEditShift(null)} className="btn-ghost">Cancel</button>
              <button type="submit" className="btn-primary">Save changes</button>
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
                {drawerShift.pay_differential && <span className="chip bg-primary/10 text-primary text-xs font-semibold">{drawerShift.pay_differential}</span>}
              </div>

              <div>
                <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">{drawerShift.role || drawerShift.title}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    {new Date(drawerShift.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
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

              {drawerShift.certifications?.length > 0 && (
                <div className="bg-surface-variant/40 rounded-xl p-4">
                  <div className="font-label-sm text-label-sm text-on-surface-variant mb-2">Required certifications</div>
                  <div className="flex flex-wrap gap-1">
                    {drawerShift.certifications.map((c) => (
                      <span key={c} className="chip bg-success/10 text-success text-xs">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {isAdmin ? (
                <div className="space-y-3 pt-2">
                  <button onClick={() => setEditShift({ ...drawerShift })} className="btn-secondary w-full justify-center">
                    <span className="material-symbols-outlined text-[18px]">edit</span> Edit shift
                  </button>
                  <button onClick={() => handleDeleteShift(drawerShift)} className="btn-ghost w-full justify-center text-error hover:bg-error/10">
                    <span className="material-symbols-outlined text-[18px]">delete</span> Delete shift
                  </button>
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
                  <button onClick={() => takeShift(drawerShift)} className="btn-primary w-full justify-center">
                    <span className="material-symbols-outlined text-[18px]">check</span> Request this shift
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
            <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[24px]">check_circle</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold text-center">Request submitted</h3>
            <p className="font-body-md text-body-md text-on-surface-variant text-center mt-sm">
              Your request for <strong>{requestModal.role || requestModal.title}</strong> on {formatDate(requestModal.date)} has been sent to your manager.
            </p>
            <button onClick={() => { setRequestModal(null); setDrawerShift(null); setTab('requests') }} className="btn-primary w-full justify-center mt-4">
              View my requests
            </button>
            <button onClick={() => { setRequestModal(null); setDrawerShift(null) }} className="btn-secondary w-full justify-center mt-2">
              Keep browsing
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}