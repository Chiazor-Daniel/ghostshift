import { useState, useMemo, useEffect } from 'react'
import { Card, Avatar, Badge, Select, Drawer, EmptyState, TableRowSkeleton, Modal } from '../components/ui.jsx'
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
  const [deptFilter, setDeptFilter] = useState('all')  // Clickable dept-card filter
  const [showModal, setShowModal] = useState(false)
  const [viewing, setViewing] = useState(null)        // employee being viewed
  const [editing, setEditing] = useState(null)        // employee being edited
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'employee', department: '' })
  const [busyId, setBusyId] = useState(null)         // row currently being mutated
  const [inviting, setInviting] = useState(false)   // "Create invites" submit in flight
  const [inviteErrors, setInviteErrors] = useState([])  // inline error display
  const emptyRow = () => ({ name: '', email: '', department: '', role: 'employee' })
  const [rows, setRows] = useState([emptyRow()])
  const [createdInvites, setCreatedInvites] = useState([])
  const [loading, setLoading] = useState(false)
  const [visibleLimit, setVisibleLimit] = useState(10)
  const [shifts, setShifts] = useState([])
  const [depts, setDepts] = useState([])
  const EMPLOYEE_PAGE_SIZE = 10

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    try {
      const [emps, invs, sh, d] = await Promise.all([realAPI.getEmployees(), realAPI.getInvites(), realAPI.getShifts(), realAPI.getDepartments()])
      setEmployees(emps || [])
      setInvites(invs || [])
      setShifts(sh || [])
      setDepts(d || [])
    } catch (err) {
      toast.push(err.message || 'Could not load employees', { tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Admins are not staff; exclude them from the team directory and stats.
  const staff = useMemo(() => employees.filter((u) => u.role !== 'admin'), [employees])

  const filtered = useMemo(() => {
    return staff.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (deptFilter !== 'all' && (u.department || '') !== deptFilter) return false
      if (!query) return true
      const q = query.toLowerCase()
      return u.name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
    })
  }, [staff, query, roleFilter, deptFilter])

  useEffect(() => { setVisibleLimit(EMPLOYEE_PAGE_SIZE) }, [query, roleFilter, deptFilter])

  const visibleEmployees = filtered.slice(0, visibleLimit)

  const recentInvites = useMemo(
    // Show last 10 accepted invites so the admin can see who they onboarded
    () => invites
      .filter((i) => i.status === 'accepted')
      .slice(0, 10),
    [invites]
  )

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
    if (inviting) return
    const validRows = rows.filter((r) => r.name.trim() && r.email.trim())
    if (validRows.length === 0) {
      toast.push('Fill in at least one name and email.', { tone: 'warning' })
      return
    }
    setInviting(true)
    setInviteErrors([])

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
        const errorMsg = `${r.email}: ${err.message}`
        errors.push(errorMsg)
        toast.push(errorMsg, { tone: 'error' })
      }
    }

    setInviteErrors(errors)

    if (created.length > 0) {
      await refresh()
      setCreatedInvites(created)
      setRows([emptyRow()])
      toast.push(`${created.length} invite${created.length === 1 ? '' : 's'} created.`, { tone: 'success' })
    } else if (errors.length > 0) {
      // All invites failed - keep modal open but show errors prominently
      toast.push('Failed to create invites. See errors above.', { tone: 'error' })
    }
    setInviting(false)
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

  function startEdit(emp) {
    setEditing(emp)
    setEditForm({
      name: emp.name || '',
      email: emp.email || '',
      role: emp.role || 'employee',
      department: emp.department || '',
    })
  }

  async function saveEdit() {
    if (!editing) return
    setBusyId(editing.id)
    try {
      await realAPI.updateEmployee(editing.id, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        department: editForm.department.trim(),
      })
      try { await realAPI.logAudit({ action: 'update_employee', entity_type: 'employee', entity_id: editing.id, new_values: editForm }) } catch {}
      toast.push('Employee updated', { tone: 'success' })
      setEditing(null)
      refresh()
    } catch (err) {
      toast.push(err.message || 'Could not update employee', { tone: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  async function deleteEmployee(emp) {
    if (!confirm(`Remove ${emp.name} from the team? They will lose access immediately.`)) return
    setBusyId(emp.id)
    try {
      await realAPI.deleteEmployee(emp.id)
      try { await realAPI.logAudit({ action: 'delete_employee', entity_type: 'employee', entity_id: emp.id }) } catch {}
      toast.push('Employee removed', { tone: 'info' })
      if (viewing?.id === emp.id) setViewing(null)
      refresh()
    } catch (err) {
      toast.push(err.message || 'Could not remove employee', { tone: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  // Department list with per-dept stats. Coverage = (assigned slots / required slots)
  // across all upcoming shifts for that department. Depts with 0 shifts show —.
  const departmentStats = useMemo(() => {
    const deptNames = Array.from(new Set([
      ...depts.map((d) => d.name),
      ...staff.map((e) => e.department).filter(Boolean),
    ])).filter(Boolean)
    return deptNames.map((dept) => {
      const memberCount = staff.filter((e) => (e.department || '') === dept).length
      const deptShifts = shifts.filter((s) => (s.department || '') === dept)
      // For each shift, fraction filled = assigned_staff / required_staff (capped 0..1)
      const coveragePct = deptShifts.length === 0
        ? null
        : Math.round(
            (deptShifts.reduce((acc, s) => {
              const required = s.required_staff || 1
              const filled = Math.min(required, (s.assigned_staff || []).length || (s.employee_id ? 1 : 0))
              return acc + (filled / required)
            }, 0) / deptShifts.length) * 100
          )
      return { name: dept, memberCount, shiftCount: deptShifts.length, coveragePct }
    }).sort((a, b) => b.memberCount - a.memberCount)
  }, [employees, shifts])

  const departments = useMemo(
    () => departmentStats.map((d) => d.name),
    [departmentStats]
  )

  function coverageTone(pct) {
    if (pct == null) return 'neutral'
    if (pct >= 90) return 'success'
    if (pct >= 70) return 'warning'
    return 'error'
  }

  function coverageBg(tone) {
    if (tone === 'success') return 'bg-success/10 border-success/30'
    if (tone === 'warning') return 'bg-warning/10 border-warning/30'
    if (tone === 'error') return 'bg-error/10 border-error/30'
    return 'bg-surface-variant/30 border-outline-variant/30'
  }

  function coverageText(tone) {
    if (tone === 'success') return 'text-success'
    if (tone === 'warning') return 'text-warning'
    if (tone === 'error') return 'text-error'
    return 'text-on-surface-variant'
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display-sm font-bold text-on-surface">Employees</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">{staff.length} team members · {recentInvites.length} recently joined</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Invite employee
        </button>
      </div>

      <section className="page-section space-y-md">
        {recentInvites.length > 0 && (
          <Card hover={false}>
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-md">Recently invited</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant -mt-sm mb-md">
              Newest members added to your team via invite. They can sign in with their email and the temporary password you saved.
            </p>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="text-left border-b border-outline-variant/30">
                    <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-sm px-4 md:px-0">Name</th>
                    <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-sm">Email</th>
                    <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-sm">Role</th>
                    <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-sm">Department</th>
                    <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-sm">Status</th>
                    <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-sm text-right pr-4 md:pr-0">Invite link</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvites.map((i) => (
                    <tr key={i.id} className="border-b border-outline-variant/20 hover:bg-surface-variant/30">
                      <td className="py-md px-4 md:px-0 font-label-md text-label-md font-semibold text-on-surface">{i.name || '—'}</td>
                      <td className="py-md text-on-surface-variant">{i.email}</td>
                      <td className="py-md"><Badge variant={i.role === 'admin' ? 'error' : 'neutral'}>{i.role}</Badge></td>
                      <td className="py-md font-label-md text-label-md text-on-surface">{i.department || '—'}</td>
                      <td className="py-md"><Badge variant="success">Joined</Badge></td>
                      <td className="py-md text-right pr-4 md:pr-0">
                        {i.token ? (
                          <button onClick={() => copyLink(i.token)} className="btn-secondary text-sm py-1.5 px-3">
                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                            Copy link
                          </button>
                        ) : <span className="text-on-surface-variant/60 text-sm">—</span>}
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
            <div>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Departments</h2>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                Click a department to filter the team list below. Coverage = open + filled shift slots.
              </p>
            </div>
            {deptFilter !== 'all' && (
              <button onClick={() => setDeptFilter('all')} className="btn-secondary text-xs">
                <span className="material-symbols-outlined text-[14px]">close</span>
                Clear filter
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {departmentStats.map((d) => {
              const isActive = deptFilter === d.name
              const tone = coverageTone(d.coveragePct)
              return (
                <button
                  key={d.name}
                  onClick={() => setDeptFilter(isActive ? 'all' : d.name)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    isActive
                      ? 'border-primary bg-primary/5 shadow-soft-sm'
                      : `border-transparent ${coverageBg(tone)} hover:scale-[1.02]`
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`w-2 h-2 rounded-full ${
                      tone === 'success' ? 'bg-success' :
                      tone === 'warning' ? 'bg-warning' :
                      tone === 'error' ? 'bg-error' : 'bg-on-surface-variant/40'
                    }`} />
                    {isActive && (
                      <span className="material-symbols-outlined text-primary text-[16px]">check_circle</span>
                    )}
                  </div>
                  <div className="font-headline-sm text-headline-sm font-bold text-on-surface truncate" title={d.name}>
                    {d.name}
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className={`font-headline-md text-headline-md font-bold ${coverageText(tone)}`}>
                      {d.coveragePct == null ? '—' : `${d.coveragePct}%`}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">coverage</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>{d.memberCount} member{d.memberCount === 1 ? '' : 's'}</span>
                    <span>{d.shiftCount} shift{d.shiftCount === 1 ? '' : 's'}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        <Card hover={false}>
          <div className="flex items-center justify-between mb-md flex-wrap gap-sm">
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Team members{deptFilter !== 'all' && <span className="ml-2 chip bg-primary/10 text-primary text-[10px]">{deptFilter}</span>}
            </h2>
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
                  <th className="font-label-sm text-label-sm text-on-surface-variant uppercase py-sm text-right pr-4 md:pr-0">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && employees.length === 0 ? (
                  <TableRowSkeleton rows={6} cols={5} />
                ) : (
                  visibleEmployees.map((u) => {
                    const initials = (u.name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                    const isBusy = busyId === u.id
                    return (
                      <tr key={u.id} className="border-b border-outline-variant/20 hover:bg-surface-variant/30">
                        <td className="py-md px-4 md:px-0">
                          <div className="flex items-center gap-sm">
                            <Avatar src={u.avatar} initials={initials} size="sm" />
                            <div>
                              <div className="font-label-md text-label-md font-bold text-on-surface">{u.name}</div>
                              <div className="font-label-sm text-label-sm text-on-surface-variant">{u.email || `${(u.name || '').toLowerCase().replace(/\s+/g, '.')}@stmarrys.health`}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-md"><Badge variant={u.role === 'admin' ? 'error' : 'neutral'}>{u.role}</Badge></td>
                        <td className="py-md font-label-md text-label-md text-on-surface">{u.department || '—'}</td>
                        <td className="py-md"><Badge variant="success">Active</Badge></td>
                        <td className="py-md text-right pr-4 md:pr-0">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => setViewing(u)}
                              disabled={isBusy}
                              className="p-1.5 rounded-md text-on-surface-variant hover:text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
                              title="View profile"
                              aria-label={`View ${u.name}`}
                            >
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </button>
                            <button
                              onClick={() => startEdit(u)}
                              disabled={isBusy}
                              className="p-1.5 rounded-md text-on-surface-variant hover:text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
                              title="Edit"
                              aria-label={`Edit ${u.name}`}
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => deleteEmployee(u)}
                              disabled={isBusy}
                              className="p-1.5 rounded-md text-on-surface-variant hover:text-error hover:bg-error/10 disabled:opacity-50 transition-colors"
                              title="Remove"
                              aria-label={`Remove ${u.name}`}
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      {staff.length === 0 ? (
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
          {!loading && filtered.length > visibleLimit && (
            <div className="mt-md flex flex-col items-center gap-1">
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Showing <span className="text-on-surface font-semibold">{visibleLimit}</span> of <span className="text-on-surface font-semibold">{filtered.length}</span> employees
              </p>
              <button
                onClick={() => setVisibleLimit((n) => n + EMPLOYEE_PAGE_SIZE)}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
                Show {Math.min(EMPLOYEE_PAGE_SIZE, filtered.length - visibleLimit)} more
              </button>
            </div>
          )}
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
                      <input type="email" value={row.email} onChange={(e) => updateRow(idx, { email: e.target.value })} className="input-base mt-xs w-full" placeholder="jane@yourteam.com" />
                    </div>
                    <div>
                      <label className="font-label-sm text-label-sm text-on-surface-variant">Department</label>
                      <Select value={row.department} onChange={(v) => updateRow(idx, { department: v })} options={[{value:'Unassigned',label:'Unassigned'}, ...depts.map((d) => ({value:d.name,label:d.name}))]} className="w-full mt-xs" />
                    </div>
                    <div>
                      <label className="font-label-sm text-label-sm text-on-surface-variant">Role</label>
                      <Select value={row.role} onChange={(v) => updateRow(idx, { role: v })} options={roles} className="w-full mt-xs" />
                    </div>
                  </div>
                ))}
              </div>

              {inviteErrors.length > 0 && (
                <div className="p-md rounded-xl bg-error/10 border border-error/30 space-y-sm">
                  <div className="flex items-center gap-2 text-error font-semibold">
                    <span className="material-symbols-outlined text-[20px]">error</span>
                    <span>Failed to create {inviteErrors.length} invite{inviteErrors.length === 1 ? '' : 's'}</span>
                  </div>
                  <ul className="space-y-1 text-sm text-error">
                    {inviteErrors.map((err, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-[16px] mt-0.5">cancel</span>
                        <span>{err}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button type="button" onClick={addRow} className="btn-secondary w-full justify-center">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add another employee
              </button>

              <div className="flex items-center justify-end gap-sm pt-sm border-t border-outline-variant/30">
                <button type="button" onClick={() => setShowModal(false)} disabled={inviting} className="btn-ghost disabled:opacity-60">Cancel</button>
                <button type="submit" disabled={inviting} className="btn-primary disabled:opacity-60">
                  {inviting ? 'Creating…' : 'Create invites'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-md">
              <p className="font-body-md text-body-md text-on-surface-variant">
                {createdInvites.length} invite{createdInvites.length === 1 ? '' : 's'} created. Copy the link and share it with the person. They'll set their own password when they open it.
              </p>
              <div className="space-y-sm max-h-[50vh] overflow-y-auto pr-1">
                {createdInvites.map((i) => (
                  <div key={i.id} className="p-md rounded-xl bg-surface-container/50 border border-outline-variant/30 space-y-sm">
                    <div className="font-label-md text-label-md font-semibold text-on-surface">{i.name || i.email}</div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant">{i.department || 'Unassigned'} · {i.role}</div>
                    <div className="flex items-center gap-sm">
                      <input readOnly value={inviteLink(i.token)} className="input-base flex-1 text-sm" />
                      <button onClick={() => copyLink(i.token)} className="btn-primary whitespace-nowrap py-2 px-3">
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                        Copy link
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

      {/* View employee drawer */}
      <Drawer open={!!viewing} onClose={() => setViewing(null)} title="Employee profile" subtitle={viewing?.title || viewing?.role || ''}>
        {viewing && (() => {
          const initials = (viewing.name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
          return (
            <div className="p-md space-y-md">
              <div className="flex items-center gap-md pb-md border-b border-outline-variant/30">
                <Avatar src={viewing.avatar} initials={initials} size="xl" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-headline-md text-lg font-bold text-on-surface truncate">{viewing.name}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{viewing.email}</p>
                  <div className="mt-xs flex items-center gap-2">
                    <Badge variant={viewing.role === 'admin' ? 'error' : 'neutral'}>{viewing.role}</Badge>
                    <Badge variant="info">{viewing.department || 'Unassigned'}</Badge>
                    <Badge variant="success">Active</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Title</div>
                  <div className="font-label-md text-label-md text-on-surface">{viewing.title || '—'}</div>
                </div>
                <div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Manager</div>
                  <div className="font-label-md text-label-md text-on-surface">{viewing.managerId || viewing.manager_id || '—'}</div>
                </div>
                <div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Hours this week</div>
                  <div className="font-label-md text-label-md text-on-surface">{viewing.hoursThisWeek ?? viewing.hours_this_week ?? '—'}</div>
                </div>
              </div>

              <div className="pt-sm border-t border-outline-variant/30 flex items-center justify-end gap-sm">
                <button onClick={() => setViewing(null)} className="btn-ghost">Close</button>
                <button onClick={() => { const v = viewing; setViewing(null); startEdit(v); }} className="btn-secondary">
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Edit
                </button>
              </div>
            </div>
          )
        })()}
      </Drawer>

      {/* Edit employee modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit employee" subtitle={editing?.name || ''}>
        <form onSubmit={(e) => { e.preventDefault(); saveEdit() }} className="p-md space-y-md">
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">Full name</label>
            <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="input-base mt-xs w-full" required />
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">Work email</label>
            <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="input-base mt-xs w-full" required />
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">Department</label>
            <Select value={editForm.department} onChange={(v) => setEditForm({ ...editForm, department: v })} options={[{ value: '', label: 'Unassigned' }, ...departments.map((d) => ({ value: d, label: d }))]} className="w-full mt-xs" />
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant">Role</label>
            <Select value={editForm.role} onChange={(v) => setEditForm({ ...editForm, role: v })} options={roles} className="w-full mt-xs" />
          </div>
          <div className="flex items-center justify-end gap-sm pt-sm border-t border-outline-variant/30">
            <button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={busyId === editing?.id} className="btn-primary">
              {busyId === editing?.id ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
