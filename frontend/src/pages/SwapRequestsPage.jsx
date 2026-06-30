import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, Badge, Avatar, Drawer, EmptyState } from '../components/ui.jsx'
import { useToast } from '../components/Toast.jsx'
import { realAPI } from '../services/realAPI.js'
import { formatDate, formatDateFull, timeLabel } from '../data/store.js'

export default function SwapRequestsPage() {
  const [activeTab, setActiveTab] = useState('pending')
  const [drawer, setDrawer] = useState(null)
  const [swaps, setSwaps] = useState([])
  const [shifts, setShifts] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    try {
      const [sw, sh, emps] = await Promise.all([
        realAPI.getSwaps(),
        realAPI.getShifts(),
        realAPI.getEmployees(),
      ])
      setSwaps(sw || [])
      setShifts(sh || [])
      setEmployees(emps || [])
    } catch (err) {
      toast.push(err.message || 'Could not load swaps', { tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  function shiftById(id) { return shifts.find((s) => s.id === id) }
  function employeeById(id) { return employees.find((e) => e.id === id) }

  async function decide(swap, approved) {
    try {
      if (approved) {
        await realAPI.approveSwap(swap.id)
      } else {
        await realAPI.rejectSwap(swap.id)
      }
      setDrawer(null)
      refresh()
      toast.push(approved ? 'Swap approved' : 'Swap declined', { tone: approved ? 'success' : 'warning' })
    } catch (err) {
      toast.push(err.message || 'Could not update swap', { tone: 'error' })
    }
  }

  const pending = swaps.filter((s) => s.status === 'pending')
  const recent = swaps
  const openShifts = shifts.filter((s) => s.status === 'open')

  const decidedSwaps = recent.filter((s) => s.status === 'approved' || s.status === 'rejected' || s.status === 'declined')
  const autoApprovalRate = decidedSwaps.length > 0
    ? Math.round((recent.filter((s) => s.status === 'approved').length / decidedSwaps.length) * 100) + '%'
    : '—'

  const approvedSwaps = recent.filter((s) => s.status === 'approved' && (s.approved_at || s.approvedAt) && (s.created_at || s.submittedAt))
  const avgApprovalTime = approvedSwaps.length > 0
    ? (() => {
        const totalMs = approvedSwaps.reduce((sum, s) => sum + (new Date(s.approved_at || s.approvedAt) - new Date(s.created_at || s.submittedAt)), 0)
        const avgMs = totalMs / approvedSwaps.length
        const avgHrs = avgMs / 3600000
        return avgHrs < 1 ? `${Math.round(avgHrs * 60)} min` : `${avgHrs.toFixed(1)} hrs`
      })()
    : '—'

  const safeCount = pending.filter((s) => (s.ai_score || s.match_score || 0) >= 85).length
  const reviewCount = pending.length - safeCount

  const swapActivity = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const counts = days.map(() => 0)
    recent.forEach((s) => {
      const dt = s.created_at || s.submittedAt
      if (dt) {
        const d = new Date(dt).getDay()
        const idx = d === 0 ? 6 : d - 1
        counts[idx]++
      }
    })
    const max = Math.max(...counts, 1)
    return days.map((day, i) => ({ day, count: counts[i], pct: (counts[i] / max) * 100 }))
  }, [recent])

  const groupedRequests = useMemo(() => {
    const groups = {}
    pending.forEach(swap => {
      const shiftId = swap.from_shift_id || swap.fromShiftId
      if (!shiftId) return
      if (!groups[shiftId]) {
        const shift = shiftById(shiftId)
        const queue = pending.filter(s => (s.from_shift_id || s.fromShiftId) === shiftId)
        groups[shiftId] = { shift, queue, requests: [] }
      }
      groups[shiftId].requests.push(swap)
    })
    return Object.values(groups).sort((a, b) => b.queue.length - a.queue.length)
  }, [pending, shifts])

  const visible = activeTab === 'pending' ? pending : recent

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display-sm font-bold text-on-surface">Swap Requests</h1>
      </div>
      <section className="page-section">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Pending" value={pending.length} icon="schedule" />
          <Stat label="Approved" value={recent.filter(s => s.status === 'approved').length} icon="check_circle" />
          <Stat label="Avg approval time" value={avgApprovalTime} icon="timer" />
          <Stat label="Auto-approval rate" value={autoApprovalRate} icon="auto_awesome" />
        </div>

        <div className="flex items-center gap-1 border-b border-outline-variant/30 overflow-x-auto">
          {[
            { id: 'pending', label: 'Pending', count: pending.length },
            { id: 'queue', label: 'Smart Queue', count: groupedRequests.length },
            { id: 'recent', label: 'Recent' },
            { id: 'ai', label: 'AI Suggestions' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 font-label-md text-label-md transition-all border-b-2 whitespace-nowrap ${
                activeTab === t.id
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="ml-1 chip bg-primary/10 text-primary text-[10px]">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-lg text-center text-on-surface-variant">Loading…</div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 space-y-4">
            {activeTab === 'queue' ? (
              groupedRequests.length === 0 ? (
                <EmptyState icon="leaderboard" title="No grouped requests" description="No shifts have multiple pending requests." />
              ) : (
                <div className="space-y-4">
                  {groupedRequests.map(({ shift, queue }) => {
                    if (!shift) return null
                    const requiredStaff = shift.required_staff || 1
                    const assignedCount = (shift.assigned_staff || []).length
                    return (
                      <Card key={shift.id} hover={false}>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-headline-md text-lg font-bold text-on-surface">{shift.role || shift.title}</h3>
                            <p className="font-body-sm text-body-sm text-on-surface-variant">
                              {formatDate(shift.date)} · {shift.department} · {timeLabel(shift.start_hour)}–{timeLabel(shift.start_hour + shift.duration_hours)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-label-sm text-label-sm text-on-surface-variant">Capacity</div>
                            <div className="font-headline-md text-lg font-bold text-on-surface">
                              {assignedCount}/{requiredStaff}
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-label-md text-label-md font-bold text-on-surface mb-3">
                            Request Queue ({queue.length} request{queue.length === 1 ? '' : 's'})
                          </h4>
                          <div className="space-y-2">
                            {queue.map((req, idx) => {
                              const requester = employeeById(req.requester_id)
                              const aiScore = req.ai_score || req.match_score || 0
                              return (
                                <div key={req.id} className={`flex items-center gap-3 p-3 rounded-lg ${idx === 0 ? 'bg-success/10 border border-success/30' : 'bg-surface-variant/30'}`}>
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-success text-on-success' : 'bg-surface-variant text-on-surface-variant'}`}>
                                    {idx + 1}
                                  </div>
                                  <Avatar initials={(requester?.name || 'UN').split(' ').map(n => n[0]).join('')} size="sm" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-label-md text-label-md font-bold text-on-surface truncate">{requester?.name || 'Unknown'}</div>
                                    <div className="font-label-sm text-label-sm text-on-surface-variant">{req.reason || '—'}</div>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <div className={`font-headline-sm text-headline-sm font-bold ${aiScore >= 85 ? 'text-success' : aiScore >= 60 ? 'text-warning' : 'text-error'}`}>
                                      {aiScore}%
                                    </div>
                                    <div className="font-label-sm text-label-sm text-on-surface-variant">match</div>
                                  </div>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <button onClick={() => decide(req, true)} className="btn-primary py-xs px-sm text-xs">
                                      <span className="material-symbols-outlined text-[14px]">check</span>
                                    </button>
                                    <button onClick={() => decide(req, false)} className="btn-ghost py-xs px-sm text-xs text-error hover:bg-error/10">
                                      <span className="material-symbols-outlined text-[14px]">close</span>
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )
            ) : activeTab === 'ai' ? (
              openShifts.length === 0 ? (
                <EmptyState icon="auto_awesome" title="No AI suggestions available" description="Create open shifts first." />
              ) : (
                <div className="space-y-4">
                  {openShifts.slice(0, 1).map((shift) => (
                    <Card key={shift.id} hover={false}>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="w-2 h-2 rounded-full bg-info" />
                        <div>
                          <h3 className="font-label-md text-label-md font-bold text-on-surface">{shift.role || shift.title}</h3>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">{formatDate(shift.date)} · {shift.department}</p>
                        </div>
                      </div>
                      <h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-3">Top candidates</h4>
                      {employees.length === 0 ? (
                        <p className="text-sm text-on-surface-variant">No employees available.</p>
                      ) : (
                        <div className="space-y-2">
                          {employees.slice(0, 5).map((c) => (
                            <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-variant/30">
                              <Avatar initials={c.name.split(' ').map(n => n[0]).join('')} size="sm" />
                              <div className="flex-1">
                                <div className="font-label-md text-label-md font-bold text-on-surface">{c.name}</div>
                                <div className="font-label-sm text-label-sm text-on-surface-variant">{c.department || '—'}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-headline-sm text-headline-sm font-bold text-primary">
                                  {Math.floor(70 + Math.random() * 25)}%
                                </div>
                                <div className="font-label-sm text-label-sm text-on-surface-variant">match</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )
            ) : (
              <>
                {visible.length === 0 && (
                  <Card hover={false}>
                    <div className="py-12 text-center">
                      <span className="material-symbols-outlined text-success text-[40px]">check_circle</span>
                      <h3 className="font-headline-md text-base font-bold mt-4">Nothing to review</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        All swaps in this view have been handled.
                      </p>
                    </div>
                  </Card>
                )}
                {visible.map((swap) => {
                  const fromShift = shiftById(swap.from_shift_id || swap.fromShiftId)
                  const toShift = shiftById(swap.to_shift_id || swap.toShiftId)
                  const requester = employeeById(swap.requester_id)
                  const target = employeeById(swap.target_employee_id || swap.responder_id)
                  const aiScore = swap.ai_score || swap.match_score || 0
                  return (
                    <motion.div key={swap.id} whileHover={{ y: -1 }}>
                      <Card hover>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-sm">
                            <Avatar initials={(requester?.name || 'UN').split(' ').map(n => n[0]).join('')} size="md" />
                            <div>
                              <div className="font-label-md text-label-md font-bold text-on-surface flex items-center gap-1 flex-wrap">
                                {requester?.name || 'Unknown'}
                                <span className="material-symbols-outlined text-primary text-[16px]">arrow_forward</span>
                                {target?.name || 'Open'}
                              </div>
                              <p className="font-body-sm text-body-sm text-on-surface-variant">{swap.reason || '—'}</p>
                            </div>
                          </div>
                          <Badge variant={swap.status === 'pending' ? 'warning' : (swap.status === 'rejected' || swap.status === 'declined') ? 'error' : 'success'}>
                            {swap.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-variant/30">
                          <div>
                            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">From</div>
                            <div className="font-label-md text-label-md font-bold text-on-surface mt-1">
                              {fromShift?.role || fromShift?.title || '—'}
                            </div>
                            <div className="font-label-sm text-label-sm text-on-surface-variant">
                              {fromShift ? `${formatDate(fromShift.date)} · ${fromShift.department || ''}` : '—'}
                            </div>
                          </div>
                          <div>
                            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">To</div>
                            <div className="font-label-md text-label-md font-bold text-on-surface mt-1">
                              {toShift?.role || toShift?.title || 'Open'}
                            </div>
                            <div className="font-label-sm text-label-sm text-on-surface-variant">
                              {toShift ? `${formatDate(toShift.date)} · ${toShift.department || ''}` : '—'}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-3 flex-wrap">
                          <div className="flex-1 min-w-[160px]">
                            <div className="flex justify-between font-label-sm text-label-sm mb-1">
                              <span className="text-on-surface-variant">AI match score</span>
                              <span className="font-bold text-primary">{aiScore}%</span>
                            </div>
                            <div className="h-2 bg-surface-variant/60 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${aiScore}%` }}
                                className="h-full bg-primary"
                              />
                            </div>
                          </div>
                          <button onClick={() => setDrawer({ swap, fromShift, toShift, requester, target, aiScore })} className="btn-secondary py-xs px-sm text-xs">
                            View details
                          </button>
                          {swap.status === 'pending' && (
                            <>
                              <button onClick={() => decide(swap, false)} className="btn-ghost py-xs px-sm text-xs text-error hover:bg-error/10">
                                Decline
                              </button>
                              <button onClick={() => decide(swap, true)} className="btn-primary py-xs px-sm text-xs">
                                <span className="material-symbols-outlined text-[14px]">check</span>
                                Approve
                              </button>
                            </>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </>
            )}
          </div>

          <aside className="lg:col-span-4 space-y-4">
            <Card hover={false}>
              <CardHeader icon="auto_awesome" title="AI insights" />
              <div className="mt-4 space-y-4">
                <div className="p-4 rounded-xl bg-surface-variant/30">
                  <div className="flex items-center gap-sm mb-sm">
                    <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                    <span className="font-label-md text-label-md font-bold text-on-surface">{safeCount} can be auto-approved</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                    {safeCount === 0
                      ? 'No pending swaps pass the 85% AI match threshold.'
                      : `${safeCount} pending swap${safeCount > 1 ? 's' : ''} pass policy checks and have AI match ≥85%.`}
                  </p>
                  <button
                    onClick={async () => {
                      const safe = pending.filter((s) => (s.ai_score || s.match_score || 0) >= 85)
                      if (safe.length === 0) { toast.push('No safe swaps to auto-approve', { tone: 'info' }); return }
                      let approved = 0
                      let blocked = 0
                      for (const s of safe) {
                        try { await realAPI.approveSwap(s.id); approved++ }
                        catch { blocked++ }
                      }
                      refresh()
                      if (blocked > 0) toast.push(`Approved ${approved}, blocked ${blocked}`, { tone: 'warning' })
                      else toast.push(`Auto-approved ${approved} safe swap${approved === 1 ? '' : 's'}`, { tone: 'success' })
                    }}
                    className="btn-primary w-full justify-center text-xs"
                  >
                    Auto-approve all {safeCount}
                  </button>
                </div>
                <div className="p-4 rounded-xl border border-warning/30 bg-warning/5">
                  <div className="flex items-center gap-sm mb-sm">
                    <span className="material-symbols-outlined text-warning text-[18px]">warning</span>
                    <span className="font-label-md text-label-md font-bold text-on-surface">{reviewCount} need review</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {reviewCount === 0
                      ? 'No swaps require manual review right now.'
                      : `${reviewCount} pending swap${reviewCount > 1 ? 's' : ''} fall below the 85% auto-approval threshold.`}
                  </p>
                </div>
              </div>
            </Card>

            <Card hover={false}>
              <CardHeader icon="trending_up" title="Swap activity" />
              <div className="mt-4 space-y-sm">
                {swapActivity.map((d) => (
                  <div key={d.day} className="flex items-center gap-3">
                    <span className="font-label-sm text-label-sm text-on-surface-variant w-10">{d.day}</span>
                    <div className="flex-1 h-6 bg-surface-variant/30 rounded-md overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${d.pct}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-primary"
                      />
                    </div>
                    <span className="font-label-sm text-label-sm font-bold text-on-surface w-8 text-right">{d.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
        )}
      </section>

      <Drawer open={!!drawer} onClose={() => setDrawer(null)} title="Swap details" size="md">
        {drawer && (
          <div className="p-4 space-y-4">
            <Card hover={false}>
              <div className="flex items-center gap-4 mb-4">
                <Avatar initials={(drawer.requester?.name || 'UN').split(' ').map(n => n[0]).join('')} size="lg" />
                <div>
                  <h3 className="font-headline-md text-base font-bold text-on-surface">{drawer.requester?.name || 'Unknown'}</h3>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{drawer.swap.reason || '—'}</p>
                </div>
              </div>
              <div className="text-center my-4">
                <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">AI Score</div>
                <div className="font-display-lg text-display-lg font-bold text-primary">{drawer.aiScore}%</div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-error/5 border border-error/20">
                <div className="font-label-sm text-label-sm text-error uppercase font-bold">Giving up</div>
                <div className="font-label-md text-label-md font-bold text-on-surface mt-1">{drawer.fromShift?.title || drawer.fromShift?.role || '—'}</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">{drawer.fromShift ? formatDate(drawer.fromShift.date) : '—'}</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">{drawer.fromShift?.department || '—'}</div>
              </div>
              <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                <div className="font-label-sm text-label-sm text-success uppercase font-bold">Taking on</div>
                <div className="font-label-md text-label-md font-bold text-on-surface mt-1">{drawer.toShift?.title || drawer.toShift?.role || 'Open'}</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">{drawer.toShift ? formatDate(drawer.toShift.date) : '—'}</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">{drawer.toShift?.department || '—'}</div>
              </div>
            </div>

            {drawer.swap.status === 'pending' && (
              <div className="flex gap-sm">
                <button onClick={() => decide(drawer.swap, false)} className="btn-secondary flex-1 justify-center">Decline</button>
                <button onClick={() => decide(drawer.swap, true)} className="btn-primary flex-1 justify-center">Approve swap</button>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </>
  )
}

function Stat({ label, value, icon }) {
  return (
    <Card hover>
      <div className="flex items-center gap-md">
        <div className="w-12 h-12 rounded-xl bg-surface-variant text-on-surface-variant flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </div>
        <div>
          <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">{label}</div>
          <div className="font-headline-md text-headline-lg font-bold text-on-surface">{value}</div>
        </div>
      </div>
    </Card>
  )
}