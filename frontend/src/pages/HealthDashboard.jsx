import { useState, useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'
import { Card, CardHeader } from '../components/ui.jsx'
import { realAPI } from '../services/realAPI.js'

const METRIC_CONFIG = {
  heart_rate: { label: 'Heart Rate', unit: 'bpm', color: '#ef4444', domain: [40, 160] },
  steps: { label: 'Steps', unit: 'steps', color: '#3b82f6', domain: [0, 20000] },
  sleep_hours: { label: 'Sleep', unit: 'hours', color: '#8b5cf6', domain: [0, 12] },
  stress_level: { label: 'Stress', unit: '/10', color: '#f59e0b', domain: [0, 10] },
  blood_pressure_systolic: { label: 'BP Systolic', unit: 'mmHg', color: '#dc2626', domain: [80, 200] },
  blood_pressure_diastolic: { label: 'BP Diastolic', unit: 'mmHg', color: '#7c3aed', domain: [40, 120] },
  oxygen_saturation: { label: 'O2 Sat', unit: '%', color: '#06b6d4', domain: [90, 100] },
}

function Chart({ data, metric }) {
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const config = METRIC_CONFIG[metric] || { label: metric, unit: '', color: '#6b7280', domain: [0, 100] }

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = 280
    const margin = { top: 20, right: 20, bottom: 40, left: 50 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', height)

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const points = data.map((d, i) => ({ x: i, y: d.value, date: d.effective }))
    const xScale = d3.scaleLinear().domain([0, points.length - 1]).range([0, innerWidth])
    const yScale = d3.scaleLinear().domain(config.domain).range([innerHeight, 0])

    const area = d3.area()
      .x(d => xScale(d.x))
      .y0(innerHeight)
      .y1(d => yScale(d.y))

    g.append('path')
      .datum(points)
      .attr('d', area)
      .attr('fill', config.color)
      .attr('fill-opacity', 0.1)

    const line = d3.line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(points)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', config.color)
      .attr('stroke-width', 2)

    g.selectAll('.dot')
      .data(points)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', 3)
      .attr('fill', config.color)
      .attr('opacity', 0.6)

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(6).tickFormat(d => `Day ${d + 1}`))
      .selectAll('text')
      .attr('class', 'text-xs fill-on-surface-variant')

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll('text')
      .attr('class', 'text-xs fill-on-surface-variant')

    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 35)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-xs fill-on-surface-variant')
      .text('Days ago')

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-xs fill-on-surface-variant')
      .text(config.unit)

  }, [data, metric])

  return (
    <div ref={containerRef} className="w-full">
      <svg ref={svgRef} className="w-full"></svg>
    </div>
  )
}

function MetricCard({ label, value, unit, color }) {
  return (
    <div className="rounded-xl bg-surface p-lg flex flex-col gap-1">
      <span className="text-xs text-on-surface-variant uppercase tracking-wide">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold" style={{ color }}>{value}</span>
        <span className="text-sm text-on-surface-variant">{unit}</span>
      </div>
    </div>
  )
}

export default function HealthDashboard() {
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [observations, setObservations] = useState({})
  const [loading, setLoading] = useState(false)
  const metrics = Object.keys(METRIC_CONFIG)

  useEffect(() => {
    async function loadPatients() {
      try {
        const emps = await realAPI.getEmployees()
        setPatients(emps || [])
        if (emps && emps.length > 0) {
          setSelectedPatient(emps[0].id)
        }
      } catch (e) {
        console.error('Failed to load patients:', e)
      }
    }
    loadPatients()
  }, [])

  useEffect(() => {
    if (!selectedPatient) return
    let cancelled = false
    setLoading(true)

    async function loadObservations() {
      try {
        const bundle = await realAPI.getFHIRPatientObservations(`patient-${selectedPatient}`)
        if (cancelled) return
        const grouped = {}
        if (bundle && bundle.entry) {
          for (const entry of bundle.entry) {
            const obs = entry.resource
            const code = obs?.code?.coding?.[0]?.display
            if (!code) continue
            const metricKey = Object.entries(METRIC_CONFIG).find(([_, v]) => v.label === code)?.[0]
            if (!metricKey) continue
            if (!grouped[metricKey]) grouped[metricKey] = []
            grouped[metricKey].push({
              value: obs.valueQuantity?.value,
              effective: obs.effectiveDateTime,
            })
          }
        }
        if (!cancelled) setObservations(grouped)
      } catch (e) {
        if (!cancelled) console.error('Failed to load observations:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadObservations()
    return () => { cancelled = true }
  }, [selectedPatient])

  const latestValues = {}
  for (const [metric, records] of Object.entries(observations)) {
    if (records.length > 0) {
      latestValues[metric] = records[records.length - 1].value
    }
  }

  return (
    <div className="p-lg max-w-7xl mx-auto space-y-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Health Dashboard</h1>
          <p className="text-sm text-on-surface-variant mt-1">FHIR-compliant real-time health metrics visualization</p>
        </div>
        <select
          className="px-4 py-2 rounded-xl bg-surface border border-outline text-on-surface text-sm"
          value={selectedPatient || ''}
          onChange={e => setSelectedPatient(Number(e.target.value))}
        >
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="text-center text-on-surface-variant py-12">Loading health data...</div>
      )}

      {!loading && Object.keys(latestValues).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
          {Object.entries(latestValues).map(([metric, value]) => (
            <MetricCard
              key={metric}
              label={METRIC_CONFIG[metric]?.label || metric}
              value={typeof value === 'number' ? value.toFixed(1) : value}
              unit={METRIC_CONFIG[metric]?.unit || ''}
              color={METRIC_CONFIG[metric]?.color || '#6b7280'}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        {metrics.map(metric => (
          <Card key={metric} hover={false}>
            <CardHeader
              title={METRIC_CONFIG[metric]?.label || metric}
              subtitle={`Unit: ${METRIC_CONFIG[metric]?.unit || ''}`}
            />
            <Chart data={observations[metric] || []} metric={metric} />
          </Card>
        ))}
      </div>

      <Card hover={false}>
        <CardHeader title="FHIR Endpoints" subtitle="These endpoints expose FHIR R4 compliant resources" />
        <div className="space-y-2 text-sm font-mono">
          <p><span className="text-primary">GET</span> /api/fhir/Patient/{"{id}"}</p>
          <p><span className="text-primary">GET</span> /api/fhir/Observation/{"{id}"}</p>
          <p><span className="text-primary">GET</span> /api/fhir/Patient/{"{id}"}/$everything</p>
          <p><span className="text-primary">GET</span> /api/fhir/Patient/{"{id}"}/observations?metric=heart_rate</p>
          <p><span className="text-primary">GET</span> /api/fhir/metrics</p>
        </div>
      </Card>
    </div>
  )
}
