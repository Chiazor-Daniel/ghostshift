import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

import { Card, CardHeader, Badge, ProgressBar, Modal, Avatar, Select } from '../components/ui.jsx'
import { useToast } from '../components/Toast.jsx'
import { computeAllBurnout, computeCoverageGaps, computeFairness, computePTOUtilization, getEmployees, getShifts, getSwaps, weekRange, formatDate } from '../data/store.js'

const heatmapMax = 100

export default function InsightsPage() {
  const [diagOpen, setDiagOpen] = useState(false)
  const [diagDept, setDiagDept] = useState(null)
  const [period, setPeriod] = useState('2026 Q2')
  const toast = useToast()

  const allBurnout = useMemo(() => computeAllBurnout(), [])
  const employees = useMemo(() => getEmployees(), [])

  const deptBurnout = useMemo(() => {
    const depts = [...new Set(allBurnout.map(e => e.department).filter(Boolean))]
    return depts.map(dept => {
      const scores = allBurnout.filter(e => e.department === dept)
      const avg = Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length)
      const high = scores.filter(s => s.score >= 70).length
      return { dept, avg, count: scores.length, high }
    })
  }, [allBurnout])

  const avgBurnout = useMemo(() => {
    if (!allBurnout.length) return 0
    return Math.round(allBurnout.reduce((a, b) => a + b.score, 0) / allBurnout.length * 10) / 10
  }, [allBurnout])

  const highRiskCount = useMemo(() => allBurnout.filter(e => e.score >= 70).length, [allBurnout])

  const distributionData = useMemo(() => {
    const buckets = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 }
    allBurnout.forEach(e => {
      if (e.score <= 20) buckets['0-20']++
      else if (e.score <= 40) buckets['21-40']++
      else if (e.score <= 60) buckets['41-60']++
      else if (e.score <= 80) buckets['61-80']++
      else buckets['81-100']++
    })
    return Object.entries(buckets).map(([range, count]) => ({ range, count }))
  }, [allBurnout])

  const riskTrend = useMemo(() => {
    const weeks = ['Wk 22', 'Wk 23', 'Wk 24', 'Wk 25', 'Wk 26']
    return weeks.map((week, i) => ({
      week,
      risk: Math.round(avgBurnout + (i - 2) * 3 + Math.sin(i) * 5),
      baseline: avgBurnout,
    }))
  }, [avgBurnout])

  const deptHealth = useMemo(() => {
    return deptBurnout.map(d => {
      const health = Math.max(0, Math.min(100, 100 - d.avg))
      return {
        dept: d.dept,
        score: health,
        change: 0,
        color: health >= 80 ? 'success' : health >= 60 ? 'warning' : 'error',
      }
    })
  }, [deptBurnout])

  const fairness = useMemo(() => computeFairness(), [])
  const ptoUtilization = useMemo(() => computePTOUtilization(), [])

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display-sm font-bold text-on-surface">HR & Burnout Insights</h1>
      </div>
      <section className="page-section">
        <div className="responsive-grid">
          <KpiCard
            label="Avg burnout index"
            value={allBurnout.length === 0 ? '—' : String(avgBurnout)}
            delta={highRiskCount > 0 ? `+${highRiskCount} high` : 'stable'}
            deltaColor={highRiskCount > 0 ? 'error' : 'success'}
            trend={highRiskCount > 0 ? 'up-bad' : 'down-good'}
            icon="favorite"
          />
          <KpiCard
            label="High risk staff"
            value={String(highRiskCount)}
            delta={highRiskCount > 0 ? '↑' : '–'}
            deltaColor="error"
            trend="up-bad"
            icon="priority_high"
          />
          <KpiCard
            label="PTO utilization"
            value={`${ptoUtilization}%`}
            delta={ptoUtilization > 50 ? '+12%' : 'low'}
            deltaColor={ptoUtilization > 50 ? 'success' : 'warning'}
            trend={ptoUtilization > 50 ? 'up-good' : 'down-bad'}
            icon="beach_access"
          />
          <KpiCard
            label="Model confidence"
            value="94%"
            delta="+0.8%"
            deltaColor="success"
            trend="up-good"
            icon="auto_awesome"
          />
        </div>

        <Card className="p-0 overflow-hidden" hover={false}>
          <div className="px-4 py-3 md:px-md md:py-md flex flex-wrap items-center justify-between gap-sm border-b border-outline-variant/30">
            <div>
              <h2 className="font-headline-md text-lg md:text-headline-lg text-on-surface font-bold">
                Burnout Heatmap
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                By department · Color intensity = predicted burnout score
              </p>
            </div>
            <div className="flex items-center gap-sm">
              <Badge variant="info">{period}</Badge>
              <Select
                value={period}
                onChange={setPeriod}
                options={[
                  { value: '2026 Q2', label: '2026 Q2' },
                  { value: 'Last 6 mo', label: 'Last 6 mo' },
                  { value: 'YTD 2026', label: 'YTD 2026' },
                ]}
                className="w-32"
              />
            </div>
          </div>
          <div className="p-4 overflow-x-auto">
            {deptBurnout.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant text-sm">No burnout data available for this period.</div>
            ) : (
              <>
            <div className="grid grid-cols-[110px_1fr_1fr] gap-1.5 min-w-[400px]">
              <div />
              <div className="text-center font-label-sm text-label-sm text-on-surface-variant font-bold">
                Avg Score
              </div>
              <div className="text-center font-label-sm text-label-sm text-on-surface-variant font-bold">
                At Risk
              </div>
              {deptBurnout.map((d, di) => {
                const intensity = d.avg / heatmapMax
                const isHigh = d.avg >= 70
                const isMid = d.avg >= 50 && d.avg < 70
                return (
                  <div key={d.dept} className="contents">
                    <div className="font-label-sm text-label-sm text-on-surface flex items-center">
                      {d.dept}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05, zIndex: 10 }}
                      onClick={() => {
                        if (isHigh) { setDiagDept(d.dept); setDiagOpen(true) }
                        else toast.push(`${d.dept}: score ${d.avg} (${isMid ? 'medium' : 'low'} risk)`, { tone: isMid ? 'warning' : 'info' })
                      }}
                      aria-label={`${d.dept} burnout: ${d.avg}`}
                      className="aspect-square md:aspect-[1.4/1] rounded-lg relative overflow-hidden cursor-pointer group"
                      style={{
                        background: isHigh
                          ? `linear-gradient(135deg, rgba(244,63,94,${0.25 + intensity * 0.7}), rgba(244,63,94,${0.4 + intensity * 0.5}))`
                          : isMid
                            ? `linear-gradient(135deg, rgba(245,158,11,${0.2 + intensity * 0.5}), rgba(245,158,11,${0.3 + intensity * 0.4}))`
                            : `linear-gradient(135deg, rgba(16,185,129,${0.2 + intensity * 0.5}), rgba(16,185,129,${0.3 + intensity * 0.4}))`,
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center font-label-sm md:font-label-md text-label-sm md:text-label-md font-bold text-white drop-shadow-md">
                        {d.avg}
                      </div>
                      {isHigh && (
                        <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white animate-pulse" />
                      )}
                    </motion.button>
                    <div
                      className="aspect-square md:aspect-[1.4/1] rounded-lg flex items-center justify-center font-label-md font-bold"
                      style={{
                        background: d.high > 0
                          ? 'linear-gradient(135deg, rgba(244,63,94,0.15), rgba(244,63,94,0.25))'
                          : 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.15))',
                      }}
                    >
                      <span className={d.high > 0 ? 'text-error' : 'text-success'}>
                        {d.high}/{d.count}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-sm">
              <div className="flex items-center gap-3 font-label-sm text-label-sm">
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
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Click any red cell to view diagnostic
              </p>
            </div>
              </>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Card className="lg:col-span-7" hover={false}>
            <CardHeader
              icon="monitor_heart"
              title="Burnout Risk Trend"
              subtitle="Department averages vs org baseline"
            />
            {riskTrend.length === 0 ? (
              <div className="flex items-center justify-center h-60 text-on-surface-variant text-sm">No risk trend data available for this period.</div>
            ) : (
            <div className="w-full" style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={riskTrend} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="baseline"
                    stroke="#cbd5e1"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                    name="Org avg"
                  />
                  <Line
                    type="monotone"
                    dataKey="risk"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#2563eb' }}
                    activeDot={{ r: 6 }}
                    name="Dept avg"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            )}
          </Card>

          <Card className="lg:col-span-5" hover={false}>
            <CardHeader
              icon="bar_chart"
              title="Risk Distribution"
              subtitle="By score range"
            />
            <div className="space-y-2 mt-4">
              {distributionData.map((d) => {
                const total = distributionData.reduce((a, b) => a + b.count, 0) || 1
                const pct = (d.count / total) * 100
                const isHigh = d.range.startsWith('81') || d.range.startsWith('61')
                return (
                  <div key={d.range} className="flex items-center gap-3">
                    <span className="font-label-sm text-label-sm text-on-surface w-10 text-right">
                      {d.range}
                    </span>
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
        </div>

        <Card hover={false}>
          <CardHeader
            icon="compare"
            title="Department Health Score"
            subtitle="Composite of burnout, retention, satisfaction"
          />
          {deptHealth.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant text-sm">No departments configured yet.</div>
          ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {deptHealth.map((d) => (
              <div key={d.dept} className="p-4 rounded-xl border border-outline-variant/30">
                <div className="font-label-md text-label-md text-on-surface font-bold">{d.dept}</div>
                <div className="mt-sm flex items-baseline gap-1">
                  <span className="font-headline-md text-lg md:text-headline-lg font-bold text-on-surface">
                    {d.score}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">/100</span>
                </div>
                <ProgressBar
                  value={d.score}
                  color={d.color === 'success' ? 'success' : d.color === 'warning' ? 'warning' : 'error'}
                />
                <div
                  className={`mt-2 font-label-sm text-label-sm ${
                    d.change > 0
                      ? 'text-success'
                      : d.change < 0
                        ? 'text-error'
                        : 'text-on-surface-variant'
                  }`}
                >
                  {d.change > 0 ? '↑' : d.change < 0 ? '↓' : '–'} {Math.abs(d.change)} pts
                </div>
              </div>
            ))}
            </div>
            )}
        </Card>

        <Card hover={false}>
          <CardHeader
            icon="balance"
            title="Fairness Analytics"
            subtitle="Weekend, night shift, and overtime distribution across team"
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
        <span className="font-headline-lg text-headline-lg font-bold text-on-surface leading-none">
          {value}
        </span>
        <span className={`font-label-sm text-label-sm font-bold ${deltaColor === 'success' ? 'text-success' : 'text-error'}`}>
          {delta} {trend === 'down-good' || trend === 'up-bad' ? '↓' : '↑'}
        </span>
      </div>
    </Card>
  )
}

function DiagnosticContent({ dept, burnout, employees, deptBurnout }) {
  const toast = useToast()
  const activeDept = dept || (deptBurnout.length ? deptBurnout[0].dept : 'Unknown')

  const deptScores = useMemo(() => {
    return burnout
      .filter(e => e.department === activeDept)
      .sort((a, b) => b.score - a.score)
  }, [burnout, activeDept])

  const atRisk = deptScores.filter(e => e.score >= 60).slice(0, 4)

  const deptAvg = deptBurnout.find(d => d.dept === activeDept)
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
        <h4 className="font-label-md text-label-md font-bold text-on-surface mb-sm">Contributing factors</h4>
        <div className="space-y-sm">
          {[
            { label: 'Excessive consecutive hours', value: Math.min(100, avgScore + 6), color: 'error' },
            { label: 'Insufficient rest gaps', value: Math.min(100, avgScore - 8), color: 'error' },
            { label: 'High-acuity patient load', value: Math.min(100, avgScore - 15), color: 'warning' },
            { label: 'Low PTO utilization', value: Math.min(100, avgScore - 22), color: 'warning' },
            { label: 'Self-reported stress', value: Math.min(100, avgScore + 2), color: 'error' },
          ].map((f) => (
            <div key={f.label}>
              <div className="flex justify-between font-label-sm text-label-sm mb-1">
                <span className="text-on-surface">{f.label}</span>
                <span className="font-bold text-on-surface">{f.value}</span>
              </div>
              <ProgressBar value={f.value} color={f.color === 'error' ? 'error' : 'warning'} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-label-md text-label-md font-bold text-on-surface mb-sm">At-risk staff ({deptScores.filter(e => e.score >= 60).length})</h4>
        <div className="space-y-sm">
          {atRisk.length === 0 && (
            <p className="font-body-sm text-body-sm text-on-surface-variant">No staff at elevated risk in this department.</p>
          )}
          {atRisk.map((s) => {
            const emp = employees.find(e => e.id === s.id)
            return (
              <div key={s.id} className="flex items-center gap-md p-sm rounded-lg bg-surface-variant/30">
                <Avatar initials={s.name.split(' ').map(n => n[0]).join('').substring(0, 2)} size="md" />
                <div className="flex-1">
                  <div className="font-label-md text-label-md font-bold text-on-surface">{s.name}</div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant">
                    {emp?.title || emp?.role || 'Staff'} · {s.department}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-headline-md text-base font-bold text-error">{s.score}</div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant">risk</div>
                </div>
                <button
                  onClick={() => toast.push(`Opening ${s.name}'s wellbeing profile…`, { tone: 'info' })}
                  className="btn-secondary py-xs px-sm text-xs"
                >
                  View
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h4 className="font-label-md text-label-md font-bold text-on-surface mb-sm">AI recommended interventions</h4>
        <div className="space-y-sm">
          {[
            { action: 'Approve pending PTO requests', impact: 'High', icon: 'beach_access' },
            { action: 'Distribute high-acuity shifts to other teams', impact: 'Med', icon: 'shuffle' },
            { action: 'Schedule 1:1 check-ins with all staff scoring 70+', impact: 'High', icon: 'forum' },
            { action: 'Authorize float nurse coverage', impact: 'Med', icon: 'person_add' },
          ].map((rec, i) => (
            <div
              key={i}
              className="flex items-start gap-md p-md rounded-xl border border-outline-variant/30 hover:border-primary/40 transition-colors"
            >
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
                onClick={() => toast.push(`Intervention queued: ${rec.action}`, { tone: 'success' })}
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
