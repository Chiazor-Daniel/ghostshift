import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../layout/AppShell.jsx'
import Calendar from '../components/Calendar.jsx'
import { Card, CardHeader, Badge, Avatar, Drawer } from '../components/ui.jsx'
import { useToast } from '../components/Toast.jsx'
import {
  getShiftsForEmployee,
  getEmployee,
  getShifts,
  updateShift,
  updateEmployee,
  computeBurnout,
  addSwap,
  getCertExpiryAlerts,
  formatDate,
  formatDateFull,
  timeLabel,
  today,
} from '../data/store.js'

export default function EmployeePortal() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerShift, setDrawerShift] = useState(null)
  const [shiftPhase, setShiftPhase] = useState('upcoming')
  const [remaining, setRemaining] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileEdit, setProfileEdit] = useState(null)
  const toast = useToast()
  const navigate = useNavigate()
  const user = useUser()

  const savedShifts = useMemo(() => getShiftsForEmployee(user.user.id), [user.user.id])
  const burnout = useMemo(() => computeBurnout(user.user.id), [user.user.id])
  const myCertAlerts = useMemo(() => getCertExpiryAlerts().filter(a => a.employeeId === user.user.id), [user.user.id])

  const nextShift = useMemo(() => {
    const now = today()
    return savedShifts
      .filter(s => s.status !== 'completed' && s.status !== 'open')
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .find(s => new Date(s.date) >= new Date(now.toISOString().slice(0, 10)))
  }, [savedShifts])

  const colleagueIds = useMemo(() => {
    if (!nextShift) return []
    const allShifts = getShifts()
    const d = typeof nextShift.date === 'string' ? nextShift.date : nextShift.date.toISOString?.() || ''
    return allShifts
      .filter(s => {
        const sd = typeof s.date === 'string' ? s.date : s.date.toISOString?.() || ''
        return sd === d && s.department === nextShift.department && s.employeeId !== user.user.id
      })
      .map(s => s.employeeId)
      .slice(0, 4)
  }, [nextShift, user.user.id])

  function removeShift(id) {
    updateShift(id, { employeeId: null, status: 'open' })
    setDrawerOpen(false)
    toast.push('Shift unassigned and returned to open shifts', { tone: 'info' })
  }

  useEffect(() => {
    if (shiftPhase !== 'active' || remaining === null) return
    if (remaining <= 0) {
      setShiftPhase('completed')
      setRemaining(null)
      if (nextShift) {
        updateShift(nextShift.id, { status: 'completed' })
        toast.push(`Shift completed · ${nextShift.durationHours}h logged`, { tone: 'success' })
      }
      return
    }
    const id = setInterval(() => setRemaining((r) => r - 1), 1000)
    return () => clearInterval(id)
  }, [shiftPhase, remaining, nextShift, toast])

  const SHIFT_END_HOUR = 19
  const SHIFT_END_MIN = 0

  function startShift() {
    const now = new Date()
    const end = new Date(now)
    end.setHours(SHIFT_END_HOUR, SHIFT_END_MIN, 0, 0)
    const secs = Math.max(0, Math.floor((end - now) / 1000))
    setRemaining(secs)
    setShiftPhase('active')
    toast.push('Checked in · 07:02', { tone: 'success' })
  }

  const score = burnout.score

  function formatCountdown(secs) {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    if (h > 0) return `${h}h ${m}m remaining`
    return `${m}m ${secs % 60}s remaining`
  }

  const trendIcon = burnout.trend === 'up' ? 'trending_up' : burnout.trend === 'down' ? 'trending_down' : 'trending_flat'

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display-sm font-bold text-on-surface">My Portal</h1>
        <button onClick={() => setProfileOpen(true)} className="btn-secondary">
          <span className="material-symbols-outlined text-[18px]">person</span>
          View profile
        </button>
      </div>
      <section className="page-section">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Card className="lg:col-span-6" hover>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Next shift</span>
              <span className={`chip text-xs ${
                shiftPhase === 'completed' ? 'bg-surface-variant text-on-surface-variant' : 
                shiftPhase === 'active' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
              }`}>
                {shiftPhase === 'upcoming' ? (nextShift ? `${nextShift.durationHours}h` : 'None') : shiftPhase === 'active' ? 'Active' : 'Done'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-on-surface">{nextShift?.title || 'No upcoming shift'}</div>
                <div className="text-sm text-on-surface-variant mt-1">
                  {nextShift
                    ? `${formatDateFull(nextShift.date)} · ${timeLabel(nextShift.startHour)} – ${timeLabel(nextShift.startHour + nextShift.durationHours)}`
                    : 'No shifts scheduled'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-outline-variant/30 flex-wrap">
              {colleagueIds.length > 0 && (
                <>
                  <div className="w-full mb-2">
                    <div className="font-label-sm text-label-sm text-on-surface-variant mb-2">
                      Your team ({colleagueIds.length + 1} people)
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                        <Avatar
                          src={user.user.avatar}
                          initials={user.user.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || '??'}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-label-sm text-label-sm font-bold text-on-surface truncate">
                            {user.user.name} (You)
                          </div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">
                            {user.user.title || user.user.role}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-label-sm text-label-sm font-bold ${score >= 70 ? 'text-error' : score >= 40 ? 'text-warning' : 'text-success'}`}>
                            {score}
                          </div>
                          <div className="font-label-sm text-[10px] text-on-surface-variant">risk</div>
                        </div>
                      </div>
                      {colleagueIds.map((eid) => {
                        const emp = getEmployee(eid)
                        const empBurnout = emp ? computeBurnout(eid) : null
                        return (
                          <div key={eid} className="flex items-center gap-2 p-2 rounded-lg bg-surface-variant/30">
                            <Avatar
                              src={emp?.avatar}
                              initials={emp?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || '??'}
                              size="sm"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-label-sm text-label-sm font-bold text-on-surface truncate">
                                {emp?.name}
                              </div>
                              <div className="font-label-sm text-label-sm text-on-surface-variant">
                                {emp?.title || emp?.role}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-label-sm text-label-sm font-bold ${empBurnout?.score >= 70 ? 'text-error' : empBurnout?.score >= 40 ? 'text-warning' : 'text-success'}`}>
                                {empBurnout?.score || 0}
                              </div>
                              <div className="font-label-sm text-[10px] text-on-surface-variant">risk</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
              <div className="hidden sm:block flex-1" />
              {shiftPhase === 'upcoming' && nextShift && (
                <button onClick={startShift} className="btn-primary px-4 py-2 text-sm">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Check in
                </button>
              )}
              {shiftPhase === 'upcoming' && !nextShift && (
                <button disabled className="px-4 py-2 text-sm rounded-xl bg-surface-variant text-on-surface-variant opacity-60 cursor-not-allowed flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Check in
                </button>
              )}
              {shiftPhase === 'active' && (
                <div className="flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-xl text-sm font-semibold">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span className="tabular-nums">{formatCountdown(remaining)}</span>
                </div>
              )}
              {shiftPhase === 'completed' && (
                <div className="flex items-center gap-2 bg-surface-variant/60 text-on-surface-variant px-4 py-2 rounded-xl text-sm font-semibold">
                  <span className="material-symbols-outlined text-[18px]">task_alt</span>
                  {nextShift ? `${nextShift.durationHours}h worked` : 'Shift completed'}
                </div>
              )}
            </div>
          </Card>

          <Card className={`lg:col-span-6 relative ${
            score >= 70 ? 'bg-error/5 border-error/20' : score >= 40 ? 'bg-warning/5 border-warning/20' : 'bg-success/5 border-success/20'
          }`} hover={false}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full animate-pulse ${
                  score >= 70 ? 'bg-error' : score >= 40 ? 'bg-warning' : 'bg-success'
                }`} />
                <span className="font-label-md text-label-md font-semibold text-on-surface">Burnout risk</span>
              </div>
              <Badge variant={score >= 70 ? 'error' : score >= 40 ? 'warning' : 'success'}>
                {score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low'}
              </Badge>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <div className={`font-display-lg text-5xl font-bold leading-none ${
                  score >= 70 ? 'text-error' : score >= 40 ? 'text-warning' : 'text-success'
                }`}>
                  {score}
                </div>
                <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">Risk index (0-100)</div>
              </div>
              <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px]">{trendIcon}</span>
                <span className={score >= 70 ? 'text-error font-medium' : 'text-success font-medium'}>
                  {burnout.trend === 'up' ? 'up' : burnout.trend === 'down' ? 'down' : 'stable'}
                </span>
                <span>from last month</span>
              </div>
            </div>

            <div className="h-12 mt-3">
              <svg viewBox="0 0 300 40" className="w-full h-full" preserveAspectRatio="none">
                <path
                  d="M0 30 L40 30 L50 30 L55 10 L65 32 L75 32 L85 32 L95 32 L105 32 L110 32 L115 12 L125 33 L300 33"
                  fill="none"
                  stroke={score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#22c55e'}
                  strokeWidth="2"
                  className="opacity-60"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M0 30 L40 30 L50 30 L55 10 L65 32 L75 32 L85 32 L95 32 L105 32 L110 32 L115 12 L125 33 L300 33"
                  fill="none"
                  stroke={score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#22c55e'}
                  strokeWidth="6"
                  className="opacity-10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="flex items-center gap-4 text-xs text-on-surface-variant mt-2">
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  score >= 70 ? 'bg-error' : 'bg-success'
                }`} />
                {burnout.hoursThisWeek}h this week
              </span>
              <span className="material-symbols-outlined text-[14px]">hotel</span> {burnout.overtime > 0 ? `${burnout.overtime}h OT` : 'No OT'}
            </div>
          </Card>
        </div>

        {myCertAlerts.length > 0 && (
          <div className="mt-4 rounded-xl bg-warning/5 border border-warning/20 p-md flex items-start gap-sm">
            <span className="material-symbols-outlined text-warning text-[20px] flex-shrink-0">verified_user</span>
            <div>
              <div className="font-label-md text-label-md font-bold text-warning">Certification{myCertAlerts.length === 1 ? '' : 's'} expiring soon</div>
              <div className="mt-1 space-y-0.5">
                {myCertAlerts.map((a) => (
                  <div key={a.cert} className="font-body-sm text-body-sm text-on-surface-variant">
                    <strong className="text-on-surface">{a.cert}</strong> expires in {a.daysUntil} day{a.daysUntil === 1 ? '' : 's'} ({formatDate(a.expiryDate)})
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <Card className="p-0 overflow-hidden h-[480px] md:h-[680px]" hover={false}>
          <Calendar
            events={savedShifts}
            onSelectEvent={(s) => { setDrawerShift(s); setDrawerOpen(true) }}
            onSelectDay={(d) => toast.push(`Request a shift for ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}?`, { tone: 'info' })}
          />
        </Card>

        <Card hover={false}>
          <CardHeader icon="history" title="Shift history" subtitle="Your completed shifts" />
          {savedShifts.filter(s => s.status === 'completed').length === 0 ? (
            <div className="text-center py-6 text-on-surface-variant text-sm">No completed shifts yet.</div>
          ) : (
            <div className="space-y-sm mt-md">
              {savedShifts
                .filter(s => s.status === 'completed')
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5)
                .map((s) => (
                  <div key={s.id} className="flex items-center gap-md p-sm rounded-lg bg-surface-variant/30">
                    <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-label-md text-label-md font-bold text-on-surface truncate">{s.title || s.role || 'Shift'}</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">{s.department} · {formatDateFull(s.date)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-label-md text-label-md font-bold text-on-surface">{s.durationHours}h</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">{timeLabel(s.startHour)}</div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </section>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Shift details"
        subtitle={drawerShift?.date ? formatDate(drawerShift.date) : ''}
      >
        {drawerShift && (
          <div className="p-4 space-y-4">
            <Card hover={false}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">event</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-lg font-bold text-on-surface">
                    {drawerShift.title || 'ICU Ward B'}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {drawerShift.role}
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-sm">
              {[
                ['Date', formatDate(drawerShift.date)],
                ['Time', `${timeLabel(drawerShift.startHour)} (${drawerShift.durationHours}h)`],
                ['Department', drawerShift.department],
                ['Status', drawerShift.status],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-sm border-b border-outline-variant/20 last:border-0"
                >
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{label}</span>
                  <span className="font-label-md text-label-md text-on-surface capitalize">{value}</span>
                </div>
              ))}
            </div>

            <div className="space-y-sm">
              <button
                onClick={() => { setDrawerOpen(false); navigate('/app/marketplace'); toast.push('Browse open shifts in the Marketplace', { tone: 'info' }) }}
                className="btn-primary w-full justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">storefront</span>
                Find coverage
              </button>
              <button
                onClick={() => { addSwap({ requesterId: user.user.id, requesterName: user.user.name, fromShiftId: drawerShift.id }); setDrawerOpen(false); toast.push('Shift offered to eligible peers', { tone: 'success' }) }}
                className="btn-secondary w-full justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                Offer this shift
              </button>
              <button
                onClick={() => removeShift(drawerShift.id)}
                className="btn-ghost w-full justify-center text-error hover:bg-error/10"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Remove from calendar
              </button>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer
        open={profileOpen || !!profileEdit}
        onClose={() => { setProfileOpen(false); setProfileEdit(null) }}
        title={profileEdit ? 'Edit profile' : 'My profile'}
        subtitle={user.user.name}
      >
        {profileEdit ? (
          <form onSubmit={(e) => {
            e.preventDefault()
            updateEmployee(profileEdit.id, {
              name: profileEdit.name,
              email: profileEdit.email,
              department: profileEdit.department,
              title: profileEdit.title,
              certifications: profileEdit.certifications,
            })
            const updated = getEmployee(profileEdit.id)
            localStorage.setItem('gs_user', JSON.stringify(updated))
            setProfileEdit(null)
            setProfileOpen(false)
            toast.push('Profile updated', { tone: 'success' })
          }} className="p-md space-y-md">
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Full name</label>
              <input value={profileEdit.name} onChange={(e) => setProfileEdit({ ...profileEdit, name: e.target.value })} className="input-base mt-xs w-full" />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Email</label>
              <input type="email" value={profileEdit.email || ''} onChange={(e) => setProfileEdit({ ...profileEdit, email: e.target.value })} className="input-base mt-xs w-full" />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Title</label>
              <input value={profileEdit.title || ''} onChange={(e) => setProfileEdit({ ...profileEdit, title: e.target.value })} className="input-base mt-xs w-full" />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Department</label>
              <input value={profileEdit.department || ''} onChange={(e) => setProfileEdit({ ...profileEdit, department: e.target.value })} className="input-base mt-xs w-full" />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant">Certifications (comma-separated)</label>
              <input value={Array.isArray(profileEdit.certifications) ? profileEdit.certifications.join(', ') : ''} onChange={(e) => setProfileEdit({ ...profileEdit, certifications: e.target.value.split(',').map(c => c.trim()).filter(Boolean) })} className="input-base mt-xs w-full" placeholder="BLS, ACLS, PALS" />
            </div>
            <div className="flex items-center justify-end gap-sm pt-sm border-t border-outline-variant/30">
              <button type="button" onClick={() => setProfileEdit(null)} className="btn-ghost">Cancel</button>
              <button type="submit" className="btn-primary">Save changes</button>
            </div>
          </form>
        ) : (
          <div className="p-md space-y-md">
            <div className="flex items-center gap-md">
              <img src={user.user.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover border border-outline-variant/30" />
              <div>
                <h3 className="font-headline-md text-lg font-bold text-on-surface">{user.user.name}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{user.user.title || user.user.role}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{user.user.department}</p>
              </div>
            </div>

            <div className="space-y-sm">
              {[
                ['Email', user.user.email || '—'],
                ['Role', user.user.role],
                ['Department', user.user.department || '—'],
                ['Hired', user.user.hiredAt ? formatDate(user.user.hiredAt) : '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-sm border-b border-outline-variant/20 last:border-0">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{label}</span>
                  <span className="font-label-md text-label-md text-on-surface">{value}</span>
                </div>
              ))}
            </div>

            <div>
              <h4 className="font-label-md text-label-md font-bold text-on-surface mb-sm">Certifications</h4>
              <div className="flex flex-wrap gap-1">
                {(user.user.certifications || []).length === 0 ? (
                  <span className="font-body-sm text-body-sm text-on-surface-variant">No certifications on file</span>
                ) : (
                  (user.user.certifications || []).map((c) => (
                    <span key={c} className="chip bg-success/10 text-success text-xs">{c}</span>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-surface-variant/30 text-center">
                <div className="font-headline-md text-lg font-bold text-on-surface">{savedShifts.length}</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Total shifts</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-variant/30 text-center">
                <div className="font-headline-md text-lg font-bold text-on-surface">{burnout.hoursThisWeek}h</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">This week</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-variant/30 text-center">
                <div className={`font-headline-md text-lg font-bold ${burnout.score >= 70 ? 'text-error' : burnout.score >= 40 ? 'text-warning' : 'text-success'}`}>{burnout.score}</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Risk score</div>
              </div>
            </div>

            <button onClick={() => setProfileEdit({ ...user.user })} className="btn-primary w-full justify-center">
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit profile
            </button>
          </div>
        )}
      </Drawer>
    </>
  )
}
