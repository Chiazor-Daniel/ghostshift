/** Shared shift state helpers — keep dashboard filters consistent everywhere. */

export function isShiftCompleted(s) {
  if (!s) return false
  if (s.status === 'completed' || s.status === 'cancelled') return true
  return Boolean(s.check_in_at && s.check_out_at)
}

export function isShiftOpen(s) {
  if (!s || isShiftCompleted(s)) return false
  return s.status === 'open'
}

export function isShiftUpcoming(s, todayStr) {
  if (!s || isShiftCompleted(s)) return false
  if (s.status === 'cancelled' || s.status === 'open') return false
  const today = todayStr || new Date().toISOString().slice(0, 10)
  return (s.date || '') >= today
}

export function shiftBelongsToEmployee(s, userId) {
  if (!s || !userId) return false
  return s.employee_id === userId || (s.assigned_staff || []).includes(userId)
}

export function needsCoverage(s) {
  if (!s || isShiftCompleted(s) || s.status === 'cancelled') return false
  if (s.status === 'open') return true
  const required = s.required_staff || 1
  const assigned = (s.assigned_staff || []).length
  return assigned < required
}
