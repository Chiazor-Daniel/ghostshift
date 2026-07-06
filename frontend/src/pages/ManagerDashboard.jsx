import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, Badge, Avatar, Drawer, StatCard, Select, ListSkeleton, RichListItem } from '../components/ui.jsx'
import Calendar from '../components/Calendar.jsx'
import { useToast } from '../components/Toast.jsx'
import { realAPI } from '../services/realAPI.js'
import { formatDate, timeLabel, today } from '../data/store.js'
import { isShiftOpen, isShiftUpcoming, needsCoverage } from '../lib/shiftUtils.js'
import { useDebouncedRefresh } from '../hooks/useDebouncedRefresh.js'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { motion } from 'framer-motion'

const newShiftDefaults = () => ({
  role: '',
  department: '',
  date: today().toISOString().slice(0, 10),
  start_hour: 9,
  duration_hours: 8,
  urgency: 'medium',
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
  const [leaves, setLeaves] = useState([])
  const [deptFilter, setDeptFilter] = useState('all')
  // Per-action busy flags — prevent double-clicks on async buttons.
  const [creatingShift, setCreatingShift] = useState(false)
  const [assigningShiftId, setAssigningShiftId] = useState(null)
  const [deletingShiftId, setDeletingShiftId] = useState(null)

  useEffect(() => {
    refresh()
  }, [])

  useDebouncedRefresh(refresh)

  async function refresh(opts = {}) {
    const silent = opts?.silent === true
    const hasData = shifts.length > 0
    if (!silent && !hasData) setLoading(true)
    try {
      const [sh, sw, emps, dp, lv] = await Promise.all([
        realAPI.getShifts(),
        realAPI.getSwaps(),
        realAPI.getEmployees(),
        realAPI.getDepartments(),
        realAPI.getLeaves(),
      ])
      setShifts(sh || [])
      setSwaps(sw || [])
      setEmployees(emps || [])
      setDepts(dp || [])
      setLeaves(lv || [])
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
      .filter((s) => needsCoverage(s))
      .map((s) => {
        const required = s.required_staff || 1
        const assigned = (s.assigned_staff || []).length
        const ratio = assigned / required
        const severity = ratio < 0.4 ? 'critical' : ratio < 0.7 ? 'high' : ratio < 1 ? 'medium' : 'low'
        return { ...s, severity }
      })
  }, [filteredShifts])

  const openShiftCount = useMemo(
    () => filteredShifts.filter((s) => isShiftOpen(s)).length,
    [filteredShifts],
  )

  const coverageData = useMemo(() => {
    const filled = filteredShifts.filter((s) => !isShiftOpen(s)).length
    const open = openShiftCount
    if (filled === 0 && open === 0) {
      return [{ name: 'No data', value: 1, color: '#94a3b8' }]
    }
    return [
      { name: 'Filled', value: filled, color: '#22c55e' },
      { name: 'Open', value: open, color: '#ef4444' },
    ]
  }, [filteredShifts, openShiftCount])

  const deptCoverage = useMemo(() => {
    const map = {}
    filteredShifts.forEach((s) => {
      const dept = s.department || 'Other'
      if (!map[dept]) map[dept] = { department: dept, filled: 0, open: 0 }
      if (isShiftOpen(s)) map[dept].open++
      else map[dept].filled++
    })
    return Object.values(map)
  }, [filteredShifts])

  const pendingSwaps = swaps.filter((s) => s.status === 'pending' && s.kind === 'swap')
  const pendingLeaves = leaves.filter((l) => l.status === 'pending')
  const upcomingShifts = filteredShifts
    .filter((s) => isShiftUpcoming(s, today().toISOString().slice(0, 10)))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10)

  async function createShift(e) {
    e.preventDefault()
    if (creatingShift) return
    if (!newShift.role || !newShift.department || !newShift.date) {
      toast.push('Fill in role, department, and date.', { tone: 'warning' })
      return
    }
    setCreatingShift(true)
    try {
      await realAPI.createShift({
        title: newShift.role,
        role: newShift.role,
        department: newShift.department,
        date: newShift.date,
        start_hour: Number(newShift.start_hour),
        duration_hours: Number(newShift.duration_hours),
        urgency: newShift.urgency,
        eligible_count: Number(newShift.eligible_count) || employees.filter((e) => e.role !== 'admin' && e.department === newShift.department).length,
        description: newShift.description,
        required_staff: Number(newShift.required_staff) || 1,
        status: 'open',
        assigned_staff: [],
      })
      toast.push('Shift created and posted', { tone: 'success' })
      setShowNewShift(false)
      // Preserve date and department for rapid shift creation
      setNewShift({ ...newShiftDefaults(), department: newShift.department, date: newShift.date })
      try { await realAPI.logAudit({ action: 'create_shift', entity_type: 'shift' }) } catch {}
      refresh()
    } catch (err) {
      toast.push(err.message || 'Could not create shift', { tone: 'error' })
    } finally {
      setCreatingShift(false)
    }
  }

  async function assignShiftToEmployee(shiftId, empId) {
    if (assigningShiftId) return
    setAssigningShiftId(shiftId)
    try {
      await realAPI.assignShift(shiftId, empId)
      toast.push('Shift assigned', { tone: 'success' })
      setSelectedShift(null)
      refresh()
    } catch (err) {
      toast.push(err.message || 'Could not assign', { tone: 'error' })
    } finally {
      setAssigningShiftId(null)
    }
  }

  async function deleteShift(shiftId) {
    if (deletingShiftId) return
    if (!confirm('Delete this shift?')) return
    setDeletingShiftId(shiftId)
    try {
      await realAPI.deleteShift(shiftId)
      setSelectedShift(null)
      toast.push('Shift deleted', { tone: 'info' })
      refresh()
    } catch (err) {
      toast.push(err.message || 'Could not delete', { tone: 'error' })
    } finally {
      setDeletingShiftId(null)
    }
  }

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
        {loading && shifts.length === 0 && <ListSkeleton variant="card" count={3} />}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Open shifts" value={openShiftCount.toString()} icon="event_available" />
          <StatCard label="Swap requests" value={pendingSwaps.length.toString()} icon="swap_horiz" />
          <StatCard label="Leave requests" value={pendingLeaves.length.toString()} icon="event_busy" />
          <StatCard label="Active staff" value={employees.filter((e) => e.role !== 'admin').length.toString()} icon="groups" />
        </div>

        {/* Coverage chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4">
            <Card hover={false}>
              <CardHeader icon="donut_large" title="Coverage" subtitle="Filled vs open" />
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={coverageData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" startAngle={90} endAngle={-270}>
                      {coverageData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
          <div className="lg:col-span-8">
            <Card hover={false}>
              <CardHeader icon="bar_chart" title="By department" subtitle="Filled vs open per department" />
              <div className="h-56 overflow-y-auto space-y-3 px-1">
                {deptCoverage.length > 0 ? (
                  deptCoverage.map((d) => {
                    const total = d.filled + d.open
                    const pct = total > 0 ? Math.round((d.filled / total) * 100) : 0
                    return (
                      <div key={d.department}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium text-on-surface">{d.department}</span>
                          <span className="text-on-surface-variant">{d.filled}/{total} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="h-full flex items-center justify-center text-on-surface-variant text-sm">No department data yet</div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Calendar + upcoming shifts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8">
            <Card hover={false}>
              <CardHeader icon="calendar_month" title="Schedule view" subtitle="Click a date to see shifts" />
              <div className="mt-md min-h-[500px]">
                <Calendar
                  events={filteredShifts.map((s) => ({
                    ...s,
                    title: s.role || s.title,
                  }))}
                />
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4">
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
                      <RichListItem
                        key={s.id}
                        icon="schedule"
                        title={s.role || s.title}
                        subtitle={`${formatDate(s.date)} · ${timeLabel(s.start_hour)} · ${s.department}`}
                        status={{ variant: filled >= required ? 'success' : 'warning', label: `${filled}/${required}` }}
                        onClick={() => setSelectedShift(s)}
                      />
                    )
                  })}
                </div>
              )}
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
          <div className="grid grid-cols-3 gap-md">
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Urgency</label>
              <Select value={newShift.urgency} onChange={(v) => setNewShift({ ...newShift, urgency: v })} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} className="w-full mt-xs" />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Required staff</label>
              <input 
                type="number" 
                min={1} 
                value={newShift.required_staff || 1} 
                onChange={(e) => setNewShift({ ...newShift, required_staff: Math.max(1, Number(e.target.value) || 1) })} 
                className="input-base mt-xs w-full" 
              />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Eligible count</label>
              <input type="number" min={0} value={newShift.eligible_count} onChange={(e) => setNewShift({ ...newShift, eligible_count: Number(e.target.value) })} className="input-base mt-xs w-full" placeholder="Auto if empty" />
            </div>
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">Description</label>
            <textarea value={newShift.description} onChange={(e) => setNewShift({ ...newShift, description: e.target.value })} className="input-base mt-xs w-full min-h-[80px] resize-none" placeholder="Briefly describe what's needed" />
          </div>
          <div className="flex items-center justify-end gap-sm pt-sm border-t border-outline-variant/30">
            <button type="button" onClick={() => setShowNewShift(false)} disabled={creatingShift} className="btn-ghost disabled:opacity-60">Cancel</button>
            <button type="submit" disabled={creatingShift} className="btn-primary disabled:opacity-60">
              {creatingShift ? 'Posting…' : 'Create & post'}
            </button>
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
                    .map((e) => {
                      const isAssigning = assigningShiftId === selectedShift.id
                      return (
                        <button
                          key={e.id}
                          onClick={() => assignShiftToEmployee(selectedShift.id, e.id)}
                          disabled={isAssigning}
                          className="w-full flex items-center gap-2 p-2 rounded-lg border border-outline-variant/30 hover:border-primary/40 hover:bg-primary/5 transition-all text-left disabled:opacity-60"
                        >
                          <Avatar initials={(e.name || 'U').split(' ').map((n) => n[0]).join('')} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="font-label-sm text-label-sm text-on-surface truncate">{e.name}</div>
                            <div className="font-label-sm text-label-sm text-on-surface-variant truncate">{e.department || '—'}</div>
                          </div>
                          <span className="material-symbols-outlined text-[16px] text-primary">{isAssigning ? 'progress_activity' : 'person_add'}</span>
                        </button>
                      )
                    })}
                </div>
              </div>
            )}

            <button
              onClick={() => deleteShift(selectedShift.id)}
              disabled={deletingShiftId === selectedShift.id}
              className="btn-ghost w-full justify-center text-error hover:bg-error/10 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              {deletingShiftId === selectedShift.id ? 'Deleting…' : 'Delete shift'}
            </button>
          </div>
        )}
      </Drawer>
    </>
  )
}