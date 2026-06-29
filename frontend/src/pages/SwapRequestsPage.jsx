import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, Badge, Avatar, Drawer, EmptyState } from '../components/ui.jsx'
import { useToast } from '../components/Toast.jsx'
import { getSwaps, getPendingSwaps, approveSwap, declineSwap, getEmployee, getShift, formatDate, formatDateFull, findCandidates, getOpenShifts, getRequestQueueForShift, getSlotsRemaining } from '../data/store.js'

export default function SwapRequestsPage() {
  const [activeTab, setActiveTab] = useState('pending')
  const [drawer, setDrawer] = useState(null)
  const [, forceRender] = useState(0)
  const toast = useToast()

  const rerender = () => forceRender((x) => x + 1)

  const pending = getPendingSwaps()
  const recent = getSwaps()
  const openShifts = getOpenShifts()
  const aiCandidates = openShifts.length > 0 ? findCandidates(openShifts[0].id) : []
  const safeCount = pending.filter((s) => s.aiScore >= 85).length
  const reviewCount = pending.length - safeCount
  const decidedSwaps = recent.filter((s) => s.status === 'approved' || s.status === 'declined')
  const autoApprovalRate = decidedSwaps.length > 0
    ? Math.round((recent.filter((s) => s.status === 'approved').length / decidedSwaps.length) * 100) + '%'
    : '—'

  const approvedSwaps = recent.filter((s) => s.status === 'approved' && s.decidedAt && s.submittedAt)
  const avgApprovalTime = approvedSwaps.length > 0
    ? (() => {
        const totalMs = approvedSwaps.reduce((sum, s) => sum + (new Date(s.decidedAt) - new Date(s.submittedAt)), 0)
        const avgMs = totalMs / approvedSwaps.length
        const avgHrs = avgMs / 3600000
        return avgHrs < 1 ? `${Math.round(avgHrs * 60)} min` : `${avgHrs.toFixed(1)} hrs`
      })()
    : '—'

  function decide(swap, approved) {
    if (approved) {
      const result = approveSwap(swap.id)
      if (result?.error) {
        toast.push(result.error, { tone: 'error' })
        return
      }
    } else {
      declineSwap(swap.id)
    }
    setDrawer(null)
    rerender()
    toast.push(
      approved
        ? `Swap approved · ${swap.requesterName.split(' ')[0]} ↔ ${swap.targetName.split(' ')[0]}`
        : 'Swap declined',
      { tone: approved ? 'success' : 'warning' },
    )
  }

  const swapActivity = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const counts = days.map(() => 0)
    recent.forEach((s) => {
      if (s.submittedAt) {
        const d = new Date(s.submittedAt).getDay()
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
      const shiftId = swap.fromShiftId
      if (!shiftId) return
      if (!groups[shiftId]) {
        const shift = getShift(shiftId)
        const queue = getRequestQueueForShift(shiftId)
        groups[shiftId] = { shift, queue, requests: [] }
      }
      groups[shiftId].requests.push(swap)
    })
    return Object.values(groups).sort((a, b) => b.queue.length - a.queue.length)
  }, [pending])

  const autoApprove = pending.filter(s => s.matchScore >= 85)
  const manualReview = pending.filter(s => s.matchScore < 85 && s.matchScore >= 60)
  const conflicts = pending.filter(s => s.matchScore < 60)

  const visible = activeTab === 'pending' ? pending : recent



  return (
    <>
      <div className="mb-6">
        <h1 className="font-display-sm font-bold text-on-surface">Swap Requests</h1>
      </div>
      <section className="page-section">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Pending" value={getPendingSwaps().length} icon="schedule" color="warning" />
          <Stat label="Approved" value={getSwaps().filter(s => s.status === 'approved').length} icon="check_circle" color="success" />
          <Stat label="Avg approval time" value={avgApprovalTime} icon="timer" color="primary" />
          <Stat label="Auto-approval rate" value={autoApprovalRate} icon="auto_awesome" color="info" />
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
              {t.count !== undefined && (
                <span className="ml-1 chip bg-primary/10 text-primary text-[10px]">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 space-y-4">
            {activeTab === 'queue' ? (
              groupedRequests.length === 0 ? (
                <EmptyState icon="leaderboard" title="No grouped requests" description="No shifts have multiple pending requests." />
              ) : (
                <div className="space-y-4">
                  {groupedRequests.map(({ shift, queue }) => {
                    if (!shift) return null
                    const slotsRemaining = getSlotsRemaining(shift.id)
                    const requiredStaff = shift.requiredStaff || 1
                    const assignedCount = shift.assignedStaff?.length || (shift.employeeId ? 1 : 0)
                    return (
                      <Card key={shift.id} hover={false}>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-headline-md text-lg font-bold text-on-surface">{shift.role || shift.title}</h3>
                            <p className="font-body-sm text-body-sm text-on-surface-variant">
                              {formatDate(shift.date)} · {shift.department} · {timeLabel(shift.startHour)}–{timeLabel(shift.startHour + shift.durationHours)}
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
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-label-sm text-label-sm text-on-surface-variant">Slots filled</span>
                            <span className="font-label-sm text-label-sm font-bold text-on-surface">{slotsRemaining} remaining</span>
                          </div>
                          <div className="w-full bg-surface-variant/60 rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${(assignedCount / requiredStaff) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-label-md text-label-md font-bold text-on-surface mb-3">
                            Request Queue ({queue.length} request{queue.length === 1 ? '' : 's'})
                          </h4>
                          <div className="space-y-2">
                            {queue.map((req, idx) => (
                              <div key={req.id} className={`flex items-center gap-3 p-3 rounded-lg ${idx === 0 ? 'bg-success/10 border border-success/30' : 'bg-surface-variant/30'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-success text-on-success' : 'bg-surface-variant text-on-surface-variant'}`}>
                                  {idx + 1}
                                </div>
                                <Avatar src={req.requesterAvatar} initials={req.requesterName.split(' ').map(n => n[0]).join('')} size="sm" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-label-md text-label-md font-bold text-on-surface truncate">{req.requesterName}</div>
                                  <div className="font-label-sm text-label-sm text-on-surface-variant">{req.reason}</div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className={`font-headline-sm text-headline-sm font-bold ${req.matchScore >= 85 ? 'text-success' : req.matchScore >= 60 ? 'text-warning' : 'text-error'}`}>
                                    {req.matchScore}%
                                  </div>
                                  <div className="font-label-sm text-label-sm text-on-surface-variant">match</div>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => decide(req, true)}
                                    className="btn-primary py-xs px-sm text-xs"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">check</span>
                                  </button>
                                  <button
                                    onClick={() => decide(req, false)}
                                    className="btn-ghost py-xs px-sm text-xs text-error hover:bg-error/10"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {queue[0]?.matchScore >= 85 && (
                          <div className="p-3 rounded-lg bg-success/5 border border-success/20 flex items-center gap-2">
                            <span className="material-symbols-outlined text-success text-[18px]">auto_awesome</span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">
                              <strong className="text-success">AI recommends:</strong> Auto-approve {queue[0].requesterName} ({queue[0].matchScore}% match)
                            </span>
                          </div>
                        )}
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
                  <Card hover={false}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-2 h-2 rounded-full bg-info" />
                      <div>
                        <h3 className="font-label-md text-label-md font-bold text-on-surface">{openShifts[0].role || openShifts[0].title}</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{formatDate(openShifts[0].date)} · {openShifts[0].department || openShifts[0].dept}</p>
                      </div>
                    </div>
                    <h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-3">Top candidates</h4>
                    {aiCandidates.length === 0 ? (
                      <p className="text-sm text-on-surface-variant">No qualified candidates found.</p>
                    ) : (
                      <div className="space-y-2">
                        {aiCandidates.map((c) => (
                          <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-variant/30">
                            <Avatar src={c.avatar} initials={c.name.split(' ').map(n => n[0]).join('')} size="sm" />
                            <div className="flex-1">
                              <div className="font-label-md text-label-md font-bold text-on-surface">{c.name}</div>
                              <div className="font-label-sm text-label-sm text-on-surface-variant">{c.department || '—'}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-headline-sm text-headline-sm font-bold text-primary">{c.score}%</div>
                              <div className="font-label-sm text-label-sm text-on-surface-variant">match</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
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
              const fromShift = swap.fromShiftId ? getShift(swap.fromShiftId) : swap.fromShift
              const toShift = swap.toShiftId ? getShift(swap.toShiftId) : swap.toShift
              return (
              <motion.div key={swap.id} whileHover={{ y: -1 }}>
                <Card hover>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-sm">
                      <Avatar src={swap.requesterAvatar} initials={swap.requesterName.split(' ').map(n => n[0]).join('')} size="md" />
                      <div>
                        <div className="font-label-md text-label-md font-bold text-on-surface flex items-center gap-1 flex-wrap">
                          {swap.requesterName}
                          <span className="material-symbols-outlined text-primary text-[16px]">arrow_forward</span>
                          {swap.targetName || 'Open'}
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{swap.reason}</p>
                      </div>
                    </div>
                    <Badge variant={swap.status === 'pending' ? 'warning' : swap.status === 'rejected' ? 'error' : 'success'}>
                      {swap.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-variant/30">
                    <div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                        From
                      </div>
                      <div className="font-label-md text-label-md font-bold text-on-surface mt-1">
                        {fromShift?.role || fromShift?.title || '—'}
                      </div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">
                        {fromShift ? `${formatDate(fromShift.date)} · ${fromShift.department || fromShift.dept || ''}` : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                        To
                      </div>
                      <div className="font-label-md text-label-md font-bold text-on-surface mt-1">
                        {toShift?.role || toShift?.title || 'Open'}
                      </div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">
                        {toShift ? `${formatDate(toShift.date)} · ${toShift.department || toShift.dept || ''}` : '—'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-[160px]">
                      <div className="flex justify-between font-label-sm text-label-sm mb-1">
                        <span className="text-on-surface-variant">AI match score</span>
                        <span className="font-bold text-primary">{swap.aiScore}%</span>
                      </div>
                      <div className="h-2 bg-surface-variant/60 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${swap.aiScore}%` }}
                          className="h-full bg-primary"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setDrawer(swap)}
                      className="btn-secondary py-xs px-sm text-xs"
                    >
                      View details
                    </button>
                    <button
                      onClick={() => decide(swap, false)}
                      className="btn-ghost py-xs px-sm text-xs text-error hover:bg-error/10"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => decide(swap, true)}
                      className="btn-primary py-xs px-sm text-xs"
                    >
                      <span className="material-symbols-outlined text-[14px]">check</span>
                      Approve
                    </button>
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
                    onClick={() => {
                      const safe = getPendingSwaps().filter((s) => s.aiScore >= 85)
                      if (safe.length === 0) { toast.push('No safe swaps to auto-approve', { tone: 'info' }); return }
                      let approved = 0
                      let blocked = 0
                      safe.forEach((s) => {
                        const result = approveSwap(s.id)
                        if (result?.error) blocked++
                        else approved++
                      })
                      rerender()
                      if (blocked > 0) {
                        toast.push(`Approved ${approved}, blocked ${blocked} (conflict or hour limit)`, { tone: 'warning' })
                      } else {
                        toast.push(`Auto-approved ${approved} safe swap${approved === 1 ? '' : 's'}`, { tone: 'success' })
                      }
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
                    <span className="font-label-sm text-label-sm text-on-surface-variant w-10">
                      {d.day}
                    </span>
                    <div className="flex-1 h-6 bg-surface-variant/30 rounded-md overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${d.pct}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-primary"
                      />
                    </div>
                    <span className="font-label-sm text-label-sm font-bold text-on-surface w-8 text-right">
                      {d.count}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </section>

      <Drawer
        open={!!drawer}
        onClose={() => setDrawer(null)}
        title="Swap details"
        size="md"
      >
        {drawer && (
          <SwapDetail drawer={drawer} onDecide={decide} />
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

function SwapDetail({ drawer, onDecide }) {
  const fromShift = drawer.fromShiftId ? getShift(drawer.fromShiftId) : drawer.fromShift
  const toShift = drawer.toShiftId ? getShift(drawer.toShiftId) : drawer.toShift
  const requester = getEmployee(drawer.requesterId)
  const target = drawer.targetId ? getEmployee(drawer.targetId) : null

  const reasoning = []
  if (drawer.aiScore >= 85) reasoning.push(`AI match score is high (${drawer.aiScore}%), indicating strong compatibility.`)
  else if (drawer.aiScore >= 60) reasoning.push(`AI match score is moderate (${drawer.aiScore}%). Review recommended.`)
  else reasoning.push(`AI match score is low (${drawer.aiScore}%). Consider alternatives.`)

  if (fromShift && toShift) {
    const sameDept = fromShift.department === toShift.department
    reasoning.push(sameDept ? 'Both shifts are in the same department.' : 'Cross-department swap: verify certification overlap.')
  }

  if (target) {
    reasoning.push(`${target.name} will take on the new shift if approved.`)
  }

  return (
    <div className="p-4 space-y-4">
      <Card hover={false}>
        <div className="flex items-center gap-4 mb-4">
          <Avatar src={drawer.requesterAvatar || requester?.avatar} size="lg" />
          <div>
            <h3 className="font-headline-md text-base font-bold text-on-surface">{drawer.requesterName}</h3>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{drawer.reason}</p>
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
          <div className="font-label-md text-label-md font-bold text-on-surface mt-1">{fromShift?.title || fromShift?.role || '—'}</div>
          <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">{fromShift ? formatDate(fromShift.date) : '—'}</div>
          <div className="font-label-sm text-label-sm text-on-surface-variant">{fromShift?.department || '—'}</div>
        </div>
        <div className="p-4 rounded-xl bg-success/5 border border-success/20">
          <div className="font-label-sm text-label-sm text-success uppercase font-bold">Taking on</div>
          <div className="font-label-md text-label-md font-bold text-on-surface mt-1">{toShift?.title || toShift?.role || 'Open'}</div>
          <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">{toShift ? formatDate(toShift.date) : '—'}</div>
          <div className="font-label-sm text-label-sm text-on-surface-variant">{toShift?.department || '—'}</div>
        </div>
      </div>

      <Card hover={false}>
        <h4 className="font-label-md text-label-md font-bold text-on-surface mb-sm">AI reasoning</h4>
        <ul className="space-y-2">
          {reasoning.map((r, i) => (
            <li key={i} className="font-body-md text-body-md text-on-surface-variant leading-relaxed flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-[16px] mt-0.5">check_circle</span>
              {r}
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex gap-sm">
        <button onClick={() => onDecide(drawer, false)} className="btn-secondary flex-1 justify-center">Decline</button>
        <button onClick={() => onDecide(drawer, true)} className="btn-primary flex-1 justify-center">Approve swap</button>
      </div>
    </div>
  )
}
