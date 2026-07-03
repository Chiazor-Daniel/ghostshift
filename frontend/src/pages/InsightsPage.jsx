import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts'

import { Card, CardHeader, Badge, ProgressBar, Modal, Avatar } from '../components/ui.jsx'
import { useToast } from '../components/Toast.jsx'
import { realAPI } from '../services/realAPI.js'
import { ListSkeleton } from '../components/ui.jsx'

const heatmapMax = 100

export default function InsightsPage() {
  const [diagOpen, setDiagOpen] = useState(false)
  const [diagDept, setDiagDept] = useState(null)
  const toast = useToast()

  const [burnout, setBurnout] = useState(null)
  const [coverage, setCoverage] = useState(null)
  const [staffing, setStaffing] = useState(null)
  const [attendance, setAttendance] = useState(null)
  const [employees, setEmployees] = useState([])
  const [shifts, setShifts] = useState([])
  const [swaps, setSwaps] = useState([])
  const [leaves, setLeaves] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadCore() {
      const hasData = burnout !== null
      if (!hasData) setLoading(true)
      try {
        const [b, c, s, a, emps, sh, sw, lv] = await Promise.all([
          realAPI.getBurnoutAnalytics(),
          realAPI.getCoverageAnalytics(),
          realAPI.getStaffingAnalytics(),
          realAPI.getAttendanceAnalytics(),
          realAPI.getEmployees(),
          realAPI.getShifts(),
          realAPI.getSwaps(),
          realAPI.getLeaves(),
        ])
        if (cancelled) return
        setBurnout(b || { employees: [], high_risk: 0, moderate_risk: 0, low_risk: 0 })
        setCoverage(c || {})
        setStaffing(s || {})
        setAttendance(a || null)
        setEmployees(emps || [])
        setShifts(sh || [])
        setSwaps(sw || [])
        setLeaves(lv || [])
      } catch (err) {
        if (!cancelled) toast.push(err.message || 'Could not load insights', { tone: 'error' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    async function loadSummary() {
      setSummaryLoading(true)
      try {
        const sum = await realAPI.getExecutiveSummary()
        if (!cancelled) setSummary(sum?.summary || null)
      } catch {
        /* summary is optional — charts still work */
      } finally {
        if (!cancelled) setSummaryLoading(false)
      }
    }

    loadCore().then(() => loadSummary())
    return () => { cancelled = true }
  }, [])

  const allBurnout = burnout?.employees || []

  const deptBurnout = useMemo(() => {
    const depts = [...new Set(allBurnout.map((e) => e.department).filter(Boolean))]
    return depts.map((dept) => {
      const scores = allBurnout.filter((e) => e.department === dept)
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b.burnout_score, 0) / scores.length) : 0
      const high = scores.filter((s) => s.risk_level === 'high' || s.risk_level === 'critical').length
      return { dept, avg, count: scores.length, high }
    })
  }, [allBurnout])

  const avgBurnout = useMemo(() => {
    if (!allBurnout.length) return 0
    return Math.round(allBurnout.reduce((a, b) => a + b.burnout_score, 0) / allBurnout.length * 10) / 10
  }, [allBurnout])

  const highRiskCount = burnout?.high_risk || 0

  const distributionData = useMemo(() => {
    const buckets = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 }
    allBurnout.forEach((e) => {
      const s = e.burnout_score || 0
      if (s <= 20) buckets['0-20']++
      else if (s <= 40) buckets['21-40']++
      else if (s <= 60) buckets['41-60']++
      else if (s <= 80) buckets['61-80']++
      else buckets['81-100']++
    })
    return Object.entries(buckets).map(([range, count]) => ({ range, count }))
  }, [allBurnout])

  const deptHealth = useMemo(() => {
    return deptBurnout.map((d) => {
      const health = Math.max(0, Math.min(100, 100 - d.avg))
      return {
        dept: d.dept,
        score: health,
        change: 0,
        color: health >= 80 ? 'success' : health >= 60 ? 'warning' : 'error',
      }
    })
  }, [deptBurnout])

  const fairness = useMemo(() => {
    const stats = employees.filter((e) => e.role !== 'admin').map((emp) => {
      const empShifts = shifts.filter((s) => (s.assigned_staff || []).includes(emp.id))
      let weekendShifts = 0
      let nightShifts = 0
      let totalHours = 0
      empShifts.forEach((s) => {
        if (s.date) {
          const [y, m, d] = s.date.split('-').map(Number)
          const dt = new Date(y, m - 1, d)
          if (dt.getDay() === 0 || dt.getDay() === 6) weekendShifts++
        }
        if ((s.start_hour || 0) >= 19 || (s.start_hour || 0) <= 4) nightShifts++
        totalHours += s.duration_hours || 0
      })
      const overtime = Math.max(0, totalHours - 40)
      return {
        id: emp.id,
        name: emp.name,
        weekendShifts,
        nightShifts,
        totalHours,
        overtime,
      }
    })
    const fairnessScore = stats.length === 0 ? 0 : Math.max(0, 100 - Math.round((Math.max(...stats.map(s => s.overtime)) || 0) * 2))
    const averages = {
      weekend: stats.length ? stats.reduce((a, b) => a + b.weekendShifts, 0) / stats.length : 0,
      night: stats.length ? stats.reduce((a, b) => a + b.nightShifts, 0) / stats.length : 0,
      overtime: stats.length ? stats.reduce((a, b) => a + b.overtime, 0) / stats.length : 0,
    }
    return { stats, fairnessScore, averages }
  }, [employees, shifts])

  const ptoUtilization = useMemo(() => {
    return coverage?.coverage_rate ? Math.round(coverage.coverage_rate) : 0
  }, [coverage])

  const swapAnalytics = useMemo(() => {
    const total = swaps.length
    const pending = swaps.filter((s) => s.status === 'pending').length
    const approved = swaps.filter((s) => s.status === 'approved').length
    const declined = swaps.filter((s) => s.status === 'declined' || s.status === 'rejected').length
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0
    const pickups = swaps.filter((s) => s.kind === 'pickup').length
    const trades = swaps.filter((s) => s.kind === 'swap').length
    return { total, pending, approved, declined, approvalRate, pickups, trades }
  }, [swaps])

  const leaveAnalytics = useMemo(() => {
    const total = leaves.length
    const pending = leaves.filter((l) => l.status === 'pending').length
    const approved = leaves.filter((l) => l.status === 'approved').length
    const declined = leaves.filter((l) => l.status === 'declined').length
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0
    return { total, pending, approved, declined, approvalRate }
  }, [leaves])

  const attendanceData = useMemo(() => {
    if (!attendance) return null
    return [
      { label: 'Completed', value: attendance.total_shifts_completed || 0 },
      { label: 'On-time', value: attendance.on_time_count || 0 },
      { label: 'Late', value: attendance.late_count || 0 },
    ]
  }, [attendance])

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display-sm font-bold text-on-surface">AI Insights</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Real-time operational analytics from your team's shifts, attendance, swaps, and absences.
        </p>
      </div>
      <section className="page-section">
        {loading && !burnout && <ListSkeleton variant="card" count={3} />}

        {(!loading || burnout) && (
        <>
        {/* AI Executive Summary */}
        {(summary || summaryLoading) && (
          <Card hover={false} className="border-primary/20 bg-primary/5">
            <CardHeader icon="auto_awesome" title="AI executive summary" />
            <div className="mt-md">
              {summaryLoading && !summary ? (
                <p className="text-on-surface-variant text-sm animate-pulse">Generating summary…</p>
              ) : (
                <p className="font-body-md text-body-md text-on-surface leading-relaxed">{summary}</p>
              )}
            </div>
          </Card>
        )}

        {/* KPI row */}
        <div className="responsive-grid">
          <KpiCard
            label="Coverage rate"
            value={`${ptoUtilization}%`}
            delta={`${coverage?.open_shifts || 0} open`}
            deltaColor={ptoUtilization > 80 ? 'success' : ptoUtilization > 50 ? 'warning' : 'error'}
            trend="up-good"
            icon="event_available"
          />
          <KpiCard
            label="Check-in rate"
            value={attendance && attendance.total_shifts_completed > 0 ? `${attendance.on_time_rate}%` : '—'}
            delta={attendance ? `${attendance.total_shifts_completed} shift${attendance.total_shifts_completed === 1 ? '' : 's'} logged` : 'no data yet'}
            deltaColor={attendance?.on_time_rate >= 80 ? 'success' : attendance?.on_time_rate >= 50 ? 'warning' : 'error'}
            trend="up-good"
            icon="schedule"
          />
          <KpiCard
            label="Swap approval"
            value={swapAnalytics.total > 0 ? `${swapAnalytics.approvalRate}%` : '—'}
            delta={`${swapAnalytics.pending} pending`}
            deltaColor={swapAnalytics.approvalRate >= 70 ? 'success' : swapAnalytics.approvalRate >= 40 ? 'warning' : 'error'}
            trend={swapAnalytics.approvalRate >= 70 ? 'up-good' : 'up-bad'}
            icon="swap_horiz"
          />
          <KpiCard
            label="Leave approval"
            value={leaveAnalytics.total > 0 ? `${leaveAnalytics.approvalRate}%` : '—'}
            delta={`${leaveAnalytics.pending} pending`}
            deltaColor={leaveAnalytics.approvalRate >= 70 ? 'success' : 'warning'}
            trend="up-good"
            icon="event_busy"
          />
          <KpiCard
            label="Avg burnout"
            value={allBurnout.length === 0 ? '—' : String(avgBurnout)}
            delta={highRiskCount > 0 ? `${highRiskCount} at risk` : 'stable'}
            deltaColor={highRiskCount > 0 ? 'error' : 'success'}
            trend={highRiskCount > 0 ? 'up-bad' : 'down-good'}
            icon="favorite"
          />
        </div>

        {/* Attendance bar chart */}
        {attendanceData && (
          <Card hover={false}>
            <CardHeader icon="schedule" title="Attendance Overview" subtitle="Completed shifts vs on-time vs late check-ins" />
            <div className="w-full" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {attendanceData.map((entry, i) => (
                      <Cell key={i} fill={entry.label === 'Late' ? '#ef4444' : entry.label === 'On-time' ? '#22c55e' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {attendance && (
              <div className="mt-2 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant border-t border-outline-variant/30 pt-3">
                <span>{attendance.total_shifts_completed} total completed shifts</span>
                <span>Avg variance: {attendance.variance_minutes > 0 ? '+' : ''}{attendance.variance_minutes}m</span>
              </div>
            )}
          </Card>
        )}

        {/* Coverage by department */}
        {coverage?.by_department && (
          <Card hover={false}>
            <CardHeader icon="donut_small" title="Coverage by Department" subtitle="Filled vs open shifts per department" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {Object.entries(coverage.by_department).map(([dept, data]) => {
                const fillRate = data.total > 0 ? Math.round((data.filled / data.total) * 100) : 0
                return (
                  <div key={dept} className="p-4 rounded-xl border border-outline-variant/30">
                    <div className="font-label-md text-label-md font-bold text-on-surface">{dept}</div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="font-headline-md text-xl font-bold text-on-surface">{fillRate}%</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">filled</span>
                    </div>
                    <ProgressBar value={fillRate} color={fillRate >= 80 ? 'success' : fillRate >= 50 ? 'warning' : 'error'} />
                    <div className="mt-1 flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                      <span>{data.filled} filled</span>
                      <span>{data.open} open</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Swap & Leave Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card hover={false}>
            <CardHeader icon="swap_horiz" title="Swap Requests" subtitle="Pickup and trade activity" />
            {swapAnalytics.total === 0 ? (
              <div className="text-center py-8 text-on-surface-variant text-sm">No swap activity yet.</div>
            ) : (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-primary/5">
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Total</div>
                  <div className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1">{swapAnalytics.total}</div>
                </div>
                <div className="p-4 rounded-xl bg-success/5">
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Approved</div>
                  <div className="font-headline-lg text-headline-lg font-bold text-success mt-1">{swapAnalytics.approved}</div>
                </div>
                <div className="p-4 rounded-xl bg-warning/5">
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Pending</div>
                  <div className="font-headline-lg text-headline-lg font-bold text-warning mt-1">{swapAnalytics.pending}</div>
                </div>
                <div className="p-4 rounded-xl bg-error/5">
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Declined</div>
                  <div className="font-headline-lg text-headline-lg font-bold text-error mt-1">{swapAnalytics.declined}</div>
                </div>
                <div className="col-span-2 p-4 rounded-xl bg-surface-variant/30">
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Breakdown</div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="font-label-md text-label-md text-on-surface">
                      <span className="font-bold">{swapAnalytics.pickups}</span> pickups
                    </span>
                    <span className="text-on-surface-variant">·</span>
                    <span className="font-label-md text-label-md text-on-surface">
                      <span className="font-bold">{swapAnalytics.trades}</span> trades
                    </span>
                    <span className="text-on-surface-variant">·</span>
                    <span className="font-label-md text-label-md text-on-surface">
                      <span className="font-bold">{swapAnalytics.approvalRate}%</span> approval rate
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card hover={false}>
            <CardHeader icon="event_busy" title="Leave Requests" subtitle="Time-off utilization" />
            {leaveAnalytics.total === 0 ? (
              <div className="text-center py-8 text-on-surface-variant text-sm">No leave requests yet.</div>
            ) : (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-primary/5">
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Total</div>
                  <div className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1">{leaveAnalytics.total}</div>
                </div>
                <div className="p-4 rounded-xl bg-success/5">
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Approved</div>
                  <div className="font-headline-lg text-headline-lg font-bold text-success mt-1">{leaveAnalytics.approved}</div>
                </div>
                <div className="p-4 rounded-xl bg-warning/5">
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Pending</div>
                  <div className="font-headline-lg text-headline-lg font-bold text-warning mt-1">{leaveAnalytics.pending}</div>
                </div>
                <div className="p-4 rounded-xl bg-error/5">
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Declined</div>
                  <div className="font-headline-lg text-headline-lg font-bold text-error mt-1">{leaveAnalytics.declined}</div>
                </div>
                <div className="col-span-2 text-center font-label-sm text-label-sm text-on-surface-variant p-2">
                  {leaveAnalytics.approvalRate}% approval rate
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Burnout breakdown — simple table instead of heatmap */}
        <Card hover={false}>
          <CardHeader
            icon="favorite"
            title="Burnout overview"
            subtitle="Per-department average score and at-risk staff"
          />
          <div className="overflow-x-auto">
            {deptBurnout.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant text-sm">
                No burnout data available. Add employees and shifts to see insights.
              </div>
            ) : (
              <>
                <table className="w-full min-w-[400px]">
                  <thead>
                    <tr className="text-left border-b border-outline-variant/30">
                      <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-2">Department</th>
                      <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-2">Average score</th>
                      <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-2">At risk</th>
                      <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptBurnout.map((d) => {
                      const isHigh = d.avg >= 70
                      const isMid = d.avg >= 50 && d.avg < 70
                      const statusColor = isHigh ? 'text-error' : isMid ? 'text-warning' : 'text-success'
                      const statusLabel = isHigh ? 'High risk' : isMid ? 'Medium risk' : 'Low risk'
                      return (
                        <tr key={d.dept} className="border-b border-outline-variant/20">
                          <td className="py-3 font-label-md text-label-md text-on-surface">{d.dept}</td>
                          <td className="py-3">
                            <span className={`font-headline-sm text-headline-sm font-bold ${statusColor}`}>{d.avg}</span>
                            <span className="text-on-surface-variant text-xs">/100</span>
                          </td>
                          <td className="py-3 font-label-md text-label-md text-on-surface">{d.high}/{d.count}</td>
                          <td className="py-3">
                            <Badge variant={isHigh ? 'error' : isMid ? 'warning' : 'success'}>{statusLabel}</Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                <div className="mt-4 flex items-center gap-3 font-label-sm text-label-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-5 h-3 rounded bg-success/40" />
                    <span className="text-on-surface-variant">Low (0-49)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-5 h-3 rounded bg-warning/60" />
                    <span className="text-on-surface-variant">Medium (50-69)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-5 h-3 rounded bg-error/70" />
                    <span className="text-on-surface-variant">High (70+)</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Risk Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Card className="lg:col-span-5" hover={false}>
            <CardHeader
              icon="bar_chart"
              title="Risk Distribution"
              subtitle="Staff burnout score ranges"
            />
            <div className="space-y-2 mt-4">
              {distributionData.map((d) => {
                const total = distributionData.reduce((a, b) => a + b.count, 0) || 1
                const pct = (d.count / total) * 100
                const isHigh = d.range.startsWith('81') || d.range.startsWith('61')
                return (
                  <div key={d.range} className="flex items-center gap-3">
                    <span className="font-label-sm text-label-sm text-on-surface w-10 text-right">{d.range}</span>
                    <div className="flex-1 h-6 bg-surface-variant/40 rounded-md overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full ${
                          isHigh
                            ? 'bg-gradient-to-r from-rose-500 to-pink-500'
                            : d.range.startsWith('41')
                              ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                              : 'bg-gradient-to-r from-sky-400 to-blue-400'
                        }`}
                      />
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface w-12">
                      {d.count} <span className="text-on-surface-variant">({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-outline-variant/30 flex items-center justify-between font-label-sm text-label-sm">
              <span className="text-on-surface-variant">{allBurnout.length} employees tracked</span>
              <span className="text-primary font-bold">{highRiskCount} at risk</span>
            </div>
          </Card>

          <Card className="lg:col-span-7" hover={false}>
            <CardHeader
              icon="balance"
              title="Fairness Analytics"
              subtitle="Weekend, night shift, and overtime distribution"
            />
            {fairness.stats.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant text-sm">No shift data available for fairness analysis.</div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="p-4 rounded-xl bg-surface-variant/30">
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Fairness Score</div>
                    <div className={`font-headline-lg text-headline-lg font-bold mt-1 ${fairness.fairnessScore >= 80 ? 'text-success' : fairness.fairnessScore >= 60 ? 'text-warning' : 'text-error'}`}>
                      {fairness.fairnessScore}/100
                    </div>
                    <ProgressBar value={fairness.fairnessScore} color={fairness.fairnessScore >= 80 ? 'success' : fairness.fairnessScore >= 60 ? 'warning' : 'error'} />
                  </div>
                  <div className="p-4 rounded-xl bg-surface-variant/30">
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Avg Weekend Shifts</div>
                    <div className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1">{fairness.averages.weekend.toFixed(1)}</div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant">per employee</div>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-variant/30">
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Avg Night Shifts</div>
                    <div className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1">{fairness.averages.night.toFixed(1)}</div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant">per employee</div>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-variant/30">
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Avg Overtime</div>
                    <div className="font-headline-lg text-headline-lg font-bold text-on-surface mt-1">{fairness.averages.overtime.toFixed(1)}h</div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant">per employee</div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-label-md text-label-md font-bold text-on-surface mb-3">Distribution by employee</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px]">
                      <thead>
                        <tr className="text-left border-b border-outline-variant/30">
                          <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-2">Employee</th>
                          <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-2 text-center">Weekend</th>
                          <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-2 text-center">Night</th>
                          <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-2 text-center">Total Hours</th>
                          <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-2 text-center">Overtime</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fairness.stats.slice(0, 10).map((s) => (
                          <tr key={s.id} className="border-b border-outline-variant/20">
                            <td className="py-2 font-label-md text-label-md text-on-surface">{s.name}</td>
                            <td className="py-2 text-center font-label-md text-label-md text-on-surface">{s.weekendShifts}</td>
                            <td className="py-2 text-center font-label-md text-label-md text-on-surface">{s.nightShifts}</td>
                            <td className="py-2 text-center font-label-md text-label-md text-on-surface">{s.totalHours}h</td>
                            <td className="py-2 text-center">
                              <span className={s.overtime > 10 ? 'text-error font-bold' : s.overtime > 0 ? 'text-warning' : 'text-success'}>
                                {s.overtime}h
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Department Health */}
        <Card hover={false}>
          <CardHeader
            icon="monitor_heart"
            title="Department Health"
            subtitle="Composite of burnout risk and workload balance"
          />
          {deptHealth.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant text-sm">No departments configured yet.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {deptHealth.map((d) => (
                <div key={d.dept} className="p-4 rounded-xl border border-outline-variant/30">
                  <div className="font-label-md text-label-md text-on-surface font-bold">{d.dept}</div>
                  <div className="mt-sm flex items-baseline gap-1">
                    <span className="font-headline-md text-lg md:text-headline-lg font-bold text-on-surface">{d.score}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">/100</span>
                  </div>
                  <ProgressBar
                    value={d.score}
                    color={d.color === 'success' ? 'success' : d.color === 'warning' ? 'warning' : 'error'}
                  />
                  <div className="mt-2 font-label-sm text-label-sm text-on-surface-variant">
                    {d.count} staff tracked
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        </>
        )}
      </section>

      <Modal open={diagOpen} onClose={() => { setDiagOpen(false); setDiagDept(null) }} title="AI Burnout Diagnostic" size="lg">
        <DiagnosticContent dept={diagDept} burnout={allBurnout} employees={employees} deptBurnout={deptBurnout} />
      </Modal>
    </>
  )
}

function KpiCard({ label, value, delta, deltaColor, trend, icon }) {
  return (
    <Card hover>
      <div className="w-10 h-10 rounded-xl bg-surface-variant text-on-surface-variant flex items-center justify-center mb-md">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-headline-lg text-headline-lg font-bold text-on-surface leading-none">{value}</span>
        <span className={`font-label-sm text-label-sm font-bold ${deltaColor === 'success' ? 'text-success' : 'text-error'}`}>
          {delta}
        </span>
      </div>
    </Card>
  )
}

function DiagnosticContent({ dept, burnout, employees, deptBurnout }) {
  const toast = useToast()
  const navigate = useNavigate()
  const activeDept = dept || (deptBurnout.length ? deptBurnout[0].dept : 'Unknown')

  const deptScores = useMemo(() => {
    return burnout.filter((e) => e.department === activeDept).sort((a, b) => b.burnout_score - a.burnout_score)
  }, [burnout, activeDept])

  const atRisk = deptScores.filter((e) => e.burnout_score >= 60).slice(0, 4)

  const deptAvg = deptBurnout.find((d) => d.dept === activeDept)
  const avgScore = deptAvg ? deptAvg.avg : 0

  return (
    <div className="space-y-md">
      <div className="bg-error/5 border border-error/20 rounded-xl p-md">
        <div className="flex items-center gap-md">
          <div className="w-12 h-12 rounded-xl bg-error/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-error text-[24px]">priority_high</span>
          </div>
          <div>
            <h3 className="font-headline-md text-lg font-bold text-on-surface">{activeDept} — Current</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Burnout index {avgScore}/100 · {deptScores.length} staff tracked
            </p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-label-md text-label-md font-bold text-on-surface mb-sm">At-risk staff ({deptScores.filter((e) => e.burnout_score >= 60).length})</h4>
        <div className="space-y-sm">
          {atRisk.length === 0 && (
            <p className="font-body-sm text-body-sm text-on-surface-variant">No staff at elevated risk in this department.</p>
          )}
          {atRisk.map((s) => (
            <div key={s.employee_id} className="flex items-center gap-md p-sm rounded-lg bg-surface-variant/30">
              <Avatar initials={(s.employee_name || 'UN').split(' ').map((n) => n[0]).join('').substring(0, 2)} size="md" />
              <div className="flex-1">
                <div className="font-label-md text-label-md font-bold text-on-surface">{s.employee_name}</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">{s.department}</div>
              </div>
              <div className="text-right">
                <div className="font-headline-md text-base font-bold text-error">{s.burnout_score}</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">risk</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-label-md text-label-md font-bold text-on-surface mb-sm">AI recommended interventions</h4>
        <div className="space-y-sm">
          {[
            { action: 'Approve pending PTO requests', impact: 'High', icon: 'beach_access', route: '/app/leaves', message: 'Navigating to absence requests...' },
            { action: 'Distribute high-acuity shifts to other teams', impact: 'Med', icon: 'shuffle', route: '/app/marketplace', message: 'Opening shift marketplace...' },
            { action: 'Schedule 1:1 check-ins with all staff scoring 70+', impact: 'High', icon: 'forum', route: '/app/employees', message: 'Opening employee list...' },
            { action: 'Authorize float-pool coverage', impact: 'Med', icon: 'person_add', route: '/app/dashboard', message: 'Opening dashboard to create shifts...' },
          ].map((rec, i) => (
            <div key={i} className="flex items-start gap-md p-md rounded-xl border border-outline-variant/30 hover:border-primary/40 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[18px]">{rec.icon}</span>
              </div>
              <div className="flex-1">
                <p className="font-body-md text-body-md text-on-surface">{rec.action}</p>
                <Badge variant={rec.impact === 'High' ? 'success' : 'warning'}>
                  {rec.impact} impact
                </Badge>
              </div>
              <button
                onClick={() => {
                  toast.push(rec.message, { tone: 'info' })
                  navigate(rec.route)
                }}
                className="btn-primary py-xs px-sm text-xs"
              >
                Apply
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}