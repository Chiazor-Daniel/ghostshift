import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, Badge, Avatar, Drawer, EmptyState, ListSkeleton, Pagination, ConfirmDialog, Modal } from '../components/ui.jsx'
import { useToast } from '../components/Toast.jsx'
import { realAPI } from '../services/realAPI.js'
import { formatDate, formatDateFull, timeLabel } from '../data/store.js'
import { useDebouncedRefresh } from '../hooks/useDebouncedRefresh.js'

// Fit-score threshold for auto-approval. Requests with score >= this are flagged
// "safe to auto-approve" because the requester matches the shift well.
const AUTO_APPROVE_THRESHOLD = 70

export default function SwapRequestsPage() {
  const [activeTab, setActiveTab] = useState('pickups')
  const [drawer, setDrawer] = useState(null)
  const [swaps, setSwaps] = useState([])
  const [shifts, setShifts] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [listPage, setListPage] = useState(1)
  const [busySwapId, setBusySwapId] = useState(null)
  const [busySwapAction, setBusySwapAction] = useState(null)
  const [confirmSwap, setConfirmSwap] = useState(null)
  const [reasoning, setReasoning] = useState(null)
  const [batchReasoning, setBatchReasoning] = useState(null)
  const [busyReasoningId, setBusyReasoningId] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [busyRejectNote, setBusyRejectNote] = useState(false)
  const toast = useToast()

  useEffect(() => {
    refresh()
  }, [])

  useDebouncedRefresh(refresh)

  async function refresh(opts = {}) {
    const silent = opts?.silent === true
    const hasData = swaps.length > 0
    if (!silent && !hasData) setLoading(true)
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
    if (busySwapId) return
    setRejectNote('')
    setConfirmSwap({ swap, approved })
  }

  async function loadRejectNote() {
    if (!confirmSwap || confirmSwap.approved) return
    setBusyRejectNote(true)
    try {
      const res = await realAPI.getSwapReasoning(confirmSwap.swap.id)
      // Use the AI reasoning as a friendly rejection note.
      let note = res?.reasoning
      if (!note) {
        note = `Thanks for requesting this swap. After reviewing coverage and staffing, we can't approve it right now. Please check the marketplace for other options.`
      }
      // Keep it concise for a notification message.
      if (note.length > 280) note = note.slice(0, 277) + '...'
      setRejectNote(note)
    } catch (err) {
      toast.push(err.message || 'Could not generate rejection note', { tone: 'error' })
    } finally {
      setBusyRejectNote(false)
    }
  }

  async function executeDecision() {
    if (!confirmSwap) return
    const { swap, approved } = confirmSwap
    const note = rejectNote.trim()
    setConfirmSwap(null)
    setBusySwapId(swap.id)
    setBusySwapAction(approved ? 'approve' : 'reject')
    try {
      if (approved) {
        await realAPI.approveSwap(swap.id)
      } else {
        await realAPI.rejectSwap(swap.id, { reason: note || undefined })
      }
      setDrawer(null)
      refresh()
      toast.push(approved ? 'Approved' : 'Declined', { tone: approved ? 'success' : 'warning' })
    } catch (err) {
      toast.push(err.message || 'Could not update', { tone: 'error' })
    } finally {
      setBusySwapId(null)
      setBusySwapAction(null)
      setRejectNote('')
    }
  }

  async function loadReasoning(swap) {
    if (busyReasoningId) return
    setBusyReasoningId(swap.id)
    try {
      const res = await realAPI.getSwapReasoning(swap.id)
      setReasoning({ ...res, swap })
    } catch (err) {
      toast.push(err.message || 'Could not load AI reasoning', { tone: 'error' })
    } finally {
      setBusyReasoningId(null)
    }
  }

  async function loadBatchReasoning() {
    const safe = tabItems.filter((s) => (s.ai_score || s.match_score || 0) >= AUTO_APPROVE_THRESHOLD)
    if (safe.length === 0) {
      toast.push('No safe requests to analyze', { tone: 'info' })
      return
    }
    setBusyReasoningId('batch')
    try {
      const res = await realAPI.getBatchReasoning({
        items: safe.map((s) => ({
          kind: s.kind,
          department: shiftById(s.from_shift_id || s.requester_shift_id)?.department || 'Unknown',
          fit_score: s.ai_score || s.match_score || 0,
        })),
      })
      setBatchReasoning({ ...res, count: safe.length })
    } catch (err) {
      toast.push(err.message || 'Could not load batch reasoning', { tone: 'error' })
    } finally {
      setBusyReasoningId(null)
    }
  }

  const pending = swaps.filter((s) => s.status === 'pending')
  const decided = swaps.filter((s) => s.status !== 'pending')

  const pendingPickups = pending.filter((s) => s.kind === 'pickup')
  const pendingSwaps = pending.filter((s) => s.kind === 'swap' || s.kind === 'release')
  const pendingGiveUps = pending.filter((s) => s.kind === 'release')

  useEffect(() => { setListPage(1) }, [activeTab])

  const tabItems =
    activeTab === 'pickups' ? pendingPickups :
    activeTab === 'swaps' ? pendingSwaps : []
  const safeCount = tabItems.filter((s) => (s.ai_score || s.match_score || 0) >= AUTO_APPROVE_THRESHOLD).length
  const reviewCount = tabItems.length - safeCount

  const swapActivity = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const counts = days.map(() => 0)
    decided.forEach((s) => {
      const dt = s.created_at
      if (dt) {
        const d = new Date(dt).getDay()
        const idx = d === 0 ? 6 : d - 1
        counts[idx]++
      }
    })
    const max = Math.max(...counts, 1)
    return days.map((day, i) => ({ day, count: counts[i], pct: (counts[i] / max) * 100 }))
  }, [decided])

  const LIST_PAGE_SIZE = 8

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display-sm font-bold text-on-surface">Swap Review</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Approve or decline shift pickups, swap trades, and give-up requests. AI ranks matches so you can decide faster.
        </p>
      </div>

      <section className="page-section space-y-md">
        {/* Top metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Shift pickups" value={pendingPickups.length} icon="event_available" hint="Take an open shift" />
          <Stat label="Swaps & give-ups" value={pendingSwaps.length} icon="swap_horiz" hint="Trades or giving a shift back" />
          <Stat label="Give-ups" value={pendingGiveUps.length} icon="exit_to_app" hint="Shift returned to marketplace" />
          <Stat label="Total pending" value={pending.length} icon="inbox" hint="Need your decision" />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-outline-variant/30 overflow-x-auto">
          {[
            { id: 'pickups', label: 'Shift pickups', count: pendingPickups.length },
            { id: 'swaps', label: 'Swaps & give-ups', count: pendingSwaps.length },
            { id: 'history', label: 'History', count: decided.length },
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
              {t.count > 0 && (
                <span className="ml-1 chip bg-primary/10 text-primary text-[10px]">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <ListSkeleton variant="card" count={3} />
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 space-y-4">
            {(() => {
              const isPending = activeTab !== 'history'
              let items, emptyIcon, emptyTitle, emptyDesc
              if (activeTab === 'pickups') {
                items = pendingPickups
                emptyIcon = 'event_available'
                emptyTitle = 'No pickup requests'
                emptyDesc = 'Employees will appear here when they request to pick up an open shift.'
              } else if (activeTab === 'swaps') {
                items = pendingSwaps
                emptyIcon = 'swap_horiz'
                emptyTitle = 'No swap or give-up requests'
                emptyDesc = 'Employees will appear here when they trade shifts or give a shift back to the marketplace.'
              } else {
                items = decided
                emptyIcon = 'check_circle'
                emptyTitle = 'No history yet'
                emptyDesc = 'Decided requests will be archived here for 30 days.'
              }
              const pageItems = items.slice((listPage - 1) * LIST_PAGE_SIZE, listPage * LIST_PAGE_SIZE)
              return (
                <>
                  {items.length === 0 && (
                    <Card hover={false}>
                      <div className="py-12 text-center">
                        <span className="material-symbols-outlined text-success text-[40px]">{emptyIcon}</span>
                        <h3 className="font-headline-md text-base font-bold mt-4">{emptyTitle}</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{emptyDesc}</p>
                      </div>
                    </Card>
                  )}
                  {pageItems.map((swap) => {
                    const fromShift = shiftById(swap.from_shift_id || swap.fromShiftId || swap.requester_shift_id)
                    const toShift = shiftById(swap.to_shift_id || swap.toShiftId || swap.responder_shift_id || swap.target_shift_id)
                    const requester = employeeById(swap.requester_id)
                    const target = employeeById(swap.target_employee_id || swap.responder_id)
                    const aiScore = swap.ai_score || swap.match_score || 0
                    const kindLabel =
                      swap.kind === 'pickup' ? 'Shift pickup' :
                      swap.kind === 'release' ? 'Give up shift' : 'Swap trade'
                    const kindVariant =
                      swap.kind === 'pickup' ? 'info' :
                      swap.kind === 'release' ? 'warning' : 'neutral'
                    return (
                      <motion.div key={swap.id} whileHover={{ y: -1 }}>
                        <Card hover>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-sm">
                              <Avatar
                                initials={(requester?.name || 'UN').split(' ').map((n) => n[0]).join('')}
                                size="md"
                              />
                              <div>
                                <div className="font-label-md text-label-md font-bold text-on-surface flex items-center gap-1 flex-wrap">
                                  {requester?.name || 'Unknown'}
                                  {target && (
                                    <>
                                      <span className="material-symbols-outlined text-primary text-[16px]">arrow_forward</span>
                                      {target.name}
                                    </>
                                  )}
                                  {!target && swap.kind === 'pickup' && (
                                    <Badge variant="info">→ Open shift</Badge>
                                  )}
                                  {!target && swap.kind === 'release' && (
                                    <Badge variant="warning">→ Marketplace</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-sm mt-0.5">
                                  <Badge variant={kindVariant}>{kindLabel}</Badge>
                                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                                    {swap.reason || '—'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <Badge
                              variant={
                                swap.status === 'pending' ? 'warning' :
                                swap.status === 'rejected' || swap.status === 'declined' ? 'error' : 'success'
                              }
                            >
                              {swap.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-variant/30">
                            {swap.kind === 'pickup' ? (
                              <>
                                <div>
                                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Requested shift</div>
                                  <div className="font-label-md text-label-md font-bold text-on-surface mt-1">
                                    {fromShift?.role || fromShift?.title || '—'}
                                  </div>
                                  <div className="font-label-sm text-label-sm text-on-surface-variant">
                                    {fromShift ? `${formatDate(fromShift.date)} · ${fromShift.department || ''}` : '—'}
                                  </div>
                                </div>
                                <div>
                                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Will be assigned to</div>
                                  <div className="font-label-md text-label-md font-bold text-on-surface mt-1">{requester?.name || 'Unknown'}</div>
                                  <div className="font-label-sm text-label-sm text-on-surface-variant">Open shift pickup</div>
                                </div>
                              </>
                            ) : swap.kind === 'release' ? (
                              <div className="sm:col-span-2">
                                <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Shift to give up</div>
                                <div className="font-label-md text-label-md font-bold text-on-surface mt-1">
                                  {fromShift?.role || fromShift?.title || '—'}
                                </div>
                                <div className="font-label-sm text-label-sm text-on-surface-variant">
                                  {fromShift ? `${formatDate(fromShift.date)} · ${fromShift.department || ''}` : '—'}
                                </div>
                                <div className="font-label-sm text-label-sm text-on-surface-variant mt-2">
                                  <b>{requester?.name || 'Unknown'}</b> will be removed; shift returns to the marketplace.
                                </div>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">From (their shift)</div>
                                  <div className="font-label-md text-label-md font-bold text-on-surface mt-1">
                                    {fromShift?.role || fromShift?.title || '—'}
                                  </div>
                                  <div className="font-label-sm text-label-sm text-on-surface-variant">
                                    {fromShift ? `${formatDate(fromShift.date)} · ${fromShift.department || ''}` : '—'}
                                  </div>
                                  <div className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                                    <b>{requester?.name || 'Unknown'}</b> gives this shift
                                  </div>
                                </div>
                                <div>
                                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">To (target shift)</div>
                                  <div className="font-label-md text-label-md font-bold text-on-surface mt-1">
                                    {toShift?.role || toShift?.title || 'Open'}
                                  </div>
                                  <div className="font-label-sm text-label-sm text-on-surface-variant">
                                    {toShift ? `${formatDate(toShift.date)} · ${toShift.department || ''}` : '—'}
                                  </div>
                                  {target ? (
                                    <div className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                                      <b>{target.name}</b> takes this; requester takes {target.name}'s shift
                                    </div>
                                  ) : (
                                    <div className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">No specific target employee selected</div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>

                          <div className="mt-4 flex items-center gap-3 flex-wrap">
                            {aiScore > 0 && (
                              <div className="flex-1 min-w-[160px]" title="Fit score: how well the employee matches the shift based on department, workload, and rest time">
                                <div className="flex justify-between font-label-sm text-label-sm mb-1">
                                  <span className="text-on-surface-variant">Fit score</span>
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
                            )}
                            <button
                              onClick={() => setDrawer({ swap, fromShift, toShift, requester, target, aiScore })}
                              className="btn-secondary py-xs px-sm text-xs"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => loadReasoning(swap)}
                              disabled={busyReasoningId === swap.id}
                              className="btn-secondary py-xs px-sm text-xs inline-flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                              {busyReasoningId === swap.id ? 'Thinking…' : 'AI reason'}
                            </button>
                            {isPending && (
                              <>
                                <button
                                  onClick={() => decide(swap, false)}
                                  disabled={busySwapId !== null}
                                  className="btn-ghost py-xs px-sm text-xs text-error hover:bg-error/10 disabled:opacity-60"
                                >
                                  {busySwapId === swap.id && busySwapAction === 'reject' ? '…' : 'Decline'}
                                </button>
                                <button
                                  onClick={() => decide(swap, true)}
                                  disabled={busySwapId !== null}
                                  className="btn-primary py-xs px-sm text-xs disabled:opacity-60"
                                >
                                  <span className="material-symbols-outlined text-[14px]">
                                    {busySwapId === swap.id && busySwapAction === 'approve'
                                      ? 'progress_activity'
                                      : 'check'}
                                  </span>
                                  {busySwapId === swap.id && busySwapAction === 'approve' ? 'Approving…' : 'Approve'}
                                </button>
                              </>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    )
                  })}
                  {items.length > LIST_PAGE_SIZE && (
                    <Pagination page={listPage} pageSize={LIST_PAGE_SIZE} total={items.length} onChange={setListPage} />
                  )}
                </>
              )
            })()}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-4">


            {/* Auto-approval summary — contextual to current tab */}
            {tabItems.length > 0 && (
            <Card hover={false}>
              <CardHeader icon="check_circle" title="Auto-approval" />
              <div className="mt-4 space-y-4">
                {safeCount > 0 ? (
                  <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                    <div className="flex items-center gap-sm mb-sm">
                      <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                      <span className="font-label-md text-label-md font-bold text-on-surface">
                        {safeCount} can be auto-approved
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                      {safeCount} request{safeCount > 1 ? 's' : ''} in this tab have a fit score ≥{AUTO_APPROVE_THRESHOLD}%.
                    </p>
                    <button
                      onClick={loadBatchReasoning}
                      disabled={busyReasoningId !== null}
                      className="btn-secondary w-full justify-center text-xs disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                      {busyReasoningId === 'batch' ? 'Analyzing…' : 'Why auto-approve?'}
                    </button>
                    <button
                      onClick={async () => {
                        if (busySwapId) return
                        const safe = tabItems.filter(
                          (s) => (s.ai_score || s.match_score || 0) >= AUTO_APPROVE_THRESHOLD
                        )
                        if (safe.length === 0) {
                          toast.push('No safe requests to auto-approve', { tone: 'info' })
                          return
                        }
                        setBusySwapId('auto-approve')
                        setBusySwapAction('approve')
                        let approved = 0
                        let blocked = 0
                        for (const s of safe) {
                          try {
                            await realAPI.approveSwap(s.id)
                            approved++
                          } catch {
                            blocked++
                          }
                        }
                        setBusySwapId(null)
                        setBusySwapAction(null)
                        refresh()
                        if (blocked > 0) toast.push(`Approved ${approved}, blocked ${blocked}`, { tone: 'warning' })
                        else toast.push(`Auto-approved ${approved}`, { tone: 'success' })
                      }}
                      disabled={busySwapId !== null}
                      className="btn-primary w-full justify-center text-xs disabled:opacity-60"
                    >
                      {busySwapId === 'auto-approve' ? (
                        <><span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span> Auto-approving…</>
                      ) : (
                        `Auto-approve all ${safeCount}`
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-surface-variant/30">
                    <div className="flex items-center gap-sm mb-sm">
                      <span className="material-symbols-outlined text-on-surface-variant text-[18px]">info</span>
                      <span className="font-label-md text-label-md font-bold text-on-surface">
                        All need manual review
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      No requests in this tab reach the {AUTO_APPROVE_THRESHOLD}% fit-score threshold.
                    </p>
                  </div>
                )}
                {reviewCount > 0 && (
                  <div className="p-4 rounded-xl border border-warning/30 bg-warning/5">
                    <div className="flex items-center gap-sm mb-sm">
                      <span className="material-symbols-outlined text-warning text-[18px]">warning</span>
                      <span className="font-label-md text-label-md font-bold text-on-surface">
                        {reviewCount} need review
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Below the {AUTO_APPROVE_THRESHOLD}% threshold — decide manually.
                    </p>
                  </div>
                )}
              </div>
            </Card>
            )}

            <Card hover={false}>
              <CardHeader icon="trending_up" title="Activity" />
              <div className="mt-4 space-y-sm">
                {swapActivity.map((d) => (
                  <div key={d.day} className="flex items-center gap-3">
                    <span className="font-label-sm text-label-sm text-on-surface-variant w-10">{d.day}</span>
                    <div className="flex-1 h-6 bg-surface-variant/30 rounded-md overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${d.pct}%` }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-y-0 left-0 bg-primary/70 rounded-md"
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
        )}
      </section>

      <Drawer open={!!drawer} onClose={() => setDrawer(null)} title="Request details" size="md">
        {drawer && (
          <div className="p-4 space-y-4">
            <Card hover={false}>
              <div className="flex items-center gap-4 mb-4">
                <Avatar
                  initials={(drawer.requester?.name || 'UN').split(' ').map((n) => n[0]).join('')}
                  size="lg"
                />
                <div>
                  <h3 className="font-headline-md text-base font-bold text-on-surface">
                    {drawer.requester?.name || 'Unknown'}
                  </h3>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {drawer.swap.reason || '—'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!confirmSwap}
        onClose={() => { setConfirmSwap(null); setRejectNote('') }}
        onConfirm={executeDecision}
        title={confirmSwap?.approved ? 'Approve swap?' : 'Decline swap?'}
        message={confirmSwap?.approved
          ? `This will approve the swap request. The shift assignments will be updated.`
          : `This will decline the swap request. The employee will be notified.`}
        confirmLabel={confirmSwap?.approved ? 'Approve' : 'Decline'}
        tone={confirmSwap?.approved ? 'primary' : 'danger'}
      >
        {!confirmSwap?.approved && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="reject-note" className="font-label-md text-label-md text-on-surface">
                Reason for declining (optional)
              </label>
              <button
                type="button"
                onClick={loadRejectNote}
                disabled={busyRejectNote}
                className="btn-secondary py-xs px-sm text-xs inline-flex items-center gap-1 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                {busyRejectNote ? 'Writing…' : 'AI fill'}
              </button>
            </div>
            <textarea
              id="reject-note"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="e.g., No coverage available in your department that day. Try another shift."
              rows={3}
              className="w-full rounded-xl border border-outline-variant/50 bg-surface p-3 text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="font-body-xs text-body-xs text-on-surface-variant">
              The employee will see this note in their notification.
            </p>
          </div>
        )}
      </ConfirmDialog>

      {/* AI reasoning modal for single swap */}
      <Modal open={!!reasoning} onClose={() => setReasoning(null)} title="AI reasoning" size="md">
        {reasoning && (
          <div className="space-y-md">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Suggested action</div>
              <div className={`font-headline-md text-2xl font-bold mt-1 ${reasoning.suggestion === 'approve' ? 'text-success' : 'text-warning'}`}>
                {reasoning.suggestion === 'approve' ? 'Approve' : 'Review carefully'}
              </div>
              <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                Fit score: <b>{reasoning.fit_score}%</b>
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

      {/* AI batch reasoning modal */}
      <Modal open={!!batchReasoning} onClose={() => setBatchReasoning(null)} title="Why auto-approve this batch?" size="md">
        {batchReasoning && (
          <div className="space-y-md">
            <div className="p-4 rounded-xl bg-success/5 border border-success/20">
              <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Batch summary</div>
              <div className="font-headline-md text-2xl font-bold text-on-surface mt-1">
                {batchReasoning.count} requests
              </div>
              {batchReasoning.average_fit_score != null && (
                <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                  Average fit score: <b>{batchReasoning.average_fit_score}%</b>
                </div>
              )}
            </div>
            <div>
              <div className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">AI reasoning</div>
              <p className="font-body-lg text-body-lg text-on-surface leading-relaxed">
                {batchReasoning.reasoning}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

function Stat({ label, value, icon, hint }) {
  return (
    <div className="rounded-xl bg-surface border border-outline-variant/30 p-4" title={hint}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
          {label}
        </span>
        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">{icon}</span>
      </div>
      <div className="font-headline-md text-2xl font-bold text-on-surface">{value}</div>
      {hint && (
        <div className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 truncate">
          {hint}
        </div>
      )}
    </div>
  )
}
