import { useState, useEffect } from 'react'

import { Card, CardHeader, Badge, EmptyState, ListSkeleton } from '../components/ui.jsx'
import { useToast } from '../components/Toast.jsx'
import { realAPI } from '../services/realAPI.js'

const sections = [
  { id: 'org', label: 'Organization', icon: 'corporate_fare' },
  { id: 'integrations', label: 'Integrations', icon: 'cable' },
  { id: 'policies', label: 'Policies', icon: 'gavel' },
  { id: 'audit', label: 'Audit Log', icon: 'history' },
]

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState('org')

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
  const [org, setOrg] = useState(null)
  const [depts, setDepts] = useState([])
  const [employees, setEmployees] = useState([])
  const [newDept, setNewDept] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    try {
      const [o, d, emps] = await Promise.all([
        realAPI.getOrganization(),
        realAPI.getDepartments(),
        realAPI.getEmployees(),
      ])
      setOrg(o || {})
      setDepts(d || [])
      setEmployees(emps || [])
    } catch (err) {
      toast.push(err.message || 'Could not load organization', { tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function saveField(key, value) {
    setSaving(true)
    try {
      const patch = {}
      if (key === 'displayName') patch.display_name = value
      else if (key === 'weekStartsOn') patch.week_starts_on = value
      else if (key === 'defaultShiftLength') patch.default_shift_length = Number(value)
      else patch[key] = value
      const updated = await realAPI.updateOrganization(patch)
      setOrg((prev) => ({ ...prev, ...updated }))
      try { await realAPI.logAudit({ action: 'update_organization', entity_type: 'organization', new_values: patch }) } catch {}
      toast.push('Saved', { tone: 'success' })
    } catch (err) {
      toast.push(err.message || 'Could not save', { tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function addDept() {
    if (!newDept.trim()) return
    try {
      await realAPI.createDepartment({ name: newDept.trim() })
      setNewDept('')
      refresh()
      try { await realAPI.logAudit({ action: 'create_department', entity_type: 'department', new_values: { name: newDept.trim() } }) } catch {}
      toast.push('Department added', { tone: 'success' })
    } catch (err) {
      toast.push(err.message || 'Could not add department', { tone: 'error' })
    }
  }

  if (loading || !org) {
    return <Card hover={false}><div className="p-md"><ListSkeleton variant="card" count={3} /></div></Card>
  }

  const settings = org.settings || {}
  const displayName = org.display_name || org.displayName || org.name

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
              {(displayName || org.name || 'GS').substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="font-headline-md text-lg font-bold text-on-surface">{displayName}</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {employees.length} employees · {depts.length} departments · {org.timezone || 'UTC'}
              </p>
            </div>
            <span className="chip bg-primary/10 text-primary">Active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Organization name" value={org.name || ''} onSave={(v) => saveField('name', v)} />
            <Field label="Display name" value={displayName} onSave={(v) => saveField('displayName', v)} />
            <Field label="Time zone" value={org.timezone || 'UTC'} onSave={(v) => saveField('timezone', v)} />
            <Field label="Week starts on" value={settings.week_starts_on || org.weekStartsOn || 'monday'} onSave={(v) => saveField('weekStartsOn', v)} />
            <Field label="Default shift length" value={String(settings.default_shift_length || org.defaultShiftLength || 8)} onSave={(v) => saveField('defaultShiftLength', v)} />
            <Field label="Currency" value={org.currency || 'USD'} onSave={(v) => saveField('currency', v)} />
          </div>
          {saving && <p className="text-xs text-on-surface-variant">Saving…</p>}
        </div>
      </Card>

      <Card hover={false}>
        <CardHeader
          icon="account_tree"
          title="Departments"
          subtitle={`${depts.length} active departments`}
        />
        <div className="mt-md space-y-2">
          <div className="flex items-center gap-2">
            <input
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addDept() }}
              placeholder="New department name…"
              className="input-base flex-1"
            />
            <button onClick={addDept} className="btn-primary">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add
            </button>
          </div>
          {depts.length === 0 ? (
            <EmptyState icon="corporate_fare" title="No departments yet" description="Add the departments your hospital uses." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
              {depts.map((d) => {
                const count = employees.filter((e) => e.department === d.name).length
                return (
                  <div
                    key={d.id}
                    className="flex items-center gap-md p-sm rounded-lg border border-outline-variant/30 hover:border-primary/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold font-label-md text-label-md">
                      {(d.name || '?')[0]}
                    </div>
                    <div className="flex-1">
                      <div className="font-label-md text-label-md font-bold text-on-surface">{d.name}</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">
                        {count} staff · {d.headcount || 0} headcount
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>
    </>
  )
}

function IntegrationsSection() {
  const toast = useToast()
  const [status, setStatus] = useState({})

  useEffect(() => {
    realAPI.integrationsStatus()
      .then(setStatus)
      .catch(() => setStatus({}))
  }, [])

  const integrations = [
    { key: 'workday', name: 'Workday', desc: 'HRIS sync · Employee records & payroll', icon: 'work', category: 'HRIS' },
    { key: 'entra', name: 'Microsoft Entra SSO', desc: 'Single sign-on · Provisioning via SCIM', icon: 'shield', category: 'Identity' },
    { key: 'slack', name: 'Slack', desc: 'Notifications · Swap alerts in channels', icon: 'forum', category: 'Comms' },
    { key: 'epic', name: 'Epic', desc: 'EHR · Patient acuity scoring', icon: 'medical_services', category: 'EHR' },
    { key: 'gcal', name: 'Google Calendar', desc: 'Bi-directional shift sync', icon: 'event', category: 'Calendar' },
    { key: 'adp', name: 'ADP', desc: 'Payroll · Premium shift pay export', icon: 'payments', category: 'Payroll' },
  ]

  return (
    <>
      <SectionHeader
        title="Integrations"
        description="Connect GhostShift to your existing systems. When a real customer onboards, each integration uses OAuth2 or API keys configured during setup."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {integrations.map((i) => {
          const live = status?.[i.key] || status?.integrations?.[i.key]
          const connected = live?.connected ?? false
          return (
            <Card key={i.name} hover>
              <div className="flex items-start gap-md">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${connected ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-on-surface-variant'}`}>
                  <span className="material-symbols-outlined text-[24px]">{i.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-sm">
                    <h3 className="font-headline-md text-base font-bold text-on-surface">{i.name}</h3>
                    <Badge variant={connected ? 'success' : 'neutral'}>
                      {connected ? 'Connected' : 'Available'}
                    </Badge>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{i.desc}</p>
                  <div className="mt-md flex items-center justify-between">
                    <Badge variant="info">{i.category}</Badge>
                    <button
                      onClick={() => toast.push(connected ? 'Disconnect integration flow coming soon' : 'Connect flow opens during onboarding', { tone: 'info' })}
                      className={`py-xs px-sm text-xs ${connected ? 'btn-ghost text-error hover:bg-error/10' : 'btn-primary'}`}
                    >
                      {connected ? 'Disconnect' : 'Connect'}
                    </button>
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
  const [policies, setPolicies] = useState({
    maxConsecutiveDays: 6,
    minRestGap: 10,
    maxWeeklyHours: 60,
    swapApprovalWindow: 24,
    premiumPayThreshold: 25,
  })

  function save(key, value) {
    setPolicies((p) => ({ ...p, [key]: value }))
    try { realAPI.logAudit({ action: 'update_policy', entity_type: 'policy', new_values: { [key]: value } }) } catch {}
    toast.push(`${key} updated to ${value}`, { tone: 'success' })
  }

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
            value={policies.maxConsecutiveDays}
            desc="Auto-block schedule patterns that exceed this"
            onChange={(v) => save('maxConsecutiveDays', Number(v))}
          />
          <Policy
            title="Minimum rest gap between shifts"
            value={policies.minRestGap}
            desc="Hours between end of last shift and start of next"
            onChange={(v) => save('minRestGap', Number(v))}
          />
          <Policy
            title="Maximum weekly hours"
            value={policies.maxWeeklyHours}
            desc="OT triggered beyond this threshold"
            onChange={(v) => save('maxWeeklyHours', Number(v))}
          />
          <Policy
            title="Swap approval window"
            value={policies.swapApprovalWindow}
            desc="Hours before shift when manager approval is required"
            onChange={(v) => save('swapApprovalWindow', Number(v))}
          />
          <Policy
            title="Premium pay threshold"
            value={policies.premiumPayThreshold}
            suffix="%"
            desc="Minimum premium for filling last-minute open shifts"
            onChange={(v) => save('premiumPayThreshold', Number(v))}
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
            <label key={rule} className="flex items-center gap-md p-sm rounded-lg hover:bg-surface-variant cursor-pointer">
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
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const data = await realAPI.getAudit()
        setEvents(data || [])
      } catch (err) {
        toast.push(err.message || 'Could not load audit log', { tone: 'error' })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const visible = events.filter((e) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (e.action || '').toLowerCase().includes(q) || (e.entity_type || '').toLowerCase().includes(q) || (e.user_id || '').toLowerCase().includes(q)
  })

  function relativeTime(iso) {
    if (!iso) return ''
    try {
      const diff = Date.now() - new Date(iso).getTime()
      if (diff < 0) return 'just now'
      const mins = Math.floor(diff / 60000)
      if (mins < 1) return 'just now'
      if (mins < 60) return `${mins} min ago`
      const hrs = Math.floor(mins / 60)
      if (hrs < 24) return `${hrs} hr ago`
      return `${Math.floor(hrs / 24)}d ago`
    } catch { return '' }
  }

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
              const rows = [['Timestamp', 'User', 'Action', 'Entity']]
              visible.forEach((e) => rows.push([e.created_at, e.user_id, e.action, e.entity_type]))
              const csv = rows.map((r) => r.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n')
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
          {loading ? (
            <div className="p-md"><ListSkeleton variant="row" count={5} /></div>
          ) : visible.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <span className="material-symbols-outlined text-on-surface-variant text-[32px]">history</span>
              <p className="mt-sm font-body-sm text-body-sm text-on-surface-variant">No audit entries yet</p>
            </div>
          ) : (
            visible.map((e) => (
              <div key={e.id} className="px-md py-md flex items-center gap-md hover:bg-surface-variant/30">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-[18px]">history</span>
                </div>
                <div className="flex-1">
                  <div className="font-label-md text-label-md text-on-surface">
                    <b>{e.action}</b> {e.entity_type ? `on ${e.entity_type}` : ''}
                  </div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant">
                    {e.user_id ? `by ${e.user_id}` : 'system'}
                  </div>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">
                  {relativeTime(e.created_at)}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </>
  )
}

function Field({ label, value, onSave }) {
  const [local, setLocal] = useState(value)
  useEffect(() => { setLocal(value) }, [value])
  return (
    <div>
      <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1">
        {label}
      </label>
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => { if (local !== value) onSave(local) }}
        className="input-base"
      />
    </div>
  )
}

function Policy({ title, value, desc, onChange, suffix = 'hrs' }) {
  return (
    <div className="flex items-center gap-md py-md border-b border-outline-variant/20 last:border-0">
      <div className="flex-1">
        <h4 className="font-label-md text-label-md font-bold text-on-surface">{title}</h4>
        <p className="font-label-sm text-label-sm text-on-surface-variant">{desc}</p>
      </div>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-base w-20 text-center"
        />
        <span className="font-label-md text-label-md text-on-surface-variant">{suffix}</span>
      </div>
    </div>
  )
}