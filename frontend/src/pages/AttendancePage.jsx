import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, Badge, ListSkeleton, RichListItem } from '../components/ui.jsx'
import { useToast } from '../components/Toast.jsx'
import { realAPI } from '../services/realAPI.js'

export default function AttendancePage() {
  const toast = useToast()
  const [records, setRecords] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const [data, emps] = await Promise.all([
          realAPI.getAttendanceAnalytics(),
          realAPI.getEmployees(),
        ])
        setRecords(data?.latest || [])
        setEmployees(emps || [])
      } catch (err) {
        toast.push(err.message || 'Could not load attendance', { tone: 'error' })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const byId = useMemo(() => {
    const m = {}
    employees.forEach((e) => (m[e.id] = e))
    return m
  }, [employees])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return records
    return records.filter((r) => {
      const emp = byId[r.employee_id] || byId[r.user_id]
      const name = emp?.name || ''
      return (
        name.toLowerCase().includes(term) ||
        (r.shift_title || '').toLowerCase().includes(term) ||
        (r.department || '').toLowerCase().includes(term)
      )
    })
  }, [records, search, byId])

  function formatTime(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function formatDay(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  }

  function durationMinutes(startIso, endIso) {
    if (!startIso || !endIso) return null
    return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000)
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display-sm font-bold text-on-surface">Attendance</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          All employee check-ins and check-outs across the organization.
        </p>
      </div>

      <section className="page-section">
        <Card hover={false}>
          <CardHeader
            icon="schedule"
            title="Check-in / Check-out Log"
            subtitle="Live attendance records from completed shifts"
          />

          <div className="mt-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by employee, shift, or department"
              className="input-base w-full"
            />
          </div>

          {loading && <ListSkeleton variant="card" count={5} />}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-10 text-on-surface-variant text-sm">
              {records.length === 0
                ? 'No completed shifts with check-in / check-out yet.'
                : 'No records match your search.'}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="mt-4 space-y-3">
              {filtered.map((r) => {
                const emp = byId[r.employee_id] || byId[r.user_id]
                const mins = durationMinutes(r.check_in_at, r.check_out_at)
                const scheduled = r.scheduled_minutes || r.scheduled_hours * 60 || null
                const variance =
                  mins != null && scheduled != null ? mins - scheduled : null
                const onTime =
                  r.check_in_at && r.start_time
                    ? (new Date(r.check_in_at).getTime() - new Date(r.start_time).getTime()) / 60000 <= 10
                    : true

                return (
                  <RichListItem
                    key={r.shift_id}
                    title={emp?.name || 'Unknown employee'}
                    subtitle={r.shift_title || 'Untitled shift'}
                    status={{
                      label: onTime ? 'On time' : 'Late',
                      variant: onTime ? 'success' : 'error',
                    }}
                    icon="schedule"
                    iconColor={onTime ? 'success' : 'error'}
                    meta={`${formatDay(r.check_in_at)} · ${r.department || 'No department'}`}
                    details={[
                      { label: 'Checked in', value: formatTime(r.check_in_at) },
                      { label: 'Checked out', value: formatTime(r.check_out_at) },
                      {
                        label: 'Actual duration',
                        value: mins != null ? `${Math.floor(mins / 60)}h ${mins % 60}m` : '—',
                      },
                      {
                        label: 'Scheduled',
                        value: scheduled != null ? `${Math.floor(scheduled / 60)}h ${scheduled % 60}m` : '—',
                      },
                      ...(variance != null
                        ? [
                            {
                              label: 'Variance',
                              value: `${variance > 0 ? '+' : ''}${Math.floor(variance / 60)}h ${Math.abs(variance) % 60}m`,
                              sub: variance > 0 ? 'over scheduled' : variance < 0 ? 'under scheduled' : 'on target',
                            },
                          ]
                        : []),
                    ]}
                  />
                )
              })}
            </div>
          )}
        </Card>
      </section>
    </>
  )
}
