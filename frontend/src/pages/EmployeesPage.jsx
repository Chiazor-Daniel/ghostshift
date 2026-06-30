import { useState, useMemo, useEffect } from 'react'
import { Card, Avatar, Badge, Select, Drawer, EmptyState } from '../components/ui.jsx'
import { useToast } from '../components/Toast.jsx'
import { realAPI } from '../services/realAPI.js'

const roles = [
  { value: 'employee', label: 'Employee' },
  { value: 'admin', label: 'Admin' },
]

function inviteLink(token) {
  return `${window.location.origin}/accept-invite/${token}`
}

export default function EmployeesPage() {
  const toast = useToast()
  const [employees, setEmployees] = useState([])
  const [invites, setInvites] = useState([])
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const emptyRow = () => ({ name: '', email: '', department: '', role: 'employee' })
  const [rows, setRows] = useState([emptyRow()])
  const [createdInvites, setCreatedInvites] = useState([])

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    try {
      const [emps, invs] = await Promise.all([realAPI.getEmployees(), realAPI.getInvites()])
      setEmployees(emps || [])
      setInvites(invs || [])
    } catch (err) {
      toast.push(err.message || 'Could not load employees', { tone: 'error' })
    }
  }

  const filtered = useMemo(() => {
    return employees.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (!query) return true
      const q = query.toLowerCase()
      return u.name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
    })
  }, [employees, query, roleFilter])

  const pendingInvites = useMemo(() => invites.filter((i) => i.status === 'pending'), [invites])

  function updateRow(index, patch) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()])
  }

  function removeRow(index) {
    setRows((prev) => (prev.length === 1 ? [emptyRow()] : prev.filter((_, i) => i !== index)))
  }

  async function handleAddInvite(e) {
    e.preventDefault()
    const validRows = rows.filter((r) => r.name.trim() && r.email.trim())
    if (validRows.length === 0) {
      toast.push('Fill in at least one name and email.', { tone: 'warning' })
      return
    }

    const created = []
    const errors = []
    for (const r of validRows) {
      try {
        const result = await realAPI.createInvite({
          name: r.name,
          email: r.email,
          department: r.department || 'Unassigned',
          role: r.role,
        })
        created.push({ ...result.invite, temp_password: result.created_user?.temp_password })
      } catch (err) {
        errors.push(`${r.email}: ${err.message}`)
      }
    }

    if (errors.length > 0) {
      errors.forEach((err) => toast.push(err, { tone: 'error' }))
    }

    if (created.length > 0) {
      await refresh()
      setCreatedInvites(created)
      setRows([emptyRow()])
      toast.push(`${created.length} invite${created.length === 1 ? '' : 's'} created.`, { tone: 'success' })
    }
  }

  function copyLink(token) {
    navigator.clipboard.writeText(inviteLink(token))
    toast.push('Invite link copied to clipboard', { tone: 'success' })
  }

  function copyAllLinks() {
    const text = createdInvites.map((i) => `${i.email}: ${inviteLink(i.token)}`).join('\n')
    navigator.clipboard.writeText(text)
    toast.push('All invite links copied', { tone: 'success' })
  }

  function closeCreated() {
    setCreatedInvites([])
    setShowModal(false)
    refresh()
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display-sm font-bold text-on-surface">Employees</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">{employees.length} team members · {pendingInvites.length} pending invite{pendingInvites.length === 1 ? '' : 's'}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Invite employee
        </button>
      </div>

      <section className="page-section space-y-md">
        {pendingInvites.length > 0 && (
          <Card hover={false}>
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-md">Pending invites</h2>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="text-left border-b border-outline-variant/30">
                    <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-sm px-4 md:px-0">Name</th>
                    <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-sm">Email</th>
                    <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-sm">Role</th>
                    <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-sm">Department</th>
                    <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-sm"></th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvites.map((i) => (
                    <tr key={i.id} className="border-b border-outline-variant/20 hover:bg-surface-variant/30">
                      <td className="py-md px-4 md:px-0 font-label-md text-label-md font-semibold text-on-surface">{i.name || '—'}</td>
                      <td className="py-md text-on-surface-variant">{i.email}</td>
                      <td className="py-md"><Badge variant={i.role === 'admin' ? 'error' : 'neutral'}>{i.role}</Badge></td>
                      <td className="py-md font-label-md text-label-md text-on-surface">{i.department || '—'}</td>
                      <td className="py-md text-right">
                        <button onClick={() => copyLink(i.token)} className="btn-secondary text-sm py-1.5 px-3">
                          <span className="material-symbols-outlined text-[16px]">content_copy</span>
                          Copy link
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <Card hover={false}>
          <div className="flex items-center justify-between mb-md flex-wrap gap-sm">
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Team members</h2>
            <div className="flex items-center gap-md">
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search employees..." className="input-base" />
              <Select value={roleFilter} onChange={setRoleFilter} options={[{ value: 'all', label: 'All roles' }, ...roles]} className="w-36" />
            </div>
          </div>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="text-left border-b border-outline-variant/30">
                  <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-sm px-4 md:px-0">Name</th>
                  <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-sm">Role</th>
                  <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-sm">Department</th>
                  <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-outline-variant/20 hover:bg-surface-variant/30">
                    <td className="py-md px-4 md:px-0">
                      <div className="flex items-center gap-sm">
                        <Avatar src={u.avatar} initials={u.name.split(' ').map(n => n[0]).join('')} size="sm" />
                        <div>
                          <div className="font-label-md text-label-md font-bold text-on-surface">{u.name}</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">{u.email || `${u.name.toLowerCase().replace(/\s+/g, '.')}@stmarrys.health`}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-md"><Badge variant={u.role === 'admin' ? 'error' : 'neutral'}>{u.role}</Badge></td>
                    <td className="py-md font-label-md text-label-md text-on-surface">{u.department || '—'}</td>
                    <td className="py-md"><Badge variant="success">Active</Badge></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      {employees.length === 0 ? (
                        <EmptyState icon="people" title="No team members yet" description="Invite your first employee to get started." />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <div className="w-14 h-14 rounded-2xl bg-surface-variant flex items-center justify-center mb-md">
                            <span className="material-symbols-outlined text-on-surface-variant text-[26px]">search_off</span>
                          </div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">No results</h3>
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs max-w-xs">No employees match your search.</p>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <Drawer open={showModal} onClose={() => { setShowModal(false); setCreatedInvites([]) }} title="Invite employees" subtitle="Send local invite links to join the team">
        <div className="p-md space-y-md">
          {!createdInvites.length ? (
            <form onSubmit={handleAddInvite} className="space-y-md">
              <div className="space-y-md max-h-[60vh] overflow-y-auto pr-1">
                {rows.map((row, idx) => (
                  <div key={idx} className="p-md rounded-xl bg-surface-container/50 border border-outline-variant/30 space-y-md">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Employee {idx + 1}</span>
                      {rows.length > 1 && (
                        <button type="button" onClick={() => removeRow(idx)} className="text-on-surface-variant hover:text-error" title="Remove">
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="font-label-sm text-label-sm text-on-surface-variant">Full name</label>
                      <input value={row.name} onChange={(e) => updateRow(idx, { name: e.target.value })} className="input-base mt-xs w-full" placeholder="e.g. Jane Doe" autoFocus={idx === 0} />
                    </div>
                    <div>
                      <label className="font-label-sm text-label-sm text-on-surface-variant">Work email</label>
                      <input type="email" value={row.email} onChange={(e) => updateRow(idx, { email: e.target.value })} className="input-base mt-xs w-full" placeholder="jane@hospital.org" />
                    </div>
                    <div>
                      <label className="font-label-sm text-label-sm text-on-surface-variant">Department</label>
                      <input value={row.department} onChange={(e) => updateRow(idx, { department: e.target.value })} className="input-base mt-xs w-full" placeholder="e.g. Emergency" />
                    </div>
                    <div>
                      <label className="font-label-sm text-label-sm text-on-surface-variant">Role</label>
                      <Select value={row.role} onChange={(v) => updateRow(idx, { role: v })} options={roles} className="w-full mt-xs" />
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addRow} className="btn-secondary w-full justify-center">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add another employee
              </button>

              <div className="flex items-center justify-end gap-sm pt-sm border-t border-outline-variant/30">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary">Create invites</button>
              </div>
            </form>
          ) : (
            <div className="space-y-md">
              <p className="font-body-md text-body-md text-on-surface-variant">
                {createdInvites.length} invite{createdInvites.length === 1 ? '' : 's'} created. Share each link with the matching employee — opening it activates their account automatically.
              </p>
              <div className="space-y-sm max-h-[50vh] overflow-y-auto pr-1">
                {createdInvites.map((i) => (
                  <div key={i.id} className="p-md rounded-xl bg-surface-container/50 border border-outline-variant/30 space-y-sm">
                    <div className="font-label-md text-label-md font-semibold text-on-surface">{i.email}</div>
                    {i.temp_password && (
                      <div className="flex items-center gap-sm">
                        <span className="font-label-sm text-label-sm text-on-surface-variant w-32 shrink-0">Temp password</span>
                        <code className="flex-1 font-mono text-sm bg-background px-3 py-2 rounded-md border border-outline-variant/30 select-all">{i.temp_password}</code>
                        <button
                          type="button"
                          onClick={() => { navigator.clipboard.writeText(i.temp_password); toast.push('Temp password copied', { tone: 'success' }) }}
                          className="btn-secondary whitespace-nowrap py-2 px-3"
                        >
                          <span className="material-symbols-outlined text-[16px]">content_copy</span>
                          Copy
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-sm">
                      <input readOnly value={inviteLink(i.token)} className="input-base flex-1 text-sm" />
                      <button onClick={() => copyLink(i.token)} className="btn-primary whitespace-nowrap py-2 px-3">
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end gap-sm pt-sm border-t border-outline-variant/30">
                <button onClick={copyAllLinks} className="btn-secondary">
                  <span className="material-symbols-outlined text-[18px]">content_copy</span>
                  Copy all
                </button>
                <button onClick={closeCreated} className="btn-primary">Done</button>
              </div>
            </div>
          )}
        </div>
      </Drawer>
    </>
  )
}
