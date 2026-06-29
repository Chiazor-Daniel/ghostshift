import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, Badge, Avatar, Drawer, StatCard, Select } from '../components/ui.jsx'
import Calendar from '../components/Calendar.jsx'
import { useToast } from '../components/Toast.jsx'
import {
  getShifts, getShift, addShift, assignShift,
  getSwaps, getPendingSwaps, approveSwap, declineSwap,
  getEmployees, getEmployee,
  computeBurnout, computeCoverageGaps, findCandidates, computeMatchScore,
  getCertExpiryAlerts, publishSchedule, computeAbsenteeTrends, computePeakHourRisks,
  formatDate, formatDateFull, timeLabel,
} from '../data/store.js'

export default function ManagerDashboard() {
  const toast = useToast()
  const [shifts, setShifts] = useState(() => getShifts())
  const [swaps, setSwaps] = useState(() => getSwaps())
  const [dept, setDept] = useState('all')
  const [selectedShift, setSelectedShift] = useState(null)
  const [showNewShift, setShowNewShift] = useState(false)
  const [newShift, setNewShift] = useState({
    department: '', title: '', date: '', startHour: '9', durationHours: '8',
    certs: '', notes: '', urgency: 'medium', payDifferential: '+0%', eligible: '', description: '',
    trainingCredit: false, seniorityPreference: 'none',
  })

  const refresh = () => { setShifts(getShifts()); setSwaps(getSwaps()) }

  const gaps = useMemo(() => computeCoverageGaps(), [shifts])
  const criticalGaps = gaps.filter(g => g.severity === 'critical').length
  const allEmployees = useMemo(() => getEmployees(), [])
  const certAlerts = useMemo(() => getCertExpiryAlerts(), [])
  const absenteeAlerts = useMemo(() => computeAbsenteeTrends(), [])
  const peakRisks = useMemo(() => computePeakHourRisks(), [])
  const draftCount = shifts.filter(s => s.status === 'draft').length
  const openCount = shifts.filter(s => s.status === 'open').length
  const activeCount = shifts.filter(s => s.status === 'active').length

  const deptList = useMemo(() => [...new Set(shifts.map(s => s.department).filter(Boolean))], [shifts])

  const stats = [
    { label: 'Open shifts', value: String(openCount), change: `${activeCount} filled`, changeType: 'up', icon: 'warning' },
    { label: 'Team members', value: String(allEmployees.length), change: 'Active roster', changeType: 'down', icon: 'group' },
    { label: 'Coverage gaps', value: String(criticalGaps), change: `${gaps.length} total`, changeType: criticalGaps > 0 ? 'up' : 'down', icon: 'monitor_heart' },
    { label: 'Pending swaps', value: String(swaps.filter(s => s.status === 'pending').length), change: 'Awaiting review', changeType: 'up', icon: 'bolt' },
  ]

  function handlePublishShift(asDraft) {
    if (!newShift.department || !newShift.title || !newShift.date) {
      toast.push('Fill in department, title, and date', { tone: 'warning' })
      return
    }
    addShift({
      title: newShift.title,
      department: newShift.department,
      date: newShift.date,
      startHour: Number(newShift.startHour),
      durationHours: Number(newShift.durationHours),
      certifications: newShift.certs ? newShift.certs.split(',').map(c => c.trim()) : [],
      notes: newShift.notes,
      urgency: newShift.urgency,
      payDifferential: newShift.payDifferential || '+0%',
      eligible: Number(newShift.eligible) || 0,
      description: newShift.description || newShift.notes || `${newShift.title} shift`,
      status: asDraft ? 'draft' : 'open',
      trainingCredit: newShift.trainingCredit,
      seniorityPreference: newShift.seniorityPreference,
    })
    toast.push(asDraft ? `Draft saved · ${newShift.title}` : `Shift created · ${newShift.title} · ${formatDateFull(newShift.date)}`, { tone: 'success' })
    setShowNewShift(false)
    setNewShift({
      department: '', title: '', date: '', startHour: '9', durationHours: '8',
      certs: '', notes: '', urgency: 'medium', payDifferential: '+0%', eligible: '', description: '',
      trainingCredit: false, seniorityPreference: 'none',
    })
    refresh()
  }

  const filteredShifts = useMemo(() =>
    shifts.filter(s => dept === 'all' || s.department === dept),
  [shifts, dept])

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display-sm font-bold text-on-surface">Dashboard</h1>
        <div className="flex items-center gap-sm">
          {draftCount > 0 && (
            <button onClick={() => {
              const count = publishSchedule()
              toast.push(`${count} shift${count === 1 ? '' : 's'} published to schedule`, { tone: 'success' })
              refresh()
            }} className="btn-secondary">
              <span className="material-symbols-outlined text-[18px]">publish</span>
              Publish {draftCount} draft{draftCount === 1 ? '' : 's'}
            </button>
          )}
          <button onClick={() => setShowNewShift(true)} className="btn-primary">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New shift
          </button>
        </div>
      </div>

      {/* Staffing alerts */}
      {criticalGaps > 0 && (
        <div className="mb-4 rounded-xl bg-error/5 border border-error/20 p-md flex items-start gap-sm">
          <span className="material-symbols-outlined text-error text-[20px] flex-shrink-0">warning</span>
          <div>
            <div className="font-label-md text-label-md font-bold text-error">{criticalGaps} dept{criticalGaps > 1 ? 's' : ''} critically understaffed</div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{gaps.map(g => `${g.department} · ${g.day} (${g.staffed}/${g.needed})`).join('  ·  ')}</p>
          </div>
        </div>
      )}

      {certAlerts.length > 0 && (
        <div className="mb-4 rounded-xl bg-warning/5 border border-warning/20 p-md flex items-start gap-sm">
          <span className="material-symbols-outlined text-warning text-[20px] flex-shrink-0">verified_user</span>
          <div className="flex-1">
            <div className="font-label-md text-label-md font-bold text-warning">{certAlerts.length} certification{certAlerts.length === 1 ? '' : 's'} expiring soon</div>
            <div className="mt-2 space-y-1">
              {certAlerts.slice(0, 3).map((a) => (
                <div key={`${a.employeeId}-${a.cert}`} className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${a.severity === 'critical' ? 'bg-error' : a.severity === 'high' ? 'bg-warning' : 'bg-info'}`} />
                  {a.employeeName} — {a.cert} expires in {a.daysUntil} day{a.daysUntil === 1 ? '' : 's'}
                </div>
              ))}
              {certAlerts.length > 3 && (
                <div className="font-body-sm text-body-sm text-primary font-semibold">+{certAlerts.length - 3} more</div>
              )}
            </div>
          </div>
        </div>
      )}

      {absenteeAlerts.length > 0 && (
        <div className="mb-4 rounded-xl bg-error/5 border border-error/20 p-md flex items-start gap-sm">
          <span className="material-symbols-outlined text-error text-[20px] flex-shrink-0">person_off</span>
          <div className="flex-1">
            <div className="font-label-md text-label-md font-bold text-error">{absenteeAlerts.length} unusual absentee trend{absenteeAlerts.length === 1 ? '' : 's'}</div>
            <div className="mt-2 space-y-1">
              {absenteeAlerts.slice(0, 3).map((a) => (
                <div key={a.employeeId} className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${a.severity === 'critical' ? 'bg-error' : 'bg-warning'}`} />
                  {a.employeeName} — {a.absenceRate}% absence rate, {a.lateRate}% late ({a.trend})
                </div>
              ))}
              {absenteeAlerts.length > 3 && (
                <div className="font-body-sm text-body-sm text-primary font-semibold">+{absenteeAlerts.length - 3} more</div>
              )}
            </div>
          </div>
        </div>
      )}

      {peakRisks.length > 0 && (
        <div className="mb-4 rounded-xl bg-warning/5 border border-warning/20 p-md flex items-start gap-sm">
          <span className="material-symbols-outlined text-warning text-[20px] flex-shrink-0">schedule</span>
          <div className="flex-1">
            <div className="font-label-md text-label-md font-bold text-warning">{peakRisks.length} peak-hour risk{peakRisks.length === 1 ? '' : 's'} detected</div>
            <div className="mt-2 space-y-1">
              {peakRisks.slice(0, 3).map((r) => (
                <div key={r.hour} className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${r.severity === 'critical' ? 'bg-error' : 'bg-warning'}`} />
                  {r.label} — {r.staffed}/{r.needed} staffed ({r.departments.slice(0, 2).join(', ')})
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <section className="page-section">
        <div className="responsive-grid">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <Card className="col-span-1 xl:col-span-8 p-0 overflow-hidden" hover={false}>
            <Calendar
              events={filteredShifts}
              onSelectEvent={setSelectedShift}
              initialView="month"
              headerExtra={
                <Select value={dept} onChange={setDept}
                  options={[{ value: 'all', label: 'All depts' }, ...deptList.map(d => ({ value: d, label: d }))]}
                  className="w-32" />
              }
            />
          </Card>
          <SidePanels shifts={shifts} swaps={swaps} refresh={refresh} />
        </div>
      </section>

      <Drawer open={!!selectedShift} onClose={() => setSelectedShift(null)}
        title="Shift details" subtitle={selectedShift ? `${selectedShift.department} · ${formatDate(selectedShift.date)}` : ''}>
        {selectedShift && <ShiftDetails shift={selectedShift} refresh={refresh} />}
      </Drawer>

      <Drawer open={showNewShift} onClose={() => setShowNewShift(false)}
        title="Create shift" subtitle="Add an open shift to the schedule">
        <div className="p-md space-y-md">
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">Department</label>
            <Select value={newShift.department} onChange={(v) => setNewShift(s => ({ ...s, department: v }))}
              options={[{ value: '', label: 'Select department' }, ...deptList.map(d => ({ value: d, label: d }))]}
              className="w-full mt-xs" />
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">Shift title / role</label>
            <input value={newShift.title} onChange={(e) => setNewShift(s => ({ ...s, title: e.target.value }))}
              className="input-base mt-xs" placeholder="e.g. Emergency · RN Day" />
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">Date</label>
            <input type="date" value={newShift.date} onChange={(e) => setNewShift(s => ({ ...s, date: e.target.value }))}
              className="input-base mt-xs" />
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Start time</label>
              <Select value={newShift.startHour} onChange={(v) => setNewShift(s => ({ ...s, startHour: v }))}
                options={Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: timeLabel(i) }))}
                className="w-full mt-xs" />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Duration</label>
              <Select value={newShift.durationHours} onChange={(v) => setNewShift(s => ({ ...s, durationHours: v }))}
                options={[4, 6, 8, 10, 12, 16, 24].map(h => ({ value: String(h), label: `${h} hours` }))}
                className="w-full mt-xs" />
            </div>
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">Required certifications (comma-separated)</label>
            <input value={newShift.certs} onChange={(e) => setNewShift(s => ({ ...s, certs: e.target.value }))}
              className="input-base mt-xs" placeholder="e.g. BLS, ACLS" />
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">Notes (optional)</label>
            <textarea value={newShift.notes} onChange={(e) => setNewShift(s => ({ ...s, notes: e.target.value }))}
              className="input-base mt-xs min-h-[80px] resize-none" placeholder="Any special requirements" />
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">Urgency</label>
            <Select value={newShift.urgency} onChange={(v) => setNewShift(s => ({ ...s, urgency: v }))}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
              className="w-full mt-xs" />
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Pay differential</label>
              <input value={newShift.payDifferential} onChange={(e) => setNewShift(s => ({ ...s, payDifferential: e.target.value }))}
                className="input-base mt-xs" placeholder="e.g. +20%" />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Eligible employees</label>
              <input type="number" value={newShift.eligible} onChange={(e) => setNewShift(s => ({ ...s, eligible: e.target.value }))}
                className="input-base mt-xs" placeholder="e.g. 5" />
            </div>
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">Description</label>
            <textarea value={newShift.description} onChange={(e) => setNewShift(s => ({ ...s, description: e.target.value }))}
              className="input-base mt-xs min-h-[60px] resize-none" placeholder="Brief description for marketplace" />
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Training credit</label>
              <Select value={newShift.trainingCredit ? 'yes' : 'no'} onChange={(v) => setNewShift(s => ({ ...s, trainingCredit: v === 'yes' }))}
                options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes — counts toward CE hours' }]}
                className="w-full mt-xs" />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Seniority preference</label>
              <Select value={newShift.seniorityPreference} onChange={(v) => setNewShift(s => ({ ...s, seniorityPreference: v }))}
                options={[{ value: 'none', label: 'None' }, { value: 'prefer', label: 'Prefer senior staff' }, { value: 'require', label: 'Require 1+ year' }]}
                className="w-full mt-xs" />
            </div>
          </div>
          <div className="flex items-center gap-sm">
            <button onClick={() => handlePublishShift(true)} className="btn-secondary flex-1 justify-center">
              <span className="material-symbols-outlined text-[18px]">draft</span>
              Save as draft
            </button>
            <button onClick={() => handlePublishShift(false)} className="btn-primary flex-1 justify-center">
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Publish shift
            </button>
          </div>
        </div>
      </Drawer>
    </>
  )
}

function SidePanels({ shifts, swaps, refresh }) {
  const toast = useToast()
  const employees = useMemo(() => getEmployees(), [])
  const openShifts = shifts.filter(s => s.status === 'open')
  const candidateShift = openShifts[0]
  const candidates = useMemo(() => {
    if (!candidateShift) return []
    return findCandidates(candidateShift.id, 5)
  }, [candidateShift])

  function handleApprove(swapId) {
    const result = approveSwap(swapId)
    if (result?.error) {
      toast.push(result.error, { tone: 'error' })
      return
    }
    toast.push('Swap approved — shift reassigned', { tone: 'success' })
    refresh()
  }

  function handleDecline(swapId) {
    declineSwap(swapId)
    toast.push('Swap declined', { tone: 'warning' })
    refresh()
  }

  const pending = swaps.filter(s => s.status === 'pending')
  const autoApprove = pending.filter(s => s.matchScore >= 85)
  const manualReview = pending.filter(s => s.matchScore < 85 && s.matchScore >= 60)
  const conflicts = pending.filter(s => s.matchScore < 60)

  function handleBulkApprove() {
    if (autoApprove.length === 0) {
      toast.push('No requests to auto-approve', { tone: 'info' })
      return
    }
    let approved = 0
    let blocked = 0
    autoApprove.forEach(s => {
      const result = approveSwap(s.id)
      if (result?.error) blocked++
      else approved++
    })
    refresh()
    if (blocked > 0) {
      toast.push(`Approved ${approved}, blocked ${blocked} (conflict or hour limit)`, { tone: 'warning' })
    } else {
      toast.push(`Auto-approved ${approved} request${approved === 1 ? '' : 's'}`, { tone: 'success' })
    }
  }

  return (
    <div className="col-span-1 xl:col-span-4 space-y-4">
      {candidateShift && (
        <Card hover={false}>
          <CardHeader icon="smart_toy" title="AI candidate match"
            subtitle={`Top matches for ${candidateShift.department} · ${formatDate(candidateShift.date)}`} />
          <div className="space-y-sm">
            {candidates.length === 0 && <p className="text-center text-sm text-on-surface-variant py-4">No matching employees</p>}
            {candidates.map((emp, i) => {
              const b = computeBurnout(emp.id)
              const tone = emp.score >= 90 ? 'success' : emp.score >= 80 ? 'primary' : 'warning'
              const tc = { success: 'text-success', primary: 'text-primary', warning: 'text-warning' }[tone]
              const tb = { success: 'bg-success', primary: 'bg-primary', warning: 'bg-warning' }[tone]
              return (
                <div key={emp.id} className="group flex items-center gap-sm p-sm rounded-lg border border-outline-variant/60 hover:border-primary/40 transition-colors">
                  <Avatar src={emp.avatar} initials={emp.name.split(' ').map(n => n[0]).join('')} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-label-md text-label-md text-on-surface truncate">{emp.name}</div>
                    <div className="flex items-center gap-1 font-label-sm text-[11px] text-on-surface-variant">
                      <span className="truncate">{emp.department}</span>
                      <span>·</span><span>{b.hoursThisWeek}h/wk</span>
                      {b.score > 70 && <Badge variant="warning" className="ml-1">Risk</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`font-label-md text-label-md font-bold ${tc}`}>{emp.score}%</span>
                    <div className="w-14 h-1 bg-surface-container rounded-full overflow-hidden">
                      <div className={`h-full ${tb}`} style={{ width: `${emp.score}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Card hover={false} className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-md py-sm border-b border-outline-variant/60">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary text-[20px]">swap_horiz</span>
            <h3 className="font-headline-md text-base font-semibold text-on-surface">Smart approval queue</h3>
          </div>
          <Badge variant="warning">{pending.length}</Badge>
        </div>
        <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
          {pending.length === 0 && (
            <div className="px-md py-xl text-center">
              <span className="material-symbols-outlined text-success text-[28px]">check_circle</span>
              <p className="mt-sm font-body-sm text-body-sm text-on-surface-variant">All swaps resolved</p>
            </div>
          )}

          {autoApprove.length > 0 && (
            <div className="border-b border-outline-variant/30">
              <div className="px-md py-sm bg-success/5 flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-success text-[18px]">auto_awesome</span>
                  <span className="font-label-md text-label-md font-bold text-success">Auto-approve recommended</span>
                </div>
                <button onClick={handleBulkApprove} className="btn-primary py-xs px-sm text-xs">
                  Approve all {autoApprove.length}
                </button>
              </div>
              {autoApprove.map(swap => (
                <div key={swap.id} className="px-md py-sm border-b border-outline-variant/20 last:border-0 hover:bg-surface-container/60">
                  <div className="flex items-center justify-between mb-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="font-label-md text-label-md text-on-surface">{swap.requesterName}</span>
                      <span className="material-symbols-outlined text-on-surface-variant text-[14px]">arrow_forward</span>
                      <span className="font-label-md text-label-md text-on-surface">{swap.targetName || 'Open'}</span>
                    </div>
                    <span className="chip bg-success/15 text-success text-[10px]">{swap.matchScore}% match</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{swap.reason}</p>
                  <div className="mt-sm flex gap-sm">
                    <button onClick={() => handleApprove(swap.id)} className="btn-primary py-xs px-sm text-xs flex-1">Approve</button>
                    <button onClick={() => handleDecline(swap.id)} className="btn-secondary py-xs px-sm text-xs">Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {manualReview.length > 0 && (
            <div className="border-b border-outline-variant/30">
              <div className="px-md py-sm bg-warning/5 flex items-center gap-sm">
                <span className="material-symbols-outlined text-warning text-[18px]">rate_review</span>
                <span className="font-label-md text-label-md font-bold text-warning">Manual review required</span>
              </div>
              {manualReview.map(swap => (
                <div key={swap.id} className="px-md py-sm border-b border-outline-variant/20 last:border-0 hover:bg-surface-container/60">
                  <div className="flex items-center justify-between mb-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="font-label-md text-label-md text-on-surface">{swap.requesterName}</span>
                      <span className="material-symbols-outlined text-on-surface-variant text-[14px]">arrow_forward</span>
                      <span className="font-label-md text-label-md text-on-surface">{swap.targetName || 'Open'}</span>
                    </div>
                    <span className="chip bg-warning/15 text-warning text-[10px]">{swap.matchScore}% match</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{swap.reason}</p>
                  <div className="mt-sm flex gap-sm">
                    <button onClick={() => handleApprove(swap.id)} className="btn-primary py-xs px-sm text-xs flex-1">Approve</button>
                    <button onClick={() => handleDecline(swap.id)} className="btn-secondary py-xs px-sm text-xs">Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {conflicts.length > 0 && (
            <div>
              <div className="px-md py-sm bg-error/5 flex items-center gap-sm">
                <span className="material-symbols-outlined text-error text-[18px]">warning</span>
                <span className="font-label-md text-label-md font-bold text-error">Conflicts detected</span>
              </div>
              {conflicts.map(swap => (
                <div key={swap.id} className="px-md py-sm border-b border-outline-variant/20 last:border-0 hover:bg-surface-container/60">
                  <div className="flex items-center justify-between mb-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="font-label-md text-label-md text-on-surface">{swap.requesterName}</span>
                      <span className="material-symbols-outlined text-on-surface-variant text-[14px]">arrow_forward</span>
                      <span className="font-label-md text-label-md text-on-surface">{swap.targetName || 'Open'}</span>
                    </div>
                    <span className="chip bg-error/15 text-error text-[10px]">{swap.matchScore}% match</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{swap.reason}</p>
                  <div className="mt-sm flex gap-sm">
                    <button onClick={() => handleApprove(swap.id)} className="btn-primary py-xs px-sm text-xs flex-1">Override & Approve</button>
                    <button onClick={() => handleDecline(swap.id)} className="btn-ghost py-xs px-sm text-xs text-error hover:bg-error/10">Auto-Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function ShiftDetails({ shift, refresh }) {
  const toast = useToast()
  const emp = shift.employeeId ? getEmployee(shift.employeeId) : null
  const candidates = useMemo(() =>
    findCandidates(shift.id, 3).filter(e => e.score > 0),
  [shift])

  return (
    <div className="p-md space-y-md">
      <div>
        <h3 className="font-headline-md text-lg font-semibold text-on-surface">{shift.title}</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {shift.department} · {formatDateFull(shift.date)} · {timeLabel(shift.startHour)} ({shift.durationHours}h)
        </p>
      </div>

      <div className="space-y-sm">
        {[['Status', shift.status], ['Assigned to', emp?.name ?? 'Unassigned'],
          ['Required certs', (shift.certifications || []).join(', ') || 'None'],
          ['Notes', shift.notes || '—'],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-sm border-b border-outline-variant/40 last:border-0">
            <span className="font-label-sm text-label-sm text-on-surface-variant">{label}</span>
            <span className="font-label-md text-label-md text-on-surface capitalize">{value}</span>
          </div>
        ))}
      </div>

      {shift.status === 'open' && candidates.length > 0 && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-md">
          <p className="font-label-md text-label-md text-on-surface font-semibold">Assign to</p>
          <div className="mt-sm space-y-sm">
            {candidates.map(e => (
              <div key={e.id} className="flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <Avatar src={e.avatar} initials={e.name.split(' ').map(n => n[0]).join('')} size="xs" />
                  <div>
                    <span className="font-label-md text-label-md text-on-surface">{e.name}</span>
                    <span className="ml-2 font-label-sm text-[11px] text-primary">{e.score}% match</span>
                  </div>
                </div>
                <button onClick={() => {
                  assignShift(shift.id, e.id)
                  toast.push(`${e.name} assigned to shift`, { tone: 'success' })
                  refresh()
                }} className="btn-primary py-xs px-sm text-xs">Assign</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
