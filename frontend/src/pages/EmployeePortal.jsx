import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../layout/AppShell.jsx'
import Calendar from '../components/Calendar.jsx'
import { Card, CardHeader, Badge, Avatar, Drawer, EmptyState, ListSkeleton, Pagination } from '../components/ui.jsx'
import { useToast } from '../components/Toast.jsx'
import { realAPI } from '../services/realAPI.js'
import { formatDate, timeLabel, today } from '../data/store.js'

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
  const [burnout, setBurnout] = useState(null)
  const [loading, setLoading] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileEdit, setProfileEdit] = useState(null)

  useEffect(() => {
    if (!currentUser?.id) return
    refresh()
  }, [currentUser?.id])

  async function refresh() {
    setLoading(true)
    try {
      const [sh, open, swaps, burn] = await Promise.all([
        realAPI.getShifts(),
        realAPI.getShifts({ status: 'open' }),
        realAPI.getSwaps({ mine_only: 'true' }),
        realAPI.getBurnoutAnalytics(currentUser.id),
      ])
      const mine = (sh || []).filter((s) => (s.assigned_staff || []).includes(currentUser.id))
      setMyShifts(mine)
      setOpenShifts(open || [])
      setMySwaps(swaps || [])
      setBurnout(burn)
    } catch (err) {
      toast.push(err.message || 'Could not load', { tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const upcoming = useMemo(() => {
    const now = today().toISOString().slice(0, 10)
    return myShifts.filter((s) => s.date >= now).sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [myShifts])

  const completed = useMemo(() => {
    const now = today().toISOString().slice(0, 10)
    return myShifts.filter((s) => s.date < now).sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [myShifts])

  const visible = shiftPhase === 'upcoming' ? upcoming : completed

  const SHIFT_PAGE_SIZE = 10
  const SWAP_PAGE_SIZE = 8
  const shiftPageItems = visible.slice((shiftPage - 1) * SHIFT_PAGE_SIZE, shiftPage * SHIFT_PAGE_SIZE)
  const swapPageItems = mySwaps.slice((swapPage - 1) * SWAP_PAGE_SIZE, swapPage * SWAP_PAGE_SIZE)

  const nextShift = upcoming[0]
  const myBuroutScore = burnout?.employees?.[0]?.burnout_score || 0
  const myRiskLevel = burnout?.employees?.[0]?.risk_level || 'low'

  async function requestSwapForShift(shiftId) {
    try {
      await realAPI.createSwap({ from_shift_id: shiftId, reason: 'Swap request from my portal' })
      toast.push('Swap request submitted', { tone: 'success' })
      refresh()
    } catch (err) {
      toast.push(err.message || 'Could not request swap', { tone: 'error' })
    }
  }

  async function saveProfile(e) {
    e.preventDefault()
    try {
      await realAPI.updateEmployee(currentUser.id, profileEdit)
      toast.push('Profile updated', { tone: 'success' })
      setProfileOpen(false)
      refresh()
    } catch (err) {
      toast.push(err.message || 'Could not save', { tone: 'error' })
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

        {/* Hero card with burnout score */}
        <Card hover={false}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
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
                </>
              ) : (
                <p className="font-body-md text-body-md text-on-surface-variant mt-2">No upcoming shifts scheduled. Browse open shifts to pick one up.</p>
              )}
              {nextShift && (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => { setDrawerShift(nextShift); setDrawerOpen(true) }} className="btn-primary text-sm">
                    View details
                  </button>
                  <button onClick={() => requestSwapForShift(nextShift.id)} className="btn-secondary text-sm">
                    <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                    Request swap
                  </button>
                </div>
              )}
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
              className={`px-4 py-2.5 font-label-md text-label-md transition-all border-b-2 whitespace-nowrap ${
                shiftPhase === t.id
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
                    {shiftPhase === 'upcoming' && (
                      <button onClick={() => requestSwapForShift(s.id)} className="btn-ghost text-xs py-1.5 px-3">
                        Swap
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            <Pagination page={shiftPage} pageSize={SHIFT_PAGE_SIZE} total={visible.length} onChange={setShiftPage} />
          </div>
        )}

        {/* Swap requests */}
        {mySwaps.length > 0 && (
          <Card hover={false}>
            <CardHeader icon="swap_horiz" title="My swap requests" />
            <div className="mt-4 space-y-2">
              {swapPageItems.map((sw) => (
                <div key={sw.id} className="flex items-center gap-md p-md rounded-lg border border-outline-variant/30">
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    sw.status === 'approved' ? 'bg-success/10 text-success' :
                    sw.status === 'rejected' || sw.status === 'declined' ? 'bg-error/10 text-error' :
                    'bg-warning/10 text-warning'
                  }`}>
                    <span className="material-symbols-outlined text-[18px]">
                      {sw.status === 'approved' ? 'check_circle' : sw.status === 'rejected' || sw.status === 'declined' ? 'cancel' : 'hourglass_top'}
                    </span>
                  </span>
                  <div className="flex-1">
                    <div className="font-label-md text-label-md font-bold text-on-surface">{sw.reason || 'Swap request'}</div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant">
                      Submitted {formatDate(sw.created_at || sw.submittedAt)} · Status: <b>{sw.status}</b>
                    </div>
                  </div>
                </div>
              ))}
              <Pagination page={swapPage} pageSize={SWAP_PAGE_SIZE} total={mySwaps.length} onChange={setSwapPage} />
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

        {/* Profile */}
        <Card hover={false}>
          <CardHeader
            icon="person"
            title="Profile"
            action={
              <button
                onClick={() => {
                  setProfileEdit({
                    name: currentUser?.name,
                    phone: currentUser?.phone || '',
                    bio: currentUser?.bio || '',
                    department: currentUser?.department,
                  })
                  setProfileOpen(true)
                }}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Edit
              </button>
            }
          />
          <div className="mt-md grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name" value={currentUser?.name} />
            <Field label="Email" value={currentUser?.email} />
            <Field label="Department" value={currentUser?.department} />
            <Field label="Role" value={currentUser?.role} />
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
            {drawerShift.certifications?.length > 0 && (
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant mb-1">Certifications</div>
                <div className="flex flex-wrap gap-1">
                  {drawerShift.certifications.map((c) => (
                    <span key={c} className="chip bg-success/10 text-success text-xs">{c}</span>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => { setDrawerOpen(false); requestSwapForShift(drawerShift.id) }} className="btn-primary w-full justify-center">
              <span className="material-symbols-outlined text-[18px]">swap_horiz</span> Request swap
            </button>
          </div>
        )}
      </Drawer>

      {/* Profile edit drawer */}
      <Drawer open={profileOpen} onClose={() => setProfileOpen(false)} title="Edit profile">
        {profileEdit && (
          <form onSubmit={saveProfile} className="p-4 space-y-md">
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Full name</label>
              <input value={profileEdit.name || ''} onChange={(e) => setProfileEdit({ ...profileEdit, name: e.target.value })} className="input-base mt-xs w-full" />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Phone</label>
              <input value={profileEdit.phone || ''} onChange={(e) => setProfileEdit({ ...profileEdit, phone: e.target.value })} className="input-base mt-xs w-full" />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Bio</label>
              <textarea value={profileEdit.bio || ''} onChange={(e) => setProfileEdit({ ...profileEdit, bio: e.target.value })} className="input-base mt-xs w-full min-h-[80px] resize-none" />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Department</label>
              <input value={profileEdit.department || ''} onChange={(e) => setProfileEdit({ ...profileEdit, department: e.target.value })} className="input-base mt-xs w-full" />
            </div>
            <div className="flex items-center justify-end gap-sm pt-sm border-t border-outline-variant/30">
              <button type="button" onClick={() => setProfileOpen(false)} className="btn-ghost">Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        )}
      </Drawer>
    </>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">{label}</div>
      <div className="font-label-md text-label-md text-on-surface mt-0.5">{value || '—'}</div>
    </div>
  )
}