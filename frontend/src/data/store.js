// Central data store — single source of truth for all app data
// All pages import from here. localStorage is the "backend".
// Swap this file for real API calls later.

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SLOTS = ['morning', 'afternoon', 'night']

export const DEFAULT_SHIFT_HOURS = 8
export const DEFAULT_MAX_WEEKLY = 48
export const DEFAULT_CONSECUTIVE_MAX = 5
export const DEFAULT_REST_GAP = 8

// ─── Helpers ────────────────────────────────

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}
function write(key, value) { localStorage.setItem(key, JSON.stringify(value)) }

export function today() {
  return new Date(new Date().toISOString().slice(0, 10))
}

export function weekRange() {
  const t = today()
  const d = t.getDay()
  const start = new Date(t); start.setDate(t.getDate() - d)
  const end = new Date(start); end.setDate(start.getDate() + 6)
  return { start, end }
}

export function formatDate(d) {
  if (!d) return ''
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split('-').map(Number)
    return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
export function formatDateFull(d) {
  if (!d) return ''
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split('-').map(Number)
    return new Date(y, m - 1, day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
export function timeLabel(h) {
  if (h === 0) return '12 AM'
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

function uid(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }

// ─── Employees ──────────────────────────────

export function getEmployees() { return read('gs_employees', []) }

export function getEmployee(id) {
  return getEmployees().find(e => e.id === id)
}

export function addEmployee(emp) {
  const all = getEmployees()
  const e = { ...emp, id: emp.id || uid('emp') }
  all.push(e)
  write('gs_employees', all)
  return e
}

export function updateEmployee(id, patch) {
  const all = getEmployees()
  const i = all.findIndex(e => e.id === id)
  if (i === -1) return null
  all[i] = { ...all[i], ...patch }
  write('gs_employees', all)
  return all[i]
}

export function getEmployeeByEmail(email) {
  return getEmployees().find(e => e.email?.toLowerCase() === email?.toLowerCase())
}

// ─── Invites ────────────────────────────────

export function getInvites() { return read('gs_invites', []) }

export function getInviteByToken(token) {
  return getInvites().find(i => i.token === token)
}

export function getInviteByEmail(email) {
  return getInvites().find(i => i.email?.toLowerCase() === email?.toLowerCase())
}

export function addInvite({ email, name = '', department = 'Unassigned', role = 'employee' }) {
  const all = getInvites()
  const normalized = email?.toLowerCase().trim()
  if (all.some(i => i.email?.toLowerCase() === normalized && i.status !== 'expired')) {
    return { error: 'An active invite already exists for this email.' }
  }
  const invite = {
    id: uid('inv'),
    email: normalized,
    name: name.trim(),
    department,
    role,
    token: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  all.push(invite)
  write('gs_invites', all)
  return { invite }
}

export function acceptInvite(token) {
  const all = getInvites()
  const i = all.findIndex(inv => inv.token === token)
  if (i === -1) return { error: 'Invite not found.' }
  if (all[i].status === 'accepted') return { invite: all[i], alreadyAccepted: true }

  all[i].status = 'accepted'
  all[i].acceptedAt = new Date().toISOString()
  write('gs_invites', all)

  // Create the employee account if it doesn't exist yet
  const existing = getEmployeeByEmail(all[i].email)
  if (!existing) {
    addEmployee({
      name: all[i].name || all[i].email.split('@')[0],
      email: all[i].email,
      role: all[i].role,
      title: all[i].role === 'admin' ? 'Administrator' : 'Staff',
      department: all[i].department,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(all[i].name || all[i].email)}&background=6366f1&color=fff&size=120`,
    })
  }

  return { invite: all[i] }
}

// ─── Shifts ─────────────────────────────────

export function getShifts() { return read('gs_shifts', []) }

export function getShift(id) { return getShifts().find(s => s.id === id) }

export function getOpenShifts() { return getShifts().filter(s => s.status === 'open') }

export function getShiftsForEmployee(empId) {
  return getShifts().filter(s => s.employeeId === empId)
}

export function getShiftsForWeek(startDate) {
  const end = new Date(startDate)
  end.setDate(end.getDate() + 7)
  return getShifts().filter(s => {
    const d = new Date(s.date)
    return d >= startDate && d < end
  })
}

export function addShift(shift) {
  const all = getShifts()
  const s = {
    id: uid('s'),
    employeeId: null,
    title: '',
    department: '',
    date: today().toISOString(),
    startHour: 9,
    durationHours: 8,
    status: 'open',
    notes: '',
    urgency: 'medium',
    eligible: 0,
    description: '',
    requiredStaff: 1,
    assignedStaff: [],
    ...shift,
    id: shift.id || uid('s'),
  }
  all.push(s)
  write('gs_shifts', all)
  addNotification('shift-created', `New ${s.title} shift posted · ${formatDateFull(s.date)}`, s.department)
  return s
}

export function updateShift(id, patch) {
  const all = getShifts()
  const i = all.findIndex(s => s.id === id)
  if (i === -1) return null
  all[i] = { ...all[i], ...patch }
  write('gs_shifts', all)
  return all[i]
}

export function deleteShift(id) {
  const all = getShifts()
  const next = all.filter(s => s.id !== id)
  if (next.length === all.length) return false
  write('gs_shifts', next)
  return true
}

export function assignShift(shiftId, employeeId) {
  const s = updateShift(shiftId, { employeeId, status: 'active' })
  if (s) {
    const emp = getEmployee(employeeId)
    addNotification('shift-assigned', `${emp?.name || 'Someone'} assigned to ${s.title} shift · ${formatDateFull(s.date)}`, s.department)
  }
  return s
}

export function getSlotsRemaining(shiftId) {
  const shift = getShift(shiftId)
  if (!shift) return 0
  const required = shift.requiredStaff || 1
  const assigned = shift.assignedStaff?.length || (shift.employeeId ? 1 : 0)
  return Math.max(0, required - assigned)
}

export function assignToSlot(shiftId, employeeId) {
  const shift = getShift(shiftId)
  if (!shift) return null
  
  const assignedStaff = shift.assignedStaff || []
  if (assignedStaff.includes(employeeId)) return shift
  
  const required = shift.requiredStaff || 1
  if (assignedStaff.length >= required) return null
  
  const newAssigned = [...assignedStaff, employeeId]
  const newStatus = newAssigned.length >= required ? 'active' : 'partial'
  
  return updateShift(shiftId, { 
    assignedStaff: newAssigned,
    employeeId: newAssigned[0],
    status: newStatus 
  })
}

export function getRequestQueueForShift(shiftId) {
  const swaps = getSwaps()
  const requests = swaps.filter(s => s.fromShiftId === shiftId && s.status === 'pending')
  
  return requests.map(req => {
    const score = computeMatchScore(shiftId, req.requesterId)
    return { ...req, matchScore: score }
  }).sort((a, b) => b.matchScore - a.matchScore)
}

export function autoApproveBestCandidate(shiftId) {
  const queue = getRequestQueueForShift(shiftId)
  if (queue.length === 0) return null
  
  const best = queue[0]
  if (best.matchScore >= 85) {
    return approveSwap(best.id)
  }
  return null
}

export function publishSchedule(shiftIds) {
  const all = getShifts()
  let count = 0
  all.forEach((s, i) => {
    if (s.status === 'draft' && (!shiftIds || shiftIds.includes(s.id))) {
      all[i].status = 'scheduled'
      count++
    }
  })
  write('gs_shifts', all)
  addNotification('schedule-published', `${count} shift${count === 1 ? '' : 's'} published to schedule`, null)
  return count
}

// ─── Swaps ──────────────────────────────────

export function getSwaps() { return read('gs_swaps', []) }

export function getPendingSwaps() { return getSwaps().filter(s => s.status === 'pending') }

export function addSwap(swap) {
  const all = getSwaps()
  
  // Compute AI match score if requesting a shift
  let matchScore = swap.aiScore || Math.floor(Math.random() * 30 + 70)
  if (swap.fromShiftId && swap.requesterId) {
    matchScore = computeMatchScore(swap.fromShiftId, swap.requesterId)
  }
  
  const s = {
    id: uid('sw'),
    requesterId: '',
    requesterName: '',
    targetId: null,
    targetName: null,
    fromShiftId: null,
    toShiftId: null,
    reason: '',
    status: 'pending',
    submittedAt: new Date().toISOString(),
    aiScore: matchScore,
    matchScore: matchScore,
    ...swap,
    id: swap.id || uid('sw'),
  }
  all.push(s)
  write('gs_swaps', all)
  const emp = getEmployee(s.requesterId)
  addNotification('swap-requested', `${emp?.name || 'Employee'} requested a shift swap · ${formatDateFull(new Date())}`, emp?.department)
  return s
}

export function approveSwap(swapId) {
  const all = getSwaps()
  const i = all.findIndex(s => s.id === swapId)
  if (i === -1) return null
  const sw = all[i]

  // Conflict detection: check if requester already has a shift at the same time
  if (sw.fromShiftId) {
    const fromShift = getShift(sw.fromShiftId)
    if (fromShift) {
      const requesterShifts = getShiftsForEmployee(sw.requesterId)
      const conflict = requesterShifts.find(s => {
        if (s.id === sw.fromShiftId) return false
        const sDate = typeof s.date === 'string' ? s.date : s.date?.toISOString?.() || ''
        const fDate = typeof fromShift.date === 'string' ? fromShift.date : fromShift.date?.toISOString?.() || ''
        if (sDate.slice(0, 10) !== fDate.slice(0, 10)) return false
        const sEnd = s.startHour + s.durationHours
        const fEnd = fromShift.startHour + fromShift.durationHours
        return s.startHour < fEnd && fromShift.startHour < sEnd
      })
      if (conflict) {
        return { error: `Conflict: ${sw.requesterName} already has a shift at that time (${conflict.title || conflict.role}).` }
      }
    }
  }

  // Hard work-hour limits: check if approval would push requester over max
  if (sw.fromShiftId) {
    const fromShift = getShift(sw.fromShiftId)
    if (fromShift) {
      const policies = getPolicies()
      const { start } = weekRange()
      const requesterShifts = getShiftsForEmployee(sw.requesterId)
      const weekHours = requesterShifts
        .filter(s => new Date(s.date) >= start && s.id !== sw.fromShiftId)
        .reduce((sum, s) => sum + s.durationHours, 0)
      const newTotal = weekHours + fromShift.durationHours
      if (newTotal > policies.maxWeeklyHours) {
        return { error: `Blocked: approving would put ${sw.requesterName} at ${newTotal}h this week (max ${policies.maxWeeklyHours}h).` }
      }
    }
  }

  all[i].status = 'approved'
  all[i].decidedAt = new Date().toISOString()
  write('gs_swaps', all)

  // Reassign the shift to the requester
  if (sw.fromShiftId) {
    const shift = getShift(sw.fromShiftId)
    if (shift) {
      updateShift(sw.fromShiftId, { employeeId: sw.requesterId, status: 'active' })
    }
  }
  if (sw.toShiftId) {
    const shift = getShift(sw.toShiftId)
    if (shift && sw.targetId) {
      updateShift(sw.toShiftId, { employeeId: sw.targetId, status: 'active' })
    }
  }

  addNotification('swap-approved', `Swap approved: ${sw.requesterName}`, sw.requesterId)
  return all[i]
}

export function declineSwap(swapId) {
  const all = getSwaps()
  const i = all.findIndex(s => s.id === swapId)
  if (i === -1) return null
  all[i].status = 'declined'
  write('gs_swaps', all)
  return all[i]
}

// ─── Availability ───────────────────────────

export function getAvailability(empId) {
  const all = read('gs_availability', [])
  return all.filter(a => a.employeeId === empId)
}

export function getAvailabilityGrid(empId) {
  const entries = getAvailability(empId)
  return DAYS.map((_, day) =>
    SLOTS.map(slot => {
      const e = entries.find(a => a.day === day && a.slot === slot)
      return e ? e.value : 'neutral'
    })
  )
}

export function setAvailabilityCell(empId, day, slot, value) {
  const all = read('gs_availability', [])
  const idx = all.findIndex(a => a.employeeId === empId && a.day === day && a.slot === slot)
  if (idx === -1) {
    all.push({ employeeId: empId, day, slot, value })
  } else {
    all[idx].value = value
  }
  write('gs_availability', all)
  return all
}

export function getAllAvailability() {
  return read('gs_availability', [])
}

// ─── AI Match scoring ──────────────────────

export function computeMatchScore(shiftId, employeeId) {
  const shift = getShift(shiftId)
  const emp = getEmployee(employeeId)
  if (!shift || !emp) return 0

  let score = 100

  // Same department → +0 (stays at 100)
  if (shift.department !== emp.department) score -= 15

  // Burnout: high burnout reduces score
  const burnout = computeBurnout(employeeId)
  if (burnout.score > 70) score -= 20
  else if (burnout.score > 50) score -= 10

  // Consecutive days: working the day before/after reduces score
  if (burnout.consecutiveDays >= 4) score -= 15
  else if (burnout.consecutiveDays >= 3) score -= 7

  // Weekly hours: already near max
  const policies = getPolicies()
  const weeklyPct = burnout.hoursThisWeek / policies.maxWeeklyHours
  if (weeklyPct > 0.9) score -= 20
  else if (weeklyPct > 0.7) score -= 10

  // Night shift penalty: night shift + already has night shifts increases preference to avoid
  const isNight = shift.startHour >= 19 || shift.startHour <= 4
  if (isNight && burnout.nightShifts >= 3) score -= 10

  // Availability preference check
  const shiftDate = new Date(shift.date)
  const day = shiftDate.getDay()
  const slot = shift.startHour >= 19 ? 2 : shift.startHour >= 15 ? 1 : 0 // night/afternoon/morning
  const all = read('gs_availability', [])
  const avail = all.find(a => a.employeeId === employeeId && a.day === day && a.slot === SLOTS[slot])

  if (avail) {
    if (avail.value === 'unavailable') score -= 30
    else if (avail.value === 'preferred') score += 5
  }

  // Fairness: penalize if employee already has disproportionate weekend/night shifts
  const fairness = computeFairness()
  const empStats = fairness.stats.find(s => s.id === employeeId)
  if (empStats) {
    const isWeekend = day === 0 || day === 6
    const isNight = shift.startHour >= 19 || shift.startHour <= 4
    if (isWeekend && empStats.weekendShifts > fairness.averages.weekend * 1.5) score -= 8
    if (isNight && empStats.nightShifts > fairness.averages.night * 1.5) score -= 8
    if (empStats.overtime > fairness.averages.overtime * 1.5) score -= 5
  }

  // Seniority: slight bonus for longer-tenured employees
  if (emp.hiredAt) {
    const tenureMonths = (new Date() - new Date(emp.hiredAt)) / (1000 * 60 * 60 * 24 * 30)
    if (tenureMonths > 24) score += 3
    else if (tenureMonths > 12) score += 1
  }

  return Math.max(0, Math.min(100, score))
}

export function findCandidates(shiftId, limit = 5) {
  const shift = getShift(shiftId)
  if (!shift) return []
  const employees = getEmployees()
  return employees
    .filter(e => e.id !== shift.employeeId)
    .map(e => ({ ...e, score: computeMatchScore(shiftId, e.id) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function computeBurnout(empId) {
  const shifts = getShiftsForEmployee(empId)
  if (!shifts.length) return { score: 0, trend: 'stable', hoursThisWeek: 0, overtime: 0, consecutiveDays: 0, nightShifts: 0, deniedLeaves: 0 }

  // This week's hours
  const { start } = weekRange()
  const weekShifts = shifts.filter(s => new Date(s.date) >= start)
  const hoursThisWeek = weekShifts.reduce((t, s) => t + s.durationHours, 0)

  // Overtime: hours beyond the 40h baseline
  const overtime = Math.max(0, hoursThisWeek - 40)

  // Consecutive days worked (look at last 14 days)
  const recentDates = [...new Set(shifts
    .filter(s => {
      const d = new Date(s.date)
      const diff = (today().getTime() - d.getTime()) / 86400000
      return diff <= 14
    })
    .map(s => s.date)
    .sort((a, b) => new Date(b) - new Date(a))
  )]

  let consecutiveDays = 0
  for (let i = 0; i < recentDates.length; i++) {
    if (i === 0) { consecutiveDays = 1; continue }
    const diff = (new Date(recentDates[i - 1]).getTime() - new Date(recentDates[i]).getTime()) / 86400000
    if (diff <= 1.5) consecutiveDays++
    else break
  }

  // Night shifts (starts at >= 19 or starts <= 4)
  const nightShifts = shifts.filter(s => s.startHour >= 19 || s.startHour <= 4).length

  // Denied leave requests
  const deniedLeaves = getDeniedLeaveCount(empId)

  // Score: 0-100. Factors: overtime weight, consecutive weight, night weight, denied leave weight
  const overtimeScore = Math.min(100, (overtime / 20) * 100)
  const consecutiveScore = Math.min(100, (consecutiveDays / 7) * 100)
  const nightScore = Math.min(100, (nightShifts / 5) * 100)
  const deniedScore = Math.min(100, (deniedLeaves / 3) * 100)
  const score = Math.round((overtimeScore * 0.30 + consecutiveScore * 0.30 + nightScore * 0.25 + deniedScore * 0.15))

  let trend = 'stable'
  if (score > 70) trend = 'up'
  if (score < 30) trend = 'down'

  return { score, trend, hoursThisWeek, overtime, consecutiveDays, nightShifts, deniedLeaves }
}

export function computeAllBurnout() {
  return getEmployees().map(e => ({ id: e.id, name: e.name, department: e.department, ...computeBurnout(e.id) }))
}

// ─── Coverage gaps (computed) ───────────────

export function computeCoverageGaps() {
  // For each day this week, check if any department has too few scheduled staff
  const { start } = weekRange()
  const shifts = getShifts()
  const depts = [...new Set(shifts.map(s => s.department).filter(Boolean))]
  const gaps = []

  for (let d = 0; d < 7; d++) {
    const date = new Date(start); date.setDate(date.getDate() + d)
    const dateStr = date.toISOString().slice(0, 10)
    depts.forEach(dept => {
      const dayShifts = shifts.filter(s => s.department === dept && s.date === dateStr)
      const staffed = dayShifts.filter(s => s.status === 'active' || s.status === 'scheduled').length
      const total = dayShifts.length
      if (total > 0 && staffed < 2) {
        gaps.push({
          id: `gap-${dept}-${d}`,
          department: dept,
          day: DAYS[(date.getDay())],
          date: dateStr,
          staffed,
          needed: Math.max(2, staffed + 1),
          severity: staffed === 0 ? 'critical' : 'medium',
        })
      }
    })
  }
  return gaps
}

// ─── Notifications ──────────────────────────

export function getNotifications(unreadOnly) {
  const n = read('gs_notifications', [])
  return unreadOnly ? n.filter(x => x.unread) : n
}

export function addNotification(type, body, context) {
  const all = read('gs_notifications', [])
  all.unshift({
    id: uid('n'),
    type,
    body,
    context,
    time: new Date().toISOString(),
    unread: true,
  })
  // Keep only last 50
  if (all.length > 50) all.length = 50
  write('gs_notifications', all)
  return all[0]
}

export function markNotificationRead(nid) {
  const all = read('gs_notifications', [])
  const n = all.find(x => x.id === nid)
  if (n) { n.unread = false; write('gs_notifications', all) }
}

export function markAllNotificationsRead() {
  const all = read('gs_notifications', [])
  all.forEach(n => n.unread = false)
  write('gs_notifications', all)
}

// ─── Organization & Policies ────────────────

const DEFAULT_ORG = {
  name: 'My Organization',
  displayName: '',
  timezone: 'America/New_York',
  weekStartsOn: 'monday',
  defaultShiftLength: DEFAULT_SHIFT_HOURS,
  currency: 'USD',
}

export function getOrg() { return read('gs_org', DEFAULT_ORG) }
export function updateOrg(patch) { write('gs_org', { ...getOrg(), ...patch }); return getOrg() }

const DEFAULT_POLICIES = {
  maxConsecutiveDays: DEFAULT_CONSECUTIVE_MAX,
  minRestGap: DEFAULT_REST_GAP,
  maxWeeklyHours: DEFAULT_MAX_WEEKLY,
  swapApprovalWindow: 48, // hours

}

export function getPolicies() { return read('gs_policies', DEFAULT_POLICIES) }
export function updatePolicies(patch) { write('gs_policies', { ...getPolicies(), ...patch }); return getPolicies() }

// ─── Fairness Analytics ─────────────────────

export function computeFairness() {
  const employees = getEmployees().filter(e => e.role === 'employee')
  const shifts = getShifts()

  const stats = employees.map(emp => {
    const empShifts = shifts.filter(s => s.employeeId === emp.id)
    const weekendShifts = empShifts.filter(s => {
      const d = new Date(s.date).getDay()
      return d === 0 || d === 6
    }).length
    const nightShifts = empShifts.filter(s => s.startHour >= 19 || s.startHour <= 4).length
    const totalHours = empShifts.reduce((sum, s) => sum + s.durationHours, 0)
    const overtime = Math.max(0, totalHours - 40)
    return { id: emp.id, name: emp.name, department: emp.department, weekendShifts, nightShifts, totalHours, overtime }
  })

  const avgWeekend = stats.length ? stats.reduce((s, e) => s + e.weekendShifts, 0) / stats.length : 0
  const avgNight = stats.length ? stats.reduce((s, e) => s + e.nightShifts, 0) / stats.length : 0
  const avgHours = stats.length ? stats.reduce((s, e) => s + e.totalHours, 0) / stats.length : 0
  const avgOvertime = stats.length ? stats.reduce((s, e) => s + e.overtime, 0) / stats.length : 0

  const variance = (arr, avg) => {
    if (!arr.length) return 0
    return arr.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / arr.length
  }

  const weekendVariance = variance(stats.map(s => s.weekendShifts), avgWeekend)
  const nightVariance = variance(stats.map(s => s.nightShifts), avgNight)
  const hoursVariance = variance(stats.map(s => s.totalHours), avgHours)
  const overtimeVariance = variance(stats.map(s => s.overtime), avgOvertime)

  const maxVariance = Math.max(weekendVariance, nightVariance, hoursVariance, overtimeVariance, 1)
  const fairnessScore = Math.round(100 - (maxVariance / 10))

  return {
    stats,
    averages: { weekend: avgWeekend, night: avgNight, hours: avgHours, overtime: avgOvertime },
    variances: { weekend: weekendVariance, night: nightVariance, hours: hoursVariance, overtime: overtimeVariance },
    fairnessScore: Math.max(0, Math.min(100, fairnessScore)),
  }
}

// ─── PTO / Leave Requests ───────────────────

export function getLeaveRequests() { return read('gs_leaves', []) }

export function addLeaveRequest(req) {
  const all = getLeaveRequests()
  const r = {
    id: uid('lv'),
    employeeId: '',
    employeeName: '',
    type: 'vacation',
    startDate: '',
    endDate: '',
    reason: '',
    status: 'pending',
    submittedAt: new Date().toISOString(),
    ...req,
  }
  all.push(r)
  write('gs_leaves', all)
  addNotification('leave-requested', `${r.employeeName} requested ${r.type} leave · ${formatDate(r.startDate)}–${formatDate(r.endDate)}`, r.employeeId)
  return r
}

export function approveLeave(id) {
  const all = getLeaveRequests()
  const i = all.findIndex(r => r.id === id)
  if (i === -1) return null
  all[i].status = 'approved'
  all[i].decidedAt = new Date().toISOString()
  write('gs_leaves', all)
  addNotification('leave-approved', `Leave request approved for ${all[i].employeeName}`, all[i].employeeId)
  return all[i]
}

export function declineLeave(id) {
  const all = getLeaveRequests()
  const i = all.findIndex(r => r.id === id)
  if (i === -1) return null
  all[i].status = 'declined'
  all[i].decidedAt = new Date().toISOString()
  write('gs_leaves', all)
  return all[i]
}

export function getDeniedLeaveCount(empId) {
  return getLeaveRequests().filter(r => r.employeeId === empId && r.status === 'declined').length
}

// ─── Attendance (mock) ──────────────────────

export function getAttendance() { return read('gs_attendance', []) }

export function getAttendanceForEmployee(empId) {
  return getAttendance().filter(a => a.employeeId === empId)
}

export function computeAbsenteeTrends() {
  const attendance = getAttendance()
  const employees = getEmployees().filter(e => e.role === 'employee')
  const alerts = []

  employees.forEach(emp => {
    const records = attendance.filter(a => a.employeeId === emp.id)
    const absences = records.filter(a => a.status === 'absent')
    const lateArrivals = records.filter(a => a.status === 'late')
    const total = records.length || 1
    const absenceRate = (absences.length / total) * 100
    const lateRate = (lateArrivals.length / total) * 100

    if (absenceRate > 15 || lateRate > 20) {
      alerts.push({
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        absenceRate: Math.round(absenceRate),
        lateRate: Math.round(lateRate),
        severity: absenceRate > 25 ? 'critical' : absenceRate > 15 ? 'high' : 'medium',
        trend: absenceRate > 15 ? 'rising' : 'stable',
      })
    }
  })

  return alerts.sort((a, b) => b.absenceRate - a.absenceRate)
}

// ─── Peak Hour Risks (mock) ─────────────────

export function getPeakHourRisks() { return read('gs_peak_risks', []) }

export function computePeakHourRisks() {
  const shifts = getShifts()
  const risks = []
  const hours = Array.from({ length: 24 }, (_, i) => i)

  hours.forEach(hour => {
    const shiftsAtHour = shifts.filter(s => s.startHour <= hour && s.startHour + s.durationHours > hour)
    const staffed = shiftsAtHour.filter(s => s.status === 'active' || s.status === 'scheduled').length
    const total = shiftsAtHour.length

    if (total > 0 && staffed < total * 0.7) {
      risks.push({
        hour,
        label: timeLabel(hour),
        staffed,
        needed: total,
        gap: total - staffed,
        severity: staffed < total * 0.5 ? 'critical' : 'high',
        departments: [...new Set(shiftsAtHour.map(s => s.department))],
      })
    }
  })

  return risks.sort((a, b) => a.hour - b.hour)
}

// ─── PTO Utilization ────────────────────────

export function computePTOUtilization() {
  const employees = getEmployees().filter(e => e.role === 'employee')
  const leaves = getLeaveRequests().filter(l => l.status === 'approved')
  if (!employees.length) return 0

  const totalPTODays = 20 // assumed annual PTO days per employee
  const usedDays = leaves.reduce((sum, l) => {
    const start = new Date(l.startDate)
    const end = new Date(l.endDate)
    const days = Math.ceil((end - start) / 86400000) + 1
    return sum + days
  }, 0)

  const totalAvailable = employees.length * totalPTODays
  return Math.round((usedDays / totalAvailable) * 100)
}

// ─── Certification Expiry ───────────────────

export function getCertExpiryAlerts() {
  const employees = getEmployees()
  const alerts = []
  const now = new Date()
  employees.forEach(emp => {
    const certs = emp.certExpiry || {}
    Object.entries(certs).forEach(([cert, expiryDate]) => {
      const expiry = new Date(expiryDate)
      const daysUntil = Math.ceil((expiry - now) / 86400000)
      if (daysUntil <= 90 && daysUntil >= 0) {
        alerts.push({
          employeeId: emp.id,
          employeeName: emp.name,
          cert,
          expiryDate: expiryDate,
          daysUntil,
          severity: daysUntil <= 14 ? 'critical' : daysUntil <= 30 ? 'high' : 'medium',
        })
      }
    })
  })
  return alerts.sort((a, b) => a.daysUntil - b.daysUntil)
}

// ─── Seed function ──────────────────────────

export function seedData({ currentUser, managerUser, adminUser, employees, shifts, swapRequests }) {
  if (getShifts().length > 0) return

  const seeded = [
    { ...adminUser, role: 'admin', password: 'password', department: adminUser.title },
    { ...managerUser, role: 'admin', password: 'password', department: managerUser.department },
    { ...currentUser, role: 'employee', password: 'password', department: currentUser.department,
      certExpiry: { BLS: '2026-08-15', ACLS: '2026-09-20', PALS: '2026-07-10' } },
    ...employees.map(e => ({
      id: e.id, name: e.name, email: `${e.name.toLowerCase().replace(/\s+/g, '.')}@stmarrys.health`,
      role: 'employee', password: 'password', title: e.role, department: e.dept,
      avatar: e.avatar,
      certExpiry: e.id === 'e-202' ? { BLS: '2026-07-05', ACLS: '2027-01-15', PALS: '2026-12-01' }
        : e.id === 'e-205' ? { BLS: '2026-08-20', ACLS: '2026-07-28', PALS: '2027-03-10', TNCC: '2026-11-15' }
        : e.id === 'e-207' ? { BLS: '2026-09-01', ACLS: '2026-07-18', CEN: '2027-06-01' }
        : e.id === 'e-210' ? { BLS: '2026-10-15', PALS: '2026-07-22' }
        : {},
    })),
  ]
  write('gs_employees', seeded)
  write('gs_invites', seeded
    .filter(e => e.email)
    .map(e => ({
      id: uid('inv'),
      email: e.email.toLowerCase(),
      name: e.name,
      department: e.department,
      role: e.role,
      token: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
      status: 'accepted',
      createdAt: new Date().toISOString(),
      acceptedAt: new Date().toISOString(),
    })))
  write('gs_shifts', shifts.map((s) => ({
    ...s,
    urgency: s.urgency || (s.status === 'open' ? 'medium' : 'low'),

    eligible: s.eligible || 0,
    description: s.notes || `${s.department} shift`,
    requiredStaff: s.requiredStaff || 1,
    assignedStaff: s.employeeId ? [s.employeeId] : [],
  })))
  write('gs_swaps', swapRequests)
  write('gs_org', DEFAULT_ORG)
  write('gs_policies', DEFAULT_POLICIES)
  write('gs_availability', [])
  write('gs_leaves', [
    { id: 'lv-seed-1', employeeId: 'e-201', employeeName: 'Sarah Chen', type: 'vacation', startDate: '2026-07-15', endDate: '2026-07-19', reason: 'Family trip', status: 'approved', submittedAt: '2026-06-20T10:00:00Z', decidedAt: '2026-06-21T09:00:00Z' },
    { id: 'lv-seed-2', employeeId: 'e-207', employeeName: 'Olivia Reyes', type: 'sick', startDate: '2026-06-25', endDate: '2026-06-26', reason: 'Flu', status: 'approved', submittedAt: '2026-06-24T22:00:00Z', decidedAt: '2026-06-25T07:00:00Z' },
    { id: 'lv-seed-3', employeeId: 'e-205', employeeName: 'Aisha Mensah', type: 'personal', startDate: '2026-07-04', endDate: '2026-07-04', reason: 'Independence Day', status: 'approved', submittedAt: '2026-06-22T14:00:00Z', decidedAt: '2026-06-22T16:00:00Z' },
    { id: 'lv-seed-4', employeeId: 'e-202', employeeName: 'Marcus Vance', type: 'vacation', startDate: '2026-07-10', endDate: '2026-07-12', reason: 'Wedding', status: 'declined', submittedAt: '2026-06-18T11:00:00Z', decidedAt: '2026-06-19T08:00:00Z' },
    { id: 'lv-seed-5', employeeId: 'e-204', employeeName: 'James Park', type: 'bereavement', startDate: '2026-06-28', endDate: '2026-06-30', reason: 'Family loss', status: 'approved', submittedAt: '2026-06-27T06:00:00Z', decidedAt: '2026-06-27T07:00:00Z' },
  ])

  // Seed attendance data (last 14 days)
  const attendanceRecords = []
  const empIds = seeded.filter(e => e.role === 'employee').map(e => e.id)
  for (let d = 13; d >= 0; d--) {
    const date = new Date()
    date.setDate(date.getDate() - d)
    const dateStr = date.toISOString().slice(0, 10)
    empIds.forEach(empId => {
      const rand = Math.random()
      let status = 'present'
      let minutesLate = 0
      if (empId === 'e-207' && rand < 0.25) { status = 'absent' }
      else if (empId === 'e-207' && rand < 0.40) { status = 'late'; minutesLate = Math.floor(Math.random() * 30 + 5) }
      else if (empId === 'e-205' && rand < 0.20) { status = 'absent' }
      else if (empId === 'e-205' && rand < 0.35) { status = 'late'; minutesLate = Math.floor(Math.random() * 20 + 5) }
      else if (rand < 0.05) { status = 'absent' }
      else if (rand < 0.10) { status = 'late'; minutesLate = Math.floor(Math.random() * 15 + 2) }
      attendanceRecords.push({ employeeId: empId, date: dateStr, status, minutesLate })
    })
  }
  write('gs_attendance', attendanceRecords)

  // Seed peak hour risks
  const peakRisks = [
    { hour: 7, label: '7 AM', staffed: 8, needed: 12, gap: 4, severity: 'high', departments: ['ICU Ward B', 'ER Triage', 'Pediatrics'] },
    { hour: 19, label: '7 PM', staffed: 5, needed: 10, gap: 5, severity: 'critical', departments: ['ER Triage', 'ICU Ward A', 'ICU Ward B'] },
    { hour: 3, label: '3 AM', staffed: 2, needed: 6, gap: 4, severity: 'critical', departments: ['ER Triage', 'ICU Ward B'] },
  ]
  write('gs_peak_risks', peakRisks)

  write('gs_notifications', [
    { id: 'n-seed-1', type: 'welcome', body: 'Welcome to GhostShift', context: null, time: new Date().toISOString(), unread: true },
    { id: 'n-seed-2', type: 'info', body: 'Set up your organization in Admin Settings', context: null, time: new Date(Date.now() - 3600000).toISOString(), unread: true },
    { id: 'n-seed-3', type: 'info', body: 'Add employees and create shifts to get started', context: null, time: new Date(Date.now() - 7200000).toISOString(), unread: false },
  ])
}

// Re-export helpers
export { DAYS, SLOTS }
