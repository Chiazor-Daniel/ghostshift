import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, Badge, Avatar, Drawer, StatCard, Select, ListSkeleton } from '../components/ui.jsx'
import Calendar from '../components/Calendar.jsx'
import { useToast } from '../components/Toast.jsx'
import { realAPI } from '../services/realAPI.js'
import { formatDate, timeLabel, today } from '../data/store.js'
import { motion } from 'framer-motion'

const newShiftDefaults = () => ({
  role: '',
  department: '',
  date: today().toISOString().slice(0, 10),
  start_hour: 9,
  duration_hours: 8,
  urgency: 'medium',
  pay_differential: '+0%',
  certifications: [],
  eligible_count: 0,
  description: '',
  required_staff: 1,
})

export default function ManagerDashboard() {
  const toast = useToast()
  const [shifts, setShifts] = useState([])
  const [swaps, setSwaps] = useState([])
  const [employees, setEmployees] = useState([])
  const [depts, setDepts] = useState([])
  const [selectedShift, setSelectedShift] = useState(null)
  const [showNewShift, setShowNewShift] = useState(false)
  const [newShift, setNewShift] = useState(newShiftDefaults())
  const [loading, setLoading] = useState(false)
  const [deptFilter, setDeptFilter] = useState('all')

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    try {
      const [sh, sw, emps, dp] = await Promise.all([
        realAPI.getShifts(),
        realAPI.getSwaps(),
        realAPI.getEmployees(),
        realAPI.getDepartments(),
      ])
      setShifts(sh || [])
      setSwaps(sw || [])
      setEmployees(emps || [])
      setDepts(dp || [])
    } catch (err) {
      toast.push(err.message || 'Could not load', { tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => deptFilter === 'all' || s.department === deptFilter)
  }, [shifts, deptFilter])

  const gaps = useMemo(() => {
    return filteredShifts
      .filter((s) => s.status === 'open' || (s.required_staff || 1) > (s.assigned_staff || []).length)
      .map((s) => {
        const required = s.required_staff || 1
        const assigned = (s.assigned_staff || []).length
        const ratio = assigned / required
        const severity = ratio < 0.4 ? 'critical' : ratio < 0.7 ? 'high' : ratio < 1 ? 'medium' : 'low'
        return { ...s, severity }
      })
  }, [filteredShifts])

  const criticalGaps = gaps.filter((g) => g.severity === 'critical').length
  const pendingSwaps = swaps.filter((s) => s.status === 'pending')
  const upcomingShifts = filteredShifts
    .filter((s) => s.date >= today().toISOString().slice(0, 10) && s.status !== 'open')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 6)

  async function createShift(e) {
    e.preventDefault()
    if (!newShift.role || !newShift.department || !newShift.date) {
      toast.push('Fill in role, department, and date.', { tone: 'warning' })
      return
    }
    try {
      await realAPI.createShift({
        title: newShift.role,
        role: newShift.role,
        department: newShift.department,
        date: newShift.date,
        start_hour: Number(newShift.start_hour),
        duration_hours: Number(newShift.duration_hours),
        urgency: newShift.urgency,
        pay_differential: newShift.pay_differential,
        certifications: newShift.certifications,
        eligible_count: Number(newShift.eligible_count) || employees.filter((e) => e.department === newShift.department).length,
        description: newShift.description,
        required_staff: Number(newShift.required_staff) || 1,
        status: 'open',
        assigned_staff: [],
      })
      toast.push('Shift created and posted', { tone: 'success' })
      setShowNewShift(false)
      setNewShift({ ...newShiftDefaults(), department: newShift.department })
      try { await realAPI.logAudit({ action: 'create_shift', entity_type: 'shift' }) } catch {}
      refresh()
    } catch (err) {
      toast.push(err.message || 'Could not create shift', { tone: 'error' })
    }
  }

  async function decideSwap(swapId, status) {
    try {
      if (status === 'approved') await realAPI.approveSwap(swapId)
      else await realAPI.rejectSwap(swapId)
      toast.push(`Swap ${status}`, { tone: status === 'approved' ? 'success' : 'warning' })
      refresh()
    } catch (err) {
      toast.push(err.message || 'Could not update', { tone: 'error' })
    }
  }

  async function assignShiftToEmployee(shiftId, empId) {
    try {
      await realAPI.assignShift(shiftId, empId)
      toast.push('Shift assigned', { tone: 'success' })
      setSelectedShift(null)
      refresh()
    } catch (err) {
      toast.push(err.message || 'Could not assign', { tone: 'error' })
    }
  }

  async function deleteShift(shiftId) {
    if (!confirm('Delete this shift?')) return
    try {
      await realAPI.deleteShift(shiftId)
      setSelectedShift(null)
      toast.push('Shift deleted', { tone: 'info' })
      refresh()
    } catch (err) {
      toast.push(err.message || 'Could not delete', { tone: 'error' })
    }
  }

  const certList = ['BLS', 'ACLS', 'PALS', 'TNCC', 'NIHSS']

  return (
    <>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display-sm font-bold text-on-surface">Command Center</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {gaps.length > 0 ? `${gaps.length} shift${gaps.length === 1 ? '' : 's'} need coverage` : 'Schedule is healthy'} · {filteredShifts.length} shifts this period
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={deptFilter}
            onChange={setDeptFilter}
            options={[{ value: 'all', label: 'All departments' }, ...depts.map((d) => ({ value: d.name, label: d.name }))]}
            className="w-44"
          />
          <button onClick={() => setShowNewShift(true)} className="btn-primary">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New shift
          </button>
        </div>
      </div>

      <section className="page-section space-y-md">
        {loading && <ListSkeleton variant="card" count={3} />}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Open shifts" value={gaps.length.toString()} icon="event_available" />
          <StatCard label="Pending swaps" value={pendingSwaps.length.toString()} icon="swap_horiz" />
          <StatCard label="Active staff" value={employees.length.toString()} icon="groups" />
          <StatCard label="Critical gaps" value={criticalGaps.toString()} icon="monitor_heart" />
        </div>

        {/* Critical gaps */}
        {criticalGaps > 0 && (
          <Card hover={false}>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">priority_high</span>
              </span>
              <div>
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">{criticalGaps} critical gaps</h2>
                <p className="font-label-sm text-label-sm text-on-surface-variant">These shifts are understaffed — open the shifts list to fill them.</p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Pending swaps + Upcoming shifts */}
          <div className="lg:col-span-5 space-y-4 order-2 lg:order-1">
            <Card hover={false}>
              <CardHeader icon="swap_horiz" title="Pending swaps" subtitle={`${pendingSwaps.length} awaiting your call`} />
              {pendingSwaps.length === 0 ? (
                <div className="py-8 text-center text-on-surface-variant text-sm">All caught up.</div>
              ) : (
                <div className="space-y-2 mt-md">
                  {pendingSwaps.slice(0, 5).map((sw) => {
                    const requester = employees.find((e) => e.id === sw.requester_id)
                    const shift = shifts.find((s) => s.id === sw.from_shift_id)
                    return (
                      <div key={sw.id} className="flex items-center gap-md p-md rounded-lg border border-outline-variant/30 hover:border-primary/40 transition-colors">
                        <Avatar initials={(requester?.name || 'UN').split(' ').map((n) => n[0]).join('')} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="font-label-md text-label-md font-bold text-on-surface truncate">{requester?.name || 'Unknown'}</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant truncate">
                            {shift ? `${shift.role || shift.title} · ${formatDate(shift.date)}` : (sw.reason || 'Swap request')}
                          </div>
                        </div>
                        <button onClick={() => decideSwap(sw.id, 'rejected')} className="btn-ghost text-xs py-1.5 px-3 text-error">
                          Decline
                        </button>
                        <button onClick={() => decideSwap(sw.id, 'approved')} className="btn-primary text-xs py-1.5 px-3">
                          Approve
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Upcoming shifts */}
            <Card hover={false}>
              <CardHeader icon="event" title="Upcoming shifts" />
              {upcomingShifts.length === 0 ? (
                <div className="py-8 text-center text-on-surface-variant text-sm">No upcoming shifts in view.</div>
              ) : (
                <div className="space-y-2 mt-md">
                  {upcomingShifts.map((s) => {
                    const filled = (s.assigned_staff || []).length
                    const required = s.required_staff || 1
                    return (
                      <motion.button
                        key={s.id}
                        whileHover={{ x: 2 }}
                        onClick={() => setSelectedShift(s)}
                        className="w-full flex items-center gap-md p-md rounded-lg border border-outline-variant/30 hover:border-primary/40 transition-all text-left"
                      >
                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-[20px]">schedule</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-label-md text-label-md font-bold text-on-surface truncate">{s.role || s.title}</h3>
                          <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                            {formatDate(s.date)} · {timeLabel(s.start_hour)} · {s.department}
                          </p>
                        </div>
                        <Badge variant={filled >= required ? 'success' : 'warning'}>
                          {filled}/{required}
                        </Badge>
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Calendar — gets the wider column so Month/Week/Day view isn't squished */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <Card hover={false}>
              <CardHeader icon="calendar_month" title="Schedule view" subtitle="Click a date to see shifts" />
              <div className="mt-md">
                <Calendar
                  events={filteredShifts.map((s) => ({
                    ...s,
                    title: s.role || s.title,
                  }))}
                />
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* New shift drawer */}
      <Drawer open={showNewShift} onClose={() => setShowNewShift(false)} title="Create new shift" subtitle="Post it for staff to pick up">
        <form onSubmit={createShift} className="p-4 space-y-md">
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">Role</label>
            <input value={newShift.role} onChange={(e) => setNewShift({ ...newShift, role: e.target.value })} className="input-base mt-xs w-full" placeholder="e.g. Charge Nurse, ICU RN" />
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">Department</label>
            <Select value={newShift.department} onChange={(v) => setNewShift({ ...newShift, department: v })} options={depts.map((d) => ({ value: d.name, label: d.name }))} className="w-full mt-xs" placeholder="Select department" />
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">Date</label>
            <input type="date" value={newShift.date} onChange={(e) => setNewShift({ ...newShift, date: e.target.value })} className="input-base mt-xs w-full" />
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Start hour</label>
              <Select value={String(newShift.start_hour)} onChange={(v) => setNewShift({ ...newShift, start_hour: Number(v) })} options={Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: timeLabel(i) }))} className="w-full mt-xs" />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Duration (h)</label>
              <Select value={String(newShift.duration_hours)} onChange={(v) => setNewShift({ ...newShift, duration_hours: Number(v) })} options={[4, 6, 8, 10, 12, 16, 24].map((h) => ({ value: String(h), label: `${h} hours` }))} className="w-full mt-xs" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Urgency</label>
              <Select value={newShift.urgency} onChange={(v) => setNewShift({ ...newShift, urgency: v })} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} className="w-full mt-xs" />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Pay differential</label>
              <input value={newShift.pay_differential} onChange={(e) => setNewShift({ ...newShift, pay_differential: e.target.value })} className="input-base mt-xs w-full" placeholder="e.g. +25%" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Required staff</label>
              <input type="number" min={1} value={newShift.required_staff} onChange={(e) => setNewShift({ ...newShift, required_staff: Number(e.target.value) })} className="input-base mt-xs w-full" />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Eligible count</label>
              <input type="number" min={0} value={newShift.eligible_count} onChange={(e) => setNewShift({ ...newShift, eligible_count: Number(e.target.value) })} className="input-base mt-xs w-full" placeholder="Auto if empty" />
            </div>
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">Certifications (comma-separated)</label>
            <input value={(newShift.certifications || []).join(', ')} onChange={(e) => setNewShift({ ...newShift, certifications: e.target.value.split(',').map((c) => c.trim()).filter(Boolean) })} className="input-base mt-xs w-full" placeholder="BLS, ACLS" />
            <div className="flex flex-wrap gap-1 mt-1">
              {certList.map((c) => (
                <button key={c} type="button" onClick={() => {
                  const set = new Set(newShift.certifications || [])
                  if (set.has(c)) set.delete(c); else set.add(c)
                  setNewShift({ ...newShift, certifications: [...set] })
                }} className={`chip text-xs ${(newShift.certifications || []).includes(c) ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">Description</label>
            <textarea value={newShift.description} onChange={(e) => setNewShift({ ...newShift, description: e.target.value })} className="input-base mt-xs w-full min-h-[80px] resize-none" placeholder="Briefly describe what's needed" />
          </div>
          <div className="flex items-center justify-end gap-sm pt-sm border-t border-outline-variant/30">
            <button type="button" onClick={() => setShowNewShift(false)} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary">Create & post</button>
          </div>
        </form>
      </Drawer>

      {/* Shift details / actions */}
      <Drawer open={!!selectedShift} onClose={() => setSelectedShift(null)} title={selectedShift?.role || selectedShift?.title || ''} subtitle={selectedShift ? `${selectedShift.department} · ${formatDate(selectedShift.date)}` : ''}>
        {selectedShift && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Time</div>
                <div className="font-label-md text-label-md text-on-surface">{timeLabel(selectedShift.start_hour)} · {selectedShift.duration_hours}h</div>
              </div>
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Status</div>
                <Badge variant={selectedShift.status === 'open' ? 'warning' : 'success'}>{selectedShift.status}</Badge>
              </div>
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Staff</div>
                <div className="font-label-md text-label-md text-on-surface">{(selectedShift.assigned_staff || []).length}/{selectedShift.required_staff || 1}</div>
              </div>
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Urgency</div>
                <Badge variant={selectedShift.urgency === 'high' ? 'error' : selectedShift.urgency === 'medium' ? 'warning' : 'info'}>{selectedShift.urgency}</Badge>
              </div>
            </div>

            {employees.length > 0 && (
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant mb-2">Assign from team</div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {employees
                    .filter((e) => e.department === selectedShift.department || !selectedShift.department)
                    .map((e) => (
                      <button
                        key={e.id}
                        onClick={() => assignShiftToEmployee(selectedShift.id, e.id)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg border border-outline-variant/30 hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                      >
                        <Avatar initials={(e.name || 'U').split(' ').map((n) => n[0]).join('')} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="font-label-sm text-label-sm text-on-surface truncate">{e.name}</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant truncate">{e.department || '—'}</div>
                        </div>
                        <span className="material-symbols-outlined text-[16px] text-primary">person_add</span>
                      </button>
                    ))}
                </div>
              </div>
            )}

            <button onClick={() => deleteShift(selectedShift.id)} className="btn-ghost w-full justify-center text-error hover:bg-error/10">
              <span className="material-symbols-outlined text-[18px]">delete</span> Delete shift
            </button>
          </div>
        )}
      </Drawer>
    </>
  )
}