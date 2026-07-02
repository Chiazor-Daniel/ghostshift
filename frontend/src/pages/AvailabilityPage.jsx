import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../layout/AppShell.jsx'
import { Card, CardHeader, Badge } from '../components/ui.jsx'
import { useToast } from '../components/Toast.jsx'
import { realAPI } from '../services/realAPI.js'

const SLOTS = [
  { id: 'morning', label: 'Morning (7-3)', start: '07:00', end: '15:00' },
  { id: 'afternoon', label: 'Afternoon (3-11)', start: '15:00', end: '23:00' },
  { id: 'night', label: 'Night (11-7)', start: '23:00', end: '07:00' },
]
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Display days Mon-Sun, store day_of_week: 0=Mon ... 6=Sun
const displayIdxToStore = (di) => di
const storeIdxToDisplay = (si) => si

export default function AvailabilityPage() {
  const { user: currentUser } = useUser()
  const isEmployee = currentUser?.role === 'employee'
  const [view, setView] = useState(isEmployee ? 'me' : 'team')

  const tabs = isEmployee
    ? [{ id: 'me', label: 'My template' }]
    : [
        { id: 'team', label: 'Team overview' },
        { id: 'coverage', label: 'Coverage gaps' },
      ]

  useEffect(() => {
    if (isEmployee) setView('me')
    else setView('team')
  }, [isEmployee])

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display-sm font-bold text-on-surface">Availability</h1>
      </div>
      <section className="page-section">
        {!isEmployee && (
        <Card hover={false}>
          <div className="flex items-center gap-1 bg-surface-variant/60 p-1 rounded-xl w-fit">
            {tabs.map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`px-3 py-1.5 rounded-lg font-label-sm md:font-label-md text-label-sm md:text-label-md transition-all ${
                  view === v.id
                    ? 'bg-surface shadow-soft-sm text-primary font-bold'
                    : 'text-on-surface-variant'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </Card>
        )}
        {view === 'me' && <MyTemplate />}
        {view === 'team' && <TeamOverview />}
        {view === 'coverage' && <CoverageGaps />}
      </section>
    </>
  )
}

function MyTemplate() {
  const { user: currentUser } = useUser()
  const empId = currentUser?.id
  const toast = useToast()
  const [grid, setGrid] = useState(() =>
    Array.from({ length: 7 }, () => Array(SLOTS.length).fill('neutral'))
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!empId) return
    refresh()
  }, [empId])

  async function refresh() {
    try {
      const list = await realAPI.getAvailability({ employee_id: empId })
      const next = Array.from({ length: 7 }, () => Array(SLOTS.length).fill('neutral'))
      ;(list || []).forEach((a) => {
        const di = storeIdxToDisplay(a.day_of_week)
        const si = SLOTS.findIndex((s) => s.start === a.start_time)
        if (di < 7 && si >= 0 && next[di]?.[si] !== undefined) {
          const status = a.status === 'preferred' ? 'preferred' : a.status === 'unavailable' ? 'unavailable' : 'neutral'
          next[di][si] = status
        }
      })
      setGrid(next)
    } catch (err) {
      toast.push(err.message || 'Could not load availability', { tone: 'error' })
    }
  }

  const cycle = (cur) => {
    const order = ['preferred', 'neutral', 'unavailable']
    return order[(order.indexOf(cur) + 1) % order.length]
  }

  async function setCell(displayDayIdx, si, newVal) {
    setGrid((g) => g.map((row, i) => i === displayDayIdx ? row.map((c, j) => j === si ? newVal : c) : row))
    const slot = SLOTS[si]
    const dayOfWeek = displayIdxToStore(displayDayIdx)
    const status = newVal === 'preferred' ? 'preferred' : newVal === 'unavailable' ? 'unavailable' : 'available'
    try {
      await realAPI.upsertAvailability({
        employee_id: empId,
        day_of_week: dayOfWeek,
        start_time: slot.start,
        end_time: slot.end,
        status,
        is_recurring: true,
      })
    } catch (err) {
      toast.push(err.message || 'Could not save', { tone: 'error' })
    }
  }

  const counts = {
    preferred: grid.flat().filter((c) => c === 'preferred').length,
    neutral: grid.flat().filter((c) => c === 'neutral').length,
    unavailable: grid.flat().filter((c) => c === 'unavailable').length,
  }

  const mode = {
    preferred: { bg: 'bg-primary text-on-primary', icon: 'favorite', label: 'Preferred' },
    neutral: { bg: 'bg-primary/30 text-primary', icon: 'check', label: 'Available' },
    unavailable: { bg: 'bg-surface-variant text-on-surface-variant', icon: 'block', label: 'Unavailable' },
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { key: 'preferred', icon: 'favorite', color: 'text-primary', label: 'Preferred', count: counts.preferred },
          { key: 'neutral', icon: 'check', color: 'text-success', label: 'Available', count: counts.neutral },
          { key: 'unavailable', icon: 'block', color: 'text-warning', label: 'Unavailable', count: counts.unavailable },
        ].map((s) => (
          <Card key={s.key} hover>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-variant flex items-center justify-center">
                <span className={`material-symbols-outlined text-[20px] ${s.color}`}>{s.icon}</span>
              </div>
              <div>
                <div className="font-label-sm text-[11px] text-on-surface-variant uppercase">{s.label}</div>
                <div className="font-headline-md text-xl font-bold text-on-surface">{s.count}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card hover={false}>
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary text-[20px]">event_available</span>
          <h2 className="font-headline-md text-md font-bold text-on-surface">Weekly template</h2>
          <span className="font-label-sm text-[11px] text-on-surface-variant">Tap cells to cycle</span>
          {saving && <span className="ml-auto text-xs text-on-surface-variant">Saving…</span>}
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <div className="grid gap-1.5 min-w-[480px]" style={{ gridTemplateColumns: `80px repeat(${SLOTS.length}, 1fr)` }}>
            <div />
            {SLOTS.map((s) => (
              <div key={s.id} className="text-center font-label-sm text-[11px] text-on-surface-variant pb-2 leading-tight">
                {s.label}
              </div>
            ))}
          </div>
          {WEEK_DAYS.map((day, i) => (
            <div key={day} className="grid gap-1.5 min-w-[480px] mt-1" style={{ gridTemplateColumns: `80px repeat(${SLOTS.length}, 1fr)` }}>
              <div className="font-label-md text-label-md font-bold text-on-surface flex items-center justify-end pr-2">{day}</div>
              {grid[i].map((cell, j) => (
                <motion.button
                  key={j}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setCell(i, j, cycle(cell))}
                  className={`h-10 rounded-lg border border-outline-variant/20 ${mode[cell].bg} flex items-center justify-center transition-all cursor-pointer`}
                >
                  <span className="material-symbols-outlined text-[16px]">{mode[cell].icon}</span>
                </motion.button>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-center gap-4 pt-3 border-t border-outline-variant/20">
          {['preferred', 'neutral', 'unavailable'].map((k) => (
            <div key={k} className="flex items-center gap-1">
              <span className={`material-symbols-outlined text-[14px] ${k === 'preferred' ? 'text-primary' : k === 'neutral' ? 'text-primary/60' : 'text-on-surface-variant'}`}>{mode[k].icon}</span>
              <span className="font-label-sm text-[11px] text-on-surface-variant">{mode[k].label}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

function TeamOverview() {
  const toast = useToast()
  const [employees, setEmployees] = useState([])
  const [allAvail, setAllAvail] = useState([])

  useEffect(() => {
    ;(async () => {
      try {
        const [emps, avail] = await Promise.all([
          realAPI.getEmployees(),
          realAPI.getAvailability(),
        ])
        setEmployees(emps || [])
        setAllAvail(avail || [])
      } catch (err) {
        toast.push(err.message || 'Could not load availability', { tone: 'error' })
      }
    })()
  }, [])

  const heatmapData = useMemo(() => {
    return (employees || []).filter((e) => e.role !== 'admin').slice(0, 12).map((emp) => {
      const dayScores = Array.from({ length: 7 }, (_, day) =>
        SLOTS.map((_, slot) => {
          const slotTimes = SLOTS[slot]
          const entry = allAvail.find((a) => a.employee_id === emp.id && a.day_of_week === day && a.start_time === slotTimes.start)
          if (!entry) return 50
          return entry.status === 'preferred' ? 100 : entry.status === 'unavailable' ? 0 : 50
        })
      )
      const flat = dayScores.flat()
      const score = Math.round(flat.reduce((a, b) => a + b, 0) / flat.length)
      return { emp, dayScores, score }
    })
  }, [employees, allAvail])

  if (heatmapData.length === 0) {
    return <Card hover={false}><p className="text-on-surface-variant p-4">No availability data yet.</p></Card>
  }

  return (
    <Card hover={false}>
      <CardHeader
        icon="groups"
        title="Team availability heatmap"
        subtitle="Each row = one employee · Cell color = preference density"
      />
      <div className="mt-md overflow-x-auto scrollbar-thin">
        <div className="min-w-[640px] space-y-sm">
          {heatmapData.map(({ emp, dayScores, score }) => (
            <div key={emp.id} className="flex items-center gap-md">
              <div className="flex items-center gap-sm w-48 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                  {emp.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-label-md text-label-md text-on-surface truncate">{emp.name}</div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant truncate">{emp.department}</div>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-[repeat(7,minmax(0,1fr))] gap-1">
                {dayScores.map((slots, di) => (
                  <div key={di} className="flex gap-0.5">
                    {slots.map((v, si) => (
                      <div
                        key={si}
                        className="flex-1 h-5 rounded"
                        style={{ background: `rgba(37,99,235,${0.15 + (v / 100) * 0.7})` }}
                        title={`${v}%`}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <span className="font-label-md text-label-md text-on-surface font-bold w-12 text-right flex-shrink-0">
                {score}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function CoverageGaps() {
  const toast = useToast()
  const navigate = useNavigate()
  const [shifts, setShifts] = useState([])
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    ;(async () => {
      try {
        const [sh, emps] = await Promise.all([realAPI.getShifts(), realAPI.getEmployees()])
        setShifts(sh || [])
        setEmployees(emps || [])
      } catch (err) {
        toast.push(err.message || 'Could not load', { tone: 'error' })
      }
    })()
  }, [])

  const gaps = useMemo(() => {
    const result = []
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    shifts.forEach((s) => {
      const required = s.required_staff || 1
      const assigned = (s.assigned_staff || []).length
      if (assigned < required) {
        const [y, m, d] = s.date.split('-').map(Number)
        const dt = new Date(y, m - 1, d)
        const day = dayNames[dt.getDay()]
        const ratio = assigned / required
        const severity = ratio < 0.4 ? 'critical' : ratio < 0.7 ? 'high' : ratio < 1 ? 'medium' : 'low'
        result.push({
          id: s.id,
          department: s.department,
          day,
          needed: required,
          staffed: assigned,
          severity,
          date: s.date,
        })
      }
    })
    return result
  }, [shifts])

  const totalNeed = gaps.reduce((sum, g) => sum + Math.max(0, g.needed - g.staffed), 0)
  const criticalCount = gaps.filter((g) => g.severity === 'critical').length

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hover>
          <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Open slots this week</div>
          <div className="font-display-lg text-display-lg font-bold text-error mt-1">{totalNeed}</div>
          <div className="font-label-sm text-label-sm text-on-surface-variant">across {gaps.length} gaps</div>
        </Card>
        <Card hover>
          <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Critical gaps</div>
          <div className="font-display-lg text-display-lg font-bold text-warning mt-1">{criticalCount}</div>
          <div className="font-label-sm text-label-sm text-on-surface-variant">need attention</div>
        </Card>
        <Card hover>
          <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Team size</div>
          <div className="font-display-lg text-display-lg font-bold text-primary mt-1">{employees.filter((e) => e.role !== 'admin').length}</div>
          <div className="font-label-sm text-label-sm text-on-surface-variant">available to cover</div>
        </Card>
      </div>

      <Card hover={false}>
        <CardHeader icon="priority_high" title="Coverage gaps" />
        <div className="mt-md space-y-sm">
          {gaps.length === 0 && (
            <p className="text-on-surface-variant text-center py-4">No coverage gaps detected. All shifts are fully staffed.</p>
          )}
          {gaps.map((g) => (
            <div key={g.id} className="flex flex-wrap items-center gap-md p-md rounded-xl border border-outline-variant/30 hover:border-primary/40">
              <div className={`w-2 h-12 rounded-full ${
                g.severity === 'critical' ? 'bg-error' : g.severity === 'high' ? 'bg-error' : g.severity === 'medium' ? 'bg-warning' : 'bg-success'
              }`} />
              <div className="flex-1">
                <div className="flex items-center gap-sm">
                  <h3 className="font-label-md text-label-md font-bold text-on-surface">{g.department}</h3>
                  <Badge variant={g.severity === 'critical' ? 'error' : g.severity === 'high' ? 'error' : g.severity === 'medium' ? 'warning' : 'success'}>
                    {g.severity}
                  </Badge>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">{g.day} · {g.date}</p>
              </div>
              <div className="text-right">
                <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Have / Need</div>
                <div className="font-headline-md text-lg font-bold text-on-surface">{g.staffed} / {g.needed}</div>
              </div>
              <button
                onClick={() => navigate(`/app/marketplace?dept=${encodeURIComponent(g.department)}`)}
                className="btn-primary py-xs px-sm text-xs"
              >
                Find coverage
              </button>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}