import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '../layout/AppShell.jsx'
import Calendar from '../components/Calendar.jsx'
import { Card, CardHeader, Badge, Avatar, Drawer, EmptyState, ListSkeleton, Pagination, RichListItem } from '../components/ui.jsx'
import { useToast } from '../components/Toast.jsx'
import { realAPI } from '../services/realAPI.js'
import { formatDate, formatDateFull, timeLabel, today } from '../data/store.js'
import { isShiftCompleted, isShiftOpen, isShiftUpcoming, shiftBelongsToEmployee } from '../lib/shiftUtils.js'
import { useDebouncedRefresh } from '../hooks/useDebouncedRefresh.js'

export default function EmployeePortal() {
  const toast = useToast()
  const navigate = useNavigate()
  const { user: currentUser } = useUser()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerShift, setDrawerShift] = useState(null)
  const [shiftPhase, setShiftPhase] = useState('upcoming')
  const [shiftPage, setShiftPage] = useState(1)
  const [swapPage, setSwapPage] = useState(1)
  const [myShifts, setMyShifts] = useState([])
  const [openShifts, setOpenShifts] = useState([])
  const [mySwaps, setMySwaps] = useState([])
  const [myLeaves, setMyLeaves] = useState([])
  const [burnout, setBurnout] = useState(null)
  const [loading, setLoading] = useState(false)
  const [requestInFlight, setRequestInFlight] = useState(false)
  const [tradeModal, setTradeModal] = useState(null) // { shift: Shift, openShifts: Shift[], peerShifts: Shift[], suggestions: object }
  const [selectedTradeShift, setSelectedTradeShift] = useState(null)
  const [suggestionsTab, setSuggestionsTab] = useState('pickups') // 'pickups' | 'peer'
  const [swapReason, setSwapReason] = useState('')
  const [busySuggestions, setBusySuggestions] = useState(false)
  const [conflictCheck, setConflictCheck] = useState(null)
  // Per-action busy flags — prevent double-clicks on async buttons.
  const [checkInId, setCheckInId] = useState(null)
  const [checkOutId, setCheckOutId] = useState(null)

  useEffect(() => {
    if (!currentUser?.id) return
    refresh()
  }, [currentUser?.id])

  useDebouncedRefresh(refresh)

  async function refresh(opts = {}) {
    const silent = opts?.silent === true
    const hasData = myShifts.length > 0
    if (!silent && !hasData) setLoading(true)
    try {
      const [sh, open, swaps, burn, lv] = await Promise.all([
        realAPI.getShifts(),
        realAPI.getShifts({ status: 'open' }),
        realAPI.getSwaps({ mine_only: 'true' }),
        realAPI.getBurnoutAnalytics(currentUser.id),
        realAPI.getLeaves({ mine_only: 'true' }),
      ])
      const mine = (sh || []).filter((s) => shiftBelongsToEmployee(s, currentUser.id))
      setMyShifts(mine)
      setOpenShifts(open || [])
      setMySwaps(swaps || [])
      setBurnout(burn)
      setMyLeaves(lv || [])
    } catch (err) {
      toast.push(err.message || 'Could not load', { tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const pendingSwapShiftIds = useMemo(() => {
    return new Set(
      (mySwaps || [])
        .filter((s) => s.status === 'pending')
        .map((s) => s.from_shift_id || s.requester_shift_id)
        .filter(Boolean)
    )
  }, [mySwaps])

  // Determine the next shift BEFORE the filtered memos so they can exclude it.
  const rawUpcoming = useMemo(() => {
    const now = today().toISOString().slice(0, 10)
    return myShifts
      .filter((s) => isShiftUpcoming(s, now))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [myShifts])

  const nextShift = rawUpcoming.find((s) => !s.check_out_at && s.status !== 'completed') || rawUpcoming[0]

  const upcoming = useMemo(() => {
    return rawUpcoming
      .filter((s) => s.id !== nextShift?.id)
      .filter((s) => !pendingSwapShiftIds.has(s.id))
  }, [rawUpcoming, pendingSwapShiftIds, nextShift])

  const completed = useMemo(() => {
    return myShifts
      .filter((s) => isShiftCompleted(s))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [myShifts])

  const visible = shiftPhase === 'upcoming' ? upcoming : completed

  const SHIFT_PAGE_SIZE = 10
  const SWAP_PAGE_SIZE = 8
  const listSource = shiftPhase === 'upcoming' ? upcoming : completed
  const shiftPageItems = listSource.slice((shiftPage - 1) * SHIFT_PAGE_SIZE, shiftPage * SHIFT_PAGE_SIZE)
  const swapPageItems = mySwaps.slice((swapPage - 1) * SWAP_PAGE_SIZE, swapPage * SWAP_PAGE_SIZE)
  const myBuroutScore = burnout?.employees?.[0]?.burnout_score || 0
  const myRiskLevel = burnout?.employees?.[0]?.risk_level || 'low'

  const [elapsed, setElapsed] = useState(0)
  // Live timer for checked-in shift
  useEffect(() => {
    if (!nextShift?.check_in_at || nextShift?.check_out_at) { setElapsed(0); return }
    const update = () => setElapsed(Math.floor((Date.now() - new Date(nextShift.check_in_at).getTime()) / 1000))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [nextShift?.id, nextShift?.check_in_at, nextShift?.check_out_at])

  // Was the next shift just added (within the last 24h)? Used to surface a
  // friendly banner explaining how the shift got onto the employee's schedule.
  function isRecentlyAssigned(shift) {
    if (!shift) return false
    const stamp = shift.updated_at || shift.created_at
    if (!stamp) return false
    const ageMs = Date.now() - new Date(stamp).getTime()
    if (ageMs < 0 || ageMs > 24 * 60 * 60 * 1000) return false
    // Only show for shifts that haven't been touched by the employee (no check-in yet)
    return !shift.check_in_at
  }

  async function requestGiveUp(shift) {
    if (requestInFlight) return
    const note = swapReason.trim() || `Give up ${shift.role || shift.title} on ${formatDate(shift.date)}`
    setRequestInFlight(true)
    try {
      await realAPI.createSwap({
        from_shift_id: shift.id,
        kind: 'release',
        reason: note,
      })
      toast.push('Give-up request submitted — pending admin approval', { tone: 'success', duration: 6000 })
      setTradeModal(null)
      setSelectedTradeShift(null)
      setSwapReason('')
      setConflictCheck(null)
      refresh()
    } catch (err) {
      toast.push(err.message || 'Could not submit give-up request', { tone: 'error' })
    } finally {
      setRequestInFlight(false)
    }
  }

  async function requestTrade(myShift, targetShift) {
    if (requestInFlight) return
    setRequestInFlight(true)
    try {
      const note = swapReason.trim() || tradeModal?.suggestions?.draft_reason || `Requesting to swap into ${targetShift.role || targetShift.title}`
      await realAPI.createSwap({
        from_shift_id: myShift.id,
        responder_shift_id: targetShift.id,
        kind: targetShift.status === 'open' ? 'pickup' : 'swap',
        reason: note,
      })
      toast.push('Swap request submitted — pending admin approval', { tone: 'success' })
      setTradeModal(null)
      setSelectedTradeShift(null)
      setSwapReason('')
      setConflictCheck(null)
      refresh()
    } catch (err) {
      toast.push(err.message || 'Could not request trade', { tone: 'error' })
    } finally {
      setRequestInFlight(false)
    }
  }

  async function openTradeModal(shift) {
    setBusySuggestions(true)
    setSuggestionsTab('pickups')
    setTradeModal({ shift, openShifts: [], peerShifts: [], suggestions: null })
    setSelectedTradeShift(null)
    setSwapReason('')
    setConflictCheck(null)
    try {
      const [open, suggestions] = await Promise.all([
        realAPI.getShifts({ status: 'open' }),
        realAPI.getSwapSuggestions(shift.id),
      ])
      const suggestionIds = new Set([
        ...(suggestions?.pickups || []).map((s) => s.shift_id),
        ...(suggestions?.peer_swaps || []).map((s) => s.shift_id),
      ])
      const suggestedOpen = (open || []).filter((s) => suggestionIds.has(s.id))
      const peerIds = new Set((suggestions?.peer_swaps || []).map((s) => s.shift_id))
      const allShifts = await realAPI.getShifts()
      const peerShifts = (allShifts || []).filter((s) => peerIds.has(s.id))
      setTradeModal({ shift, openShifts: suggestedOpen, peerShifts, suggestions })
      if (suggestions?.draft_reason) setSwapReason(suggestions.draft_reason)
    } catch (err) {
      toast.push(err.message || 'Could not load swap suggestions', { tone: 'error' })
      const available = openShifts.filter((s) => s.id !== shift.id)
      setTradeModal({ shift, openShifts: available, peerShifts: [], suggestions: null })
    } finally {
      setBusySuggestions(false)
    }
  }

  async function runConflictCheck(targetShift) {
    if (!tradeModal) return
    const myShift = tradeModal.shift
    const others = myShifts.filter((s) => s.id !== myShift.id)
    const warnings = []

    // Overlap with current schedule
    if (targetShift.date) {
      const sameDay = others.filter((s) => s.date === targetShift.date)
      const targetStart = targetShift.start_hour ?? 0
      const targetEnd = targetStart + (targetShift.duration_hours ?? 0)
      for (const s of sameDay) {
        const sStart = s.start_hour ?? 0
        const sEnd = sStart + (s.duration_hours ?? 0)
        if (sStart < targetEnd && sEnd > targetStart) {
          warnings.push(`Overlaps with your ${s.role || s.title} shift on ${formatDate(s.date)}.`)
        }
        const gap = Math.abs(targetStart - sEnd)
        if (gap > 0 && gap < 8) {
          warnings.push(`Only ${gap} hours rest between this and your ${s.role || s.title} shift.`)
        }
      }
    }

    // Weekly hour estimate (rough)
    const currentWeekHours = others.reduce((sum, s) => sum + (s.duration_hours || 0), 0) + (targetShift.duration_hours || 0)
    if (currentWeekHours > 40) {
      warnings.push(`This would put you at about ${currentWeekHours} hours this week.`)
    }

    // Department mismatch
    if (targetShift.department && currentUser?.department && targetShift.department !== currentUser.department) {
      warnings.push(`This shift is in ${targetShift.department}, not your usual ${currentUser.department} department.`)
    }

    setConflictCheck({ shiftId: targetShift.id, warnings, safe: warnings.length === 0 })
  }

  async function handleCheckIn(shiftId) {
    if (checkInId || checkOutId) return
    setCheckInId(shiftId)
    try {
      await realAPI.checkInShift(shiftId)
      toast.push('Checked in. Have a great shift!', { tone: 'success' })
      await refresh()
      if (drawerShift?.id === shiftId) {
        const updated = (myShifts || []).find((s) => s.id === shiftId)
        if (updated) setDrawerShift(updated)
      }
    } catch (err) {
      toast.push(err.message || 'Could not check in', { tone: 'error' })
    } finally {
      setCheckInId(null)
    }
  }

  async function handleCheckOut(shiftId) {
    if (checkInId || checkOutId) return
    setCheckOutId(shiftId)
    try {
      await realAPI.checkOutShift(shiftId)
      toast.push('Checked out. Shift recorded.', { tone: 'success', duration: 6000 })
      setShiftPhase('completed')
      await refresh()
      if (drawerShift?.id === shiftId) {
        setDrawerOpen(false)
        setDrawerShift(null)
      }
    } catch (err) {
      toast.push(err.message || 'Could not check out', { tone: 'error' })
    } finally {
      setCheckOutId(null)
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display-sm font-bold text-on-surface">My Portal</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Welcome back, {currentUser?.name?.split(' ')[0] || 'there'} · {currentUser?.department || 'Unassigned'}
        </p>
      </div>

      <section className="page-section space-y-md">
        {loading && !myShifts.length && <ListSkeleton variant="card" count={4} />}

        {/* Auto-fill welcome banner — only if the next shift was just added */}
        {nextShift && isRecentlyAssigned(nextShift) && (
          <Card hover={false} className="border-2 border-success/30 bg-success/5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-success/15 text-success flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  You were just added to this shift
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  {nextShift.role || nextShift.title} on {formatDate(nextShift.date)} · {nextShift.department}
                </p>

              </div>
            </div>
          </Card>
        )}

        {/* Hero card with burnout score — animated when next shift changes */}
        <Card hover={false}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={nextShift?.id || 'empty'}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Next shift</div>
                  {nextShift ? (
                    <>
                      <h2 className="font-display-md text-display-md font-bold text-on-surface mt-1">{nextShift.role || nextShift.title}</h2>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="flex items-center gap-1 font-body-md text-body-md text-on-surface-variant">
                          <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                          {formatDate(nextShift.date)}
                        </span>
                        <span className="flex items-center gap-1 font-body-md text-body-md text-on-surface-variant">
                          <span className="material-symbols-outlined text-[18px]">schedule</span>
                          {timeLabel(nextShift.start_hour)} · {nextShift.duration_hours}h
                        </span>
                        <Badge variant="primary">{nextShift.department}</Badge>
                      </div>

                      {/* Live timer when checked in */}
                      {nextShift.check_in_at && !nextShift.check_out_at && (
                        <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary text-[22px]">timer</span>
                          <div>
                            <div className="font-headline-md text-xl font-bold text-primary tabular-nums">
                              {formatElapsed(elapsed)}
                            </div>
                            <div className="font-label-sm text-label-sm text-on-surface-variant">Elapsed time</div>
                          </div>
                        </div>
                      )}

                      {/* Total time when completed */}
                      {nextShift.check_in_at && nextShift.check_out_at && (
                        <div className="mt-4 p-3 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3">
                          <span className="material-symbols-outlined text-success text-[22px]">check_circle</span>
                          <div>
                            <div className="font-headline-md text-xl font-bold text-success tabular-nums">
                              {formatElapsed(Math.floor((new Date(nextShift.check_out_at).getTime() - new Date(nextShift.check_in_at).getTime()) / 1000))}
                            </div>
                            <div className="font-label-sm text-label-sm text-on-surface-variant">Total time worked</div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mt-4 flex-wrap">
                        <button onClick={() => { setDrawerShift(nextShift); setDrawerOpen(true) }} className="btn-primary text-sm">
                          View details
                        </button>
                        {!nextShift.check_in_at && (
                          <>
                            <button onClick={() => openTradeModal(nextShift)} disabled={requestInFlight} className="btn-secondary text-sm disabled:opacity-60">
                              <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                              Swap / give up
                            </button>
                            <button
                              onClick={() => handleCheckIn(nextShift.id)}
                              disabled={checkInId === nextShift.id || checkOutId !== null}
                              className="btn-secondary text-sm disabled:opacity-60"
                            >
                              <span className="material-symbols-outlined text-[16px]">{checkInId === nextShift.id ? 'progress_activity' : 'login'}</span>
                              {checkInId === nextShift.id ? 'Checking in…' : 'Check in'}
                            </button>
                          </>
                        )}
                        {nextShift.check_in_at && !nextShift.check_out_at && (
                          <button
                            onClick={() => handleCheckOut(nextShift.id)}
                            disabled={checkOutId === nextShift.id || checkInId !== null}
                            className="btn-primary text-sm disabled:opacity-60"
                          >
                            <span className="material-symbols-outlined text-[16px]">{checkOutId === nextShift.id ? 'progress_activity' : 'logout'}</span>
                            {checkOutId === nextShift.id ? 'Checking out…' : 'Check out'}
                          </button>
                        )}
                        {nextShift.check_in_at && nextShift.check_out_at && (
                          <span className="chip bg-success/10 text-success text-xs">Completed</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="font-body-md text-body-md text-on-surface-variant mt-2">No upcoming shifts scheduled. Browse open shifts to pick one up.</p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-4">
              <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Burnout risk</div>
              <div className={`font-display-lg text-display-lg font-bold mt-1 ${myBuroutScore >= 70 ? 'text-error' : myBuroutScore >= 40 ? 'text-warning' : 'text-success'}`}>
                {myBuroutScore}
              </div>
              <div className="font-label-sm text-label-sm text-on-surface-variant">{myRiskLevel} risk</div>
              <p className="text-xs text-on-surface-variant mt-2">
                {myBuroutScore >= 70
                  ? 'Consider taking time off or swapping shifts.'
                  : myBuroutScore >= 40
                    ? 'Watch your hours this week.'
                    : "You're in a healthy range. Keep it up."}
              </p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-outline-variant/30 overflow-x-auto">
              {[
                { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
                { id: 'completed', label: 'Completed', count: completed.length },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setShiftPhase(t.id); setShiftPage(1) }}
                  className={`px-4 py-2.5 font-label-md text-label-md transition-all border-b-2 whitespace-nowrap ${shiftPhase === t.id
                      ? 'border-primary text-primary font-bold'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  {t.label}
                  {t.count > 0 && <span className="ml-1 chip bg-primary/10 text-primary text-[10px]">{t.count}</span>}
                </button>
              ))}
              <div className="flex-1" />
              <button onClick={() => navigate('/app/availability')} className="text-sm text-primary hover:underline">Set availability →</button>
            </div>

            {/* Shift list */}
            {visible.length === 0 ? (
              <Card hover={false}>
                <EmptyState
                  icon="event_busy"
                  title={shiftPhase === 'upcoming' ? 'No upcoming shifts' : 'No completed shifts'}
                  description={shiftPhase === 'upcoming' ? 'Browse open shifts to pick up extra hours.' : 'Your history will appear here.'}
                />
              </Card>
            ) : (
              <div className="space-y-sm">
                {shiftPageItems.map((s) => (
                  <Card key={s.id} hover={false}>
                    <div className="flex items-center gap-md flex-wrap">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[22px]">event</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-label-md text-label-md font-bold text-on-surface">{s.role || s.title}</h3>
                          <Badge variant="success">{s.department}</Badge>
                        </div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                          {formatDate(s.date)} · {timeLabel(s.start_hour)} · {s.duration_hours}h
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setDrawerShift(s); setDrawerOpen(true) }} className="btn-secondary text-xs py-1.5 px-3">
                          Details
                        </button>
                        {shiftPhase === 'upcoming' && !s.check_in_at && !s.check_out_at && (
                          <>
                            <button onClick={() => openTradeModal(s)} disabled={requestInFlight} className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-60">
                              Swap / give up
                            </button>
                          </>
                        )}
                        {s.check_in_at && s.check_out_at && (
                          <span className="chip bg-success/10 text-success text-xs">Done</span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                <Pagination page={shiftPage} pageSize={SHIFT_PAGE_SIZE} total={listSource.length} onChange={setShiftPage} />
              </div>
            )}

            {/* Swap requests */}
            {mySwaps.length > 0 && (
              <Card hover={false}>
                <CardHeader icon="swap_horiz" title="My swap requests" />
                <div className="mt-4 space-y-2">
                  {swapPageItems.map((sw) => {
                    const swapStatusVariant =
                      sw.status === 'approved' ? 'success' :
                        sw.status === 'rejected' || sw.status === 'declined' ? 'error' : 'warning'
                    const swapStatusIcon =
                      sw.status === 'approved' ? 'check_circle' :
                        sw.status === 'rejected' || sw.status === 'declined' ? 'cancel' : 'hourglass_top'
                    const swapKind =
                      sw.kind === 'pickup' ? 'Pickup' :
                      sw.kind === 'release' ? 'Give up' : 'Swap'
                    return (
                      <RichListItem
                        key={sw.id}
                        icon={swapStatusIcon}
                        iconColor={swapStatusVariant}
                        title={`${swapKind}: ${sw.reason || 'Shift request'}`}
                        subtitle={`Submitted ${formatDate(sw.created_at)}`}
                        status={{ variant: swapStatusVariant, label: sw.status }}
                      />
                    )
                  })}
                  <Pagination page={swapPage} pageSize={SWAP_PAGE_SIZE} total={mySwaps.length} onChange={setSwapPage} />
                </div>
              </Card>
            )}

            {/* Leave requests */}
            {myLeaves.length > 0 && (
              <Card hover={false}>
                <CardHeader icon="event_busy" title="My absence requests" />
                <div className="mt-4 space-y-2">
                  {myLeaves.map((lv) => {
                    const leaveStatusVariant =
                      lv.status === 'approved' ? 'success' :
                        lv.status === 'declined' ? 'error' : 'warning'
                    const leaveStatusIcon =
                      lv.status === 'approved' ? 'check_circle' :
                        lv.status === 'declined' ? 'cancel' : 'hourglass_top'
                    return (
                      <RichListItem
                        key={lv.id}
                        icon={leaveStatusIcon}
                        iconColor={leaveStatusVariant}
                        title={lv.reason || 'Absence request'}
                        subtitle={`${formatDate(lv.start_date)}${lv.end_date ? ` → ${formatDate(lv.end_date)}` : ''}`}
                        status={{ variant: leaveStatusVariant, label: lv.status }}
                      />
                    )
                  })}
                </div>
              </Card>
        )}

        {/* Calendar */}
        <Card hover={false}>
          <CardHeader icon="calendar_month" title="Schedule" />
          <div className="mt-md">
            <Calendar
              events={myShifts.map((s) => ({ ...s, date: s.date, title: s.role || s.title }))}
            />
          </div>
        </Card>
      </section>

      {/* Shift details drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={drawerShift?.role || drawerShift?.title || ''} subtitle={drawerShift ? `${drawerShift.department} · ${formatDate(drawerShift.date)}` : ''}>
        {drawerShift && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Date</div>
                <div className="font-label-md text-label-md text-on-surface">{formatDate(drawerShift.date)}</div>
              </div>
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Time</div>
                <div className="font-label-md text-label-md text-on-surface">{timeLabel(drawerShift.start_hour)} · {drawerShift.duration_hours}h</div>
              </div>
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Department</div>
                <div className="font-label-md text-label-md text-on-surface">{drawerShift.department}</div>
              </div>
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Status</div>
                <Badge variant={drawerShift.status === 'active' ? 'success' : 'warning'}>{drawerShift.status}</Badge>
              </div>
            </div>
            {drawerShift.date >= today().toISOString().slice(0, 10) && (
              <div className="rounded-xl bg-surface-variant/30 p-3 flex items-center gap-2 text-sm flex-wrap">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">schedule</span>
                {drawerShift.check_in_at ? (
                  drawerShift.check_out_at ? (
                    <span>
                      Checked in at {new Date(drawerShift.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · checked out at {new Date(drawerShift.check_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : (
                    <span>
                      Checked in at {new Date(drawerShift.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — in progress
                    </span>
                  )
                ) : (
                  <span>Not yet checked in</span>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Only the next shift gets check-in/out buttons. */}
              {drawerShift.id === nextShift?.id && !drawerShift.check_in_at && (
                <button
                  onClick={() => handleCheckIn(drawerShift.id)}
                  disabled={checkInId === drawerShift.id || checkOutId !== null}
                  className="btn-primary justify-center disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">{checkInId === drawerShift.id ? 'progress_activity' : 'login'}</span>
                  {checkInId === drawerShift.id ? 'Checking in…' : 'Check in'}
                </button>
              )}
              {drawerShift.id === nextShift?.id && drawerShift.check_in_at && !drawerShift.check_out_at && (
                <button
                  onClick={() => handleCheckOut(drawerShift.id)}
                  disabled={checkOutId === drawerShift.id || checkInId !== null}
                  className="btn-primary justify-center disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">{checkOutId === drawerShift.id ? 'progress_activity' : 'logout'}</span>
                  {checkOutId === drawerShift.id ? 'Checking out…' : 'Check out'}
                </button>
              )}
              {!drawerShift.check_in_at && !drawerShift.check_out_at && (
                <button onClick={() => { if (requestInFlight) return; setDrawerOpen(false); openTradeModal(drawerShift) }} disabled={requestInFlight} className="btn-secondary justify-center disabled:opacity-60">
                  <span className="material-symbols-outlined text-[18px]">swap_horiz</span> Swap / give up
                </button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Swap modal */}
      {tradeModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/40 z-[110] flex items-center justify-center p-4"
          onClick={() => { setTradeModal(null); setSelectedTradeShift(null); setSwapReason(''); setConflictCheck(null) }}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface rounded-2xl p-6 max-w-2xl w-full shadow-soft-xl max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Change this shift</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Pick up an open shift, trade with a coworker, or give this shift back to the marketplace.
                </p>
              </div>
              <button
                onClick={() => { setTradeModal(null); setSelectedTradeShift(null); setSwapReason(''); setConflictCheck(null) }}
                className="w-8 h-8 rounded-full bg-surface-variant/60 flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-variant/30 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">event</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-label-md text-label-md font-bold text-on-surface truncate">
                  {tradeModal.shift.role || tradeModal.shift.title}
                </div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">
                  {formatDate(tradeModal.shift.date)} · {timeLabel(tradeModal.shift.start_hour)} · {tradeModal.shift.department}
                </div>
              </div>
              <Badge variant="warning">Your shift</Badge>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-surface-variant/60 p-1 rounded-xl mb-4 w-fit flex-wrap">
              {[
                { id: 'pickups', label: `Open shifts${tradeModal.suggestions?.pickups ? ` (${tradeModal.suggestions.pickups.length})` : ''}` },
                { id: 'peer', label: `Peer trades${tradeModal.suggestions?.peer_swaps ? ` (${tradeModal.suggestions.peer_swaps.length})` : ''}` },
                { id: 'giveup', label: 'Give up shift' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setSuggestionsTab(t.id); setSelectedTradeShift(null); setConflictCheck(null) }}
                  className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all ${suggestionsTab === t.id
                      ? 'bg-surface shadow-soft-sm text-primary font-bold'
                      : 'text-on-surface-variant'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {busySuggestions && (
              <div className="flex items-center gap-2 py-6 text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                <span className="font-body-sm">AI is finding your best options…</span>
              </div>
            )}

            {!busySuggestions && suggestionsTab === 'giveup' && (
              <div className="flex-1 space-y-4">
                <div className="p-4 rounded-xl bg-warning/5 border border-warning/20">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-warning text-[22px]">exit_to_app</span>
                    <div>
                      <p className="font-label-md text-label-md font-bold text-on-surface">Give up this shift</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        You&apos;ll be removed from this shift if your admin approves. The shift goes back to the
                        marketplace for someone else to pick up. Use <strong>Absence requests</strong> for multi-day time off.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="giveup-reason" className="font-label-md text-label-md text-on-surface">Reason (optional)</label>
                  <textarea
                    id="giveup-reason"
                    value={swapReason}
                    onChange={(e) => setSwapReason(e.target.value)}
                    placeholder="e.g. Appointment conflict, not feeling well for this shift…"
                    rows={3}
                    className="w-full rounded-xl border border-outline-variant/50 bg-surface p-3 text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>
              </div>
            )}

            {!busySuggestions && suggestionsTab !== 'giveup' && (
              <>
                <div className="flex-1 overflow-y-auto space-y-2 -mx-2 px-2">
                  {(suggestionsTab === 'pickups' ? tradeModal.openShifts : tradeModal.peerShifts).length === 0 ? (
                    <div className="p-6 text-center">
                      <span className="material-symbols-outlined text-on-surface-variant text-[32px]">event_busy</span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
                        {suggestionsTab === 'pickups'
                          ? 'No open shifts available right now.'
                          : 'No peer trades available right now.'}
                      </p>
                    </div>
                  ) : (
                    (suggestionsTab === 'pickups' ? tradeModal.openShifts : tradeModal.peerShifts).map((s) => {
                      const isSelected = selectedTradeShift?.id === s.id
                      const suggestion = (suggestionsTab === 'pickups'
                        ? tradeModal.suggestions?.pickups
                        : tradeModal.suggestions?.peer_swaps
                      )?.find((x) => x.shift_id === s.id)
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            setSelectedTradeShift(s)
                            runConflictCheck(s)
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-outline-variant/30 bg-surface-variant/20 hover:border-outline-variant/60'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'
                              }`}>
                              <span className="material-symbols-outlined text-[20px]">event</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="font-label-md text-label-md font-bold text-on-surface truncate">
                                  {s.role || s.title}
                                </div>
                                {suggestion && (
                                  <Badge variant={
                                    suggestion.risk === 'low' ? 'success' : suggestion.risk === 'medium' ? 'warning' : 'error'
                                  }>
                                    {suggestion.score}% match
                                  </Badge>
                                )}
                              </div>
                              <div className="font-label-sm text-label-sm text-on-surface-variant">
                                {formatDateFull(s.date)} · {s.department}
                              </div>
                              <div className="font-label-sm text-label-sm text-on-surface-variant">
                                {timeLabel(s.start_hour)}–{timeLabel(s.start_hour + s.duration_hours)} · {s.duration_hours}h
                              </div>
                              {suggestion && (
                                <p className="font-body-xs text-body-xs text-on-surface-variant mt-1">{suggestion.reason}</p>
                              )}
                            </div>
                            {isSelected && (
                              <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0">check_circle</span>
                            )}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>

                {selectedTradeShift && conflictCheck?.shiftId === selectedTradeShift.id && (
                  <div className={`mt-4 p-3 rounded-xl border ${conflictCheck.safe ? 'bg-success/5 border-success/20' : 'bg-warning/5 border-warning/20'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`material-symbols-outlined ${conflictCheck.safe ? 'text-success' : 'text-warning'}`}>
                        {conflictCheck.safe ? 'check_circle' : 'warning'}
                      </span>
                      <span className={`font-label-md font-bold ${conflictCheck.safe ? 'text-success' : 'text-warning'}`}>
                        {conflictCheck.safe ? 'Looks good to submit' : 'Check before submitting'}
                      </span>
                    </div>
                    {conflictCheck.warnings.length > 0 && (
                      <ul className="list-disc list-inside font-body-sm text-body-sm text-on-surface-variant space-y-1">
                        {conflictCheck.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="swap-reason" className="font-label-md text-label-md text-on-surface">Reason for swap</label>
                    <button
                      type="button"
                      onClick={() => {
                        const draft = tradeModal.suggestions?.draft_reason
                        if (draft) setSwapReason(draft)
                      }}
                      disabled={!tradeModal.suggestions?.draft_reason}
                      className="btn-secondary py-xs px-sm text-xs inline-flex items-center gap-1 disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                      AI fill
                    </button>
                  </div>
                  <textarea
                    id="swap-reason"
                    value={swapReason}
                    onChange={(e) => setSwapReason(e.target.value)}
                    placeholder="Why do you want to swap this shift?"
                    rows={2}
                    className="w-full rounded-xl border border-outline-variant/50 bg-surface p-3 text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>
              </>
            )}

            <div className="mt-4 pt-4 border-t border-outline-variant/30 flex items-center justify-end gap-2">
              <button
                onClick={() => { setTradeModal(null); setSelectedTradeShift(null); setSwapReason(''); setConflictCheck(null) }}
                className="btn-ghost text-sm"
              >
                Cancel
              </button>
              {suggestionsTab === 'giveup' ? (
                <button
                  onClick={() => requestGiveUp(tradeModal.shift)}
                  disabled={requestInFlight || busySuggestions}
                  className="btn-primary text-sm disabled:opacity-60"
                >
                  {requestInFlight ? 'Submitting…' : 'Request give up'}
                </button>
              ) : (
                <button
                  onClick={() => selectedTradeShift && requestTrade(tradeModal.shift, selectedTradeShift)}
                  disabled={!selectedTradeShift || requestInFlight || busySuggestions}
                  className="btn-primary text-sm disabled:opacity-60"
                >
                  {requestInFlight ? 'Submitting…' : selectedTradeShift ? `Request ${suggestionsTab === 'peer' ? 'trade' : 'pickup'}` : 'Select a shift'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}