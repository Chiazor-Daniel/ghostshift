import { useState, useCallback } from 'react'

import { Card, CardHeader, Badge, Select, EmptyState } from '../components/ui.jsx'
import { useToast } from '../components/Toast.jsx'
import { getOrg, updateOrg, getPolicies, updatePolicies, getNotifications, getShifts, getEmployees, formatDate } from '../data/store.js'

const sections = [
  { id: 'org', label: 'Organization', icon: 'corporate_fare' },
  { id: 'integrations', label: 'Integrations', icon: 'cable' },
  { id: 'policies', label: 'Policies', icon: 'gavel' },
  { id: 'audit', label: 'Audit Log', icon: 'history' },
]

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState('org')
  const toast = useToast()

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display-sm font-bold text-on-surface">Administration</h1>
      </div>
      <section className="page-section">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-24">
              <Card className="p-2" hover={false}>
                <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveSection(s.id)}
                      className={`whitespace-nowrap lg:w-full text-left px-3 py-2 rounded-lg flex items-center gap-sm font-label-md text-label-md transition-all flex-shrink-0 ${
                        activeSection === s.id
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'text-on-surface hover:bg-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
                      {s.label}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </aside>

          <div className="lg:col-span-9 space-y-4">
            {activeSection === 'org' && <OrgSection />}
            {activeSection === 'integrations' && <IntegrationsSection />}
            {activeSection === 'policies' && <PoliciesSection />}
            {activeSection === 'audit' && <AuditSection />}
          </div>
        </div>
      </section>
    </>
  )
}

function SectionHeader({ title, description }) {
  return (
    <div className="mb-md">
      <h2 className="font-headline-md text-headline-lg text-on-surface font-bold">{title}</h2>
      <p className="font-body-sm text-body-sm text-on-surface-variant">{description}</p>
    </div>
  )
}

function OrgSection() {
  const toast = useToast()
  const [org, setOrg] = useState(() => getOrg())
  const [auditLog, setAuditLog] = useState(() => readAudit())

  const handleBlur = useCallback((key) => (e) => {
    const value = e.target.value
    const patch = { [key]: value }
    updateOrg(patch)
    setOrg(prev => ({ ...prev, ...patch }))
    addAuditEntry(setAuditLog, 'Updated org', `Changed ${key} to "${value}"`, 'tune')
    toast.push(`Saved ${key}`, { tone: 'success' })
  }, [toast])

  const employees = getEmployees()
  const depts = [...new Set(employees.map(e => e.department).filter(Boolean))]

  return (
    <>
      <SectionHeader
        title="Organization"
        description="Manage your hospital, departments, and high-level configuration"
      />
      <Card hover={false}>
        <div className="space-y-md">
          <div className="flex items-center gap-md pb-md border-b border-outline-variant/30">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-on-primary font-headline-md text-headline-md font-bold">
              {(org.displayName || org.name).substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="font-headline-md text-lg font-bold text-on-surface">{org.displayName || org.name}</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Enterprise · {employees.length} employees · {depts.length} departments
              </p>
            </div>
            <button className="btn-secondary" onClick={() => toast.push('Upload a new logo…', { tone: 'info' })}>Change logo</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Organization name" defaultValue={org.name} onBlur={handleBlur('name')} />
            <Field label="Display name" defaultValue={org.displayName} onBlur={handleBlur('displayName')} />
            <Field label="Time zone" defaultValue={org.timezone} onBlur={handleBlur('timezone')} />
            <Field label="Week starts on" defaultValue={org.weekStartsOn} onBlur={handleBlur('weekStartsOn')} />
            <Field label="Default shift length" defaultValue={String(org.defaultShiftLength) + ' hours'} onBlur={handleBlur('defaultShiftLength')} />
            <Field label="Currency" defaultValue={org.currency} onBlur={handleBlur('currency')} />
          </div>
        </div>
      </Card>

      <Card hover={false}>
        <CardHeader
          icon="account_tree"
          title="Departments"
          subtitle={`${depts.length} active departments`}
          action={
            <button
              onClick={() => toast.push('Department editor arrives with the backend release', { tone: 'info' })}
              className="btn-primary py-xs px-sm text-xs"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              Add dept
            </button>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-sm mt-md">
          {depts.length === 0 ? (
            <div className="md:col-span-2">
              <EmptyState icon="corporate_fare" title="No departments yet" description="Add employees to populate departments." />
            </div>
          ) : (
            depts.map((name) => {
              const count = employees.filter(e => e.department === name).length
              return (
                <div
                  key={name}
                  className="flex items-center gap-md p-sm rounded-lg border border-outline-variant/30 hover:border-primary/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold font-label-md text-label-md">
                    {name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="font-label-md text-label-md font-bold text-on-surface">{name}</div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant">
                      {count} staff
                    </div>
                  </div>
                  <button
                    onClick={() => toast.push(`${name} settings…`, { tone: 'info' })}
                    className="text-on-surface-variant hover:text-primary"
                    aria-label={`${name} options`}
                  >
                    <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                  </button>
                </div>
              )
            })
          )}
        </div>
      </Card>
    </>
  )
}

function IntegrationsSection() {
  const toast = useToast()
  const [connections, setConnections] = useState(() => {
    try {
      const stored = localStorage.getItem('gs_integrations')
      if (stored) return JSON.parse(stored)
    } catch {}
    return {
      workday: { connected: true, lastSync: '2026-06-27T08:15:00Z', records: 128 },
      entra: { connected: true, lastSync: '2026-06-27T07:00:00Z', records: 128 },
      slack: { connected: true, lastSync: '2026-06-27T09:30:00Z', records: 42 },
      epic: { connected: true, lastSync: '2026-06-27T06:45:00Z', records: 312 },
      gcal: { connected: true, lastSync: '2026-06-27T09:00:00Z', records: 87 },
      adp: { connected: false, lastSync: null, records: 0 },
    }
  })

  function toggleConnection(key) {
    setConnections(prev => {
      const next = { ...prev, [key]: { ...prev[key], connected: !prev[key].connected, lastSync: !prev[key].connected ? new Date().toISOString() : null } }
      localStorage.setItem('gs_integrations', JSON.stringify(next))
      return next
    })
    toast.push(connections[key].connected ? 'Integration disconnected' : 'Integration connected — syncing now…', { tone: connections[key].connected ? 'warning' : 'success' })
  }

  function syncNow(key) {
    setConnections(prev => {
      const next = { ...prev, [key]: { ...prev[key], lastSync: new Date().toISOString() } }
      localStorage.setItem('gs_integrations', JSON.stringify(next))
      return next
    })
    toast.push('Sync complete', { tone: 'success' })
  }

  const integrations = [
    { key: 'workday', name: 'Workday', desc: 'HRIS sync · Employee records & payroll', icon: 'work', category: 'HRIS' },
    { key: 'entra', name: 'Microsoft Entra SSO', desc: 'Single sign-on · Provisioning via SCIM', icon: 'shield', category: 'Identity' },
    { key: 'slack', name: 'Slack', desc: 'Notifications · Swap alerts in channels', icon: 'forum', category: 'Comms' },
    { key: 'epic', name: 'Epic', desc: 'EHR · Patient acuity scoring', icon: 'medical_services', category: 'EHR' },
    { key: 'gcal', name: 'Google Calendar', desc: 'Bi-directional shift sync', icon: 'event', category: 'Calendar' },
    { key: 'adp', name: 'ADP', desc: 'Payroll · Premium shift pay export', icon: 'payments', category: 'Payroll' },
  ]

  function timeAgo(iso) {
    if (!iso) return 'Never'
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <>
      <SectionHeader
        title="Integrations"
        description="Connect GhostShift to your existing systems. When a real customer onboards, each integration uses OAuth2 or API keys configured during setup."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {integrations.map((i) => {
          const conn = connections[i.key]
          return (
            <Card key={i.name} hover>
              <div className="flex items-start gap-md">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${conn.connected ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-on-surface-variant'}`}>
                  <span className="material-symbols-outlined text-[24px]">{i.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-sm">
                    <h3 className="font-headline-md text-base font-bold text-on-surface">{i.name}</h3>
                    <Badge variant={conn.connected ? 'success' : 'neutral'}>
                      {conn.connected ? 'Connected' : 'Available'}
                    </Badge>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{i.desc}</p>
                  {conn.connected && (
                    <div className="mt-2 flex items-center gap-3 font-label-sm text-label-sm text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">sync</span>
                        Last sync: {timeAgo(conn.lastSync)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">database</span>
                        {conn.records} records
                      </span>
                    </div>
                  )}
                  <div className="mt-md flex items-center justify-between">
                    <Badge variant="info">{i.category}</Badge>
                    <div className="flex items-center gap-sm">
                      {conn.connected && (
                        <button onClick={() => syncNow(i.key)} className="btn-ghost py-xs px-sm text-xs">
                          <span className="material-symbols-outlined text-[14px]">sync</span>
                          Sync now
                        </button>
                      )}
                      <button
                        onClick={() => toggleConnection(i.key)}
                        className={`py-xs px-sm text-xs ${conn.connected ? 'btn-ghost text-error hover:bg-error/10' : 'btn-primary'}`}
                      >
                        {conn.connected ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </>
  )
}

function PoliciesSection() {
  const toast = useToast()
  const [policies, setPolicies] = useState(() => getPolicies())
  const [auditLog, setAuditLog] = useState(() => readAudit())

  const handleChange = useCallback((key) => (e) => {
    const raw = e.target.value
    const value = key === 'premiumPayThreshold' ? parseInt(raw.replace('%', '')) || 0 : parseInt(raw) || 0
    const patch = { [key]: value }
    updatePolicies(patch)
    setPolicies(prev => ({ ...prev, ...patch }))
    addAuditEntry(setAuditLog, 'Updated policy', `Changed ${key} to ${value}`, 'policy')
  }, [])

  return (
    <>
      <SectionHeader
        title="Scheduling policies"
        description="Rules that govern swaps, overtime, and time off"
      />
      <Card hover={false}>
        <div className="space-y-md">
          <Policy
            title="Maximum consecutive days"
            value={String(policies.maxConsecutiveDays)}
            desc="Auto-block schedule patterns that exceed this"
            onChange={handleChange('maxConsecutiveDays')}
          />
          <Policy
            title="Minimum rest gap between shifts"
            value={String(policies.minRestGap)}
            desc="Hours between end of last shift and start of next"
            onChange={handleChange('minRestGap')}
          />
          <Policy
            title="Maximum weekly hours"
            value={String(policies.maxWeeklyHours)}
            desc="OT triggered beyond this threshold"
            onChange={handleChange('maxWeeklyHours')}
          />
          <Policy
            title="Swap approval window"
            value={String(policies.swapApprovalWindow)}
            desc="Hours before shift when manager approval is required"
            onChange={handleChange('swapApprovalWindow')}
          />
          <Policy
            title="Premium pay threshold"
            value={`+${policies.premiumPayThreshold}%`}
            desc="Minimum premium for filling last-minute open shifts"
            onChange={(e) => {
              const raw = e.target.value.replace(/[+%]/g, '')
              const value = parseInt(raw) || 0
              updatePolicies({ premiumPayThreshold: value })
              setPolicies(prev => ({ ...prev, premiumPayThreshold: value }))
              addAuditEntry(setAuditLog, 'Updated policy', `Changed premiumPayThreshold to ${value}`, 'policy')
            }}
          />
        </div>
      </Card>

      <Card hover={false}>
        <CardHeader
          icon="rule"
          title="Compliance rules"
          subtitle="Enforce automatically by the scheduler"
        />
        <div className="space-y-sm mt-md">
          {[
            'Block double-booking an employee across departments',
            'Require manager approval for any swap touching a critical role',
            'Auto-deny swap if it would put an employee into overtime',
            'Enforce minimum 2 RNs per shift in ICU Ward B',
            'Mandatory 30-min unpaid meal break per shift over 6 hours',
          ].map((rule) => (
            <label
              key={rule}
              className="flex items-center gap-md p-sm rounded-lg hover:bg-surface-variant cursor-pointer"
            >
              <input type="checkbox" defaultChecked className="accent-primary w-4 h-4" />
              <span className="font-body-md text-body-md text-on-surface flex-1">{rule}</span>
              <Badge variant="info">Active</Badge>
            </label>
          ))}
        </div>
      </Card>
    </>
  )
}

function AuditSection() {
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [events, setEvents] = useState(() => readAudit())

  const visible = events.filter((e) => {
    if (!query) return true
    const q = query.toLowerCase()
    return e.user.toLowerCase().includes(q) || e.action.toLowerCase().includes(q) || e.target.toLowerCase().includes(q)
  })

  return (
    <>
      <SectionHeader
        title="Audit log"
        description="Immutable record of every administrative action"
      />
      <Card className="p-0 overflow-hidden" hover={false}>
        <div className="px-md py-sm border-b border-outline-variant/30 flex items-center gap-md">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search audit log..."
            className="input-base flex-1"
          />
          <button
            onClick={() => {
              const rows = [['Timestamp', 'User', 'Action', 'Target']]
              visible.forEach(e => rows.push([e.time, e.user, e.action, e.target]))
              const csv = rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
              a.click()
              URL.revokeObjectURL(url)
              toast.push(`Exported ${visible.length} audit entries`, { tone: 'success' })
            }}
            className="btn-secondary py-xs px-sm text-xs"
          >
            <span className="material-symbols-outlined text-[14px]">file_download</span>
            Export CSV
          </button>
        </div>
        <div className="divide-y divide-outline-variant/20">
          {visible.length === 0 && (
            <div className="px-4 py-12 text-center">
              <span className="material-symbols-outlined text-on-surface-variant text-[32px]">history</span>
              <p className="mt-sm font-body-sm text-body-sm text-on-surface-variant">No audit entries found</p>
            </div>
          )}
          {visible.map((e, i) => (
            <div key={e.id || i} className="px-md py-md flex items-center gap-md hover:bg-surface-variant/30">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  e.color === 'success'
                    ? 'bg-success/10 text-success'
                    : e.color === 'warning'
                      ? 'bg-warning/10 text-warning'
                      : e.color === 'info'
                        ? 'bg-info/10 text-info'
                        : e.color === 'primary'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-surface-variant text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{e.icon}</span>
              </div>
              <div className="flex-1">
                <div className="font-label-md text-label-md text-on-surface">
                  <b>{e.user}</b> {e.action.toLowerCase()}
                </div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">{e.target}</div>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">
                {e.time}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

function Field({ label, defaultValue, onBlur }) {
  return (
    <div>
      <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1">
        {label}
      </label>
      <input type="text" defaultValue={defaultValue} onBlur={onBlur} className="input-base" />
    </div>
  )
}

function Policy({ title, value, desc, onChange }) {
  return (
    <div className="flex items-center gap-md py-md border-b border-outline-variant/20 last:border-0">
      <div className="flex-1">
        <h4 className="font-label-md text-label-md font-bold text-on-surface">{title}</h4>
        <p className="font-label-sm text-label-sm text-on-surface-variant">{desc}</p>
      </div>
      <div className="flex items-center gap-1">
        <input
          type="text"
          defaultValue={value}
          onChange={onChange}
          className="input-base w-20 text-center"
        />
        <span className="font-label-md text-label-md text-on-surface-variant">hrs</span>
      </div>
    </div>
  )
}

function readAudit() {
  try {
    const raw = localStorage.getItem('gs_audit')
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function addAuditEntry(setter, action, target, icon) {
  const entry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    time: 'just now',
    user: 'admin',
    action,
    target,
    icon,
    color: icon === 'tune' ? 'primary' : icon === 'policy' ? 'warning' : 'neutral',
  }
  setter(prev => {
    const next = [entry, ...prev]
    try { localStorage.setItem('gs_audit', JSON.stringify(next)) } catch { /* ignore */ }
    return next
  })
}
