// Real GhostShift API client — talks to the FastAPI backend.
// Endpoints match backend route prefixes in /backend/routes/.

import { cacheGet, cacheSet, cacheInvalidate, cacheTtlForPath } from './dataCache.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

class RealAPI {
  constructor() {
    this.baseURL = API_BASE_URL
    this.token = localStorage.getItem('gs_access_token')
    this.refreshToken = localStorage.getItem('gs_refresh_token')
    this.user = this._loadUser()
  }

  _loadUser() {
    try { return JSON.parse(localStorage.getItem('gs_user') || 'null') } catch { return null }
  }

  isAuthenticated() {
    return !!this.token && !!this.user
  }

  hasRole(...roles) {
    return this.user && roles.includes(this.user.role)
  }

  setSession({ access_token, refresh_token, user }) {
    if (!user) throw new Error('setSession: missing user payload from server')
    this.token = access_token
    this.refreshToken = refresh_token
    this.user = user
    localStorage.setItem('gs_access_token', access_token)
    localStorage.setItem('gs_refresh_token', refresh_token)
    localStorage.setItem('gs_user', JSON.stringify(user))
    localStorage.setItem('gs_role', user.role || '')
    if (user.org_id != null) localStorage.setItem('gs_org_id', user.org_id)
  }

  clearSession() {
    this.token = null
    this.refreshToken = null
    this.user = null
    cacheInvalidate()
    try {
      ['gs_access_token', 'gs_refresh_token', 'gs_user', 'gs_role', 'gs_org_id']
        .forEach(k => localStorage.removeItem(k))
    } catch {
      // localStorage may be unavailable (private mode, quota, etc.) — never let this throw.
    }
  }

  async _request(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase()
    const cacheKey = `${method}:${path}`

    if (method === 'GET' && !options.skipCache) {
      const cached = cacheGet(cacheKey)
      if (cached !== undefined) return cached
    }

    const url = `${this.baseURL}${path}`
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
    if (this.token) headers.Authorization = `Bearer ${this.token}`

    let response = await fetch(url, { ...options, headers })

    // 401 with a *valid-looking* refresh token → try refresh once. A refresh
    // token that the server already rejected (or that we don't have a user
    // for) is just going to 422 again and spam the console.
    // Don't retry on auth endpoints (login, refresh) to avoid error stacking.
    const isAuthEndpoint = path.includes('/auth/login') || path.includes('/auth/refresh') || path.includes('/auth/onboard')
    const canRetry = response.status === 401
      && this.refreshToken
      && this.user
      && !options._retried
      && !isAuthEndpoint
    if (canRetry) {
      const refreshed = await this._refresh()
      if (refreshed) {
        headers.Authorization = `Bearer ${this.token}`
        response = await fetch(url, { ...options, headers, _retried: true })
      }
    }

    const contentType = response.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')
    const body = isJson ? await response.json() : await response.text()

    if (!response.ok) {
      const detail = (body && body.detail) || (typeof body === 'string' ? body : `HTTP ${response.status}`)
      const err = new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
      err.status = response.status
      err.body = body
      throw err
    }

    if (method === 'GET' && !options.skipCache) {
      cacheSet(cacheKey, body, cacheTtlForPath(path))
    } else if (method !== 'GET') {
      this._invalidateCaches(path)
    }
    return body
  }

  _invalidateCaches(path) {
    if (path.includes('/shifts')) cacheInvalidate('GET:/shifts')
    if (path.includes('/swaps')) cacheInvalidate('GET:/swaps')
    if (path.includes('/leaves')) cacheInvalidate('GET:/leaves')
    if (path.includes('/employees')) cacheInvalidate('GET:/employees')
    if (path.includes('/notifications')) cacheInvalidate('GET:/notifications')
    if (path.includes('/analytics')) cacheInvalidate('GET:/analytics')
    if (path.includes('/organization')) cacheInvalidate('GET:/organization')
    if (path.includes('/availability')) cacheInvalidate('GET:/availability')
  }

  async _refresh() {
    try {
      const res = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.refreshToken}`,
        },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      })
      if (!res.ok) return false
      const data = await res.json()
      if (data.access_token) {
        this.token = data.access_token
        localStorage.setItem('gs_access_token', data.access_token)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  // ── Auth ──────────────────────────────────────────────────────
  async onboard(payload) {
    const data = await this._request('/auth/onboard', { method: 'POST', body: JSON.stringify(payload) })
    this.setSession(data)
    return data
  }

  async login({ email, password }) {
    const data = await this._request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
    this.setSession(data)
    return data
  }

  async forgotPassword(email) {
    return this._request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })
  }

  async resetPassword(token, new_password) {
    return this._request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, new_password }) })
  }

  async getMe() {
    return this._request('/auth/me')
  }

  async changePassword(current_password, new_password) {
    return this._request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password }),
    })
  }

  async logout() {
    this.clearSession()
  }

  // ── Organization ──────────────────────────────────────────────
  async getOrganization() { return this._request('/organization/') }
  async updateOrganization(payload) { return this._request('/organization/', { method: 'PUT', body: JSON.stringify(payload) }) }
  async getDepartments() { return this._request('/organization/departments') }
  async createDepartment(payload) { return this._request('/organization/departments', { method: 'POST', body: JSON.stringify(payload) }) }
  async updateDepartment(id, payload) { return this._request(`/organization/departments/${id}`, { method: 'PUT', body: JSON.stringify(payload) }) }
  async deleteDepartment(id) { return this._request(`/organization/departments/${id}`, { method: 'DELETE' }) }

  // ── Employees ────────────────────────────────────────────────
  async getEmployees() {
    const res = await this._request('/employees/')
    return res?.items || res || []
  }
  async getEmployee(id) { return this._request(`/employees/${id}`) }
  async createEmployee(payload) { return this._request('/employees/', { method: 'POST', body: JSON.stringify(payload) }) }
  async updateEmployee(id, payload) { return this._request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(payload) }) }
  async deleteEmployee(id) { return this._request(`/employees/${id}`, { method: 'DELETE' }) }

  // ── Shifts ──────────────────────────────────────────────────
  async getShifts(params = {}) {
    const q = new URLSearchParams(params).toString()
    const res = await this._request(`/shifts/${q ? `?${q}` : ''}`)
    return res?.items || res || []
  }
  async createShift(payload) { return this._request('/shifts/', { method: 'POST', body: JSON.stringify(payload) }) }
  async updateShift(id, payload) { return this._request(`/shifts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }) }
  async deleteShift(id) { return this._request(`/shifts/${id}`, { method: 'DELETE' }) }
  async assignShift(id, employee_id) { return this._request(`/shifts/${id}/assign`, { method: 'POST', body: JSON.stringify({ employee_id }) }) }
  async unassignShift(id, employee_id) { return this._request(`/shifts/${id}/unassign`, { method: 'POST', body: JSON.stringify({ employee_id }) }) }
  async checkInShift(id, notes) { return this._request(`/shifts/${id}/check-in`, { method: 'POST', body: JSON.stringify({ notes: notes || '' }) }) }
  async checkOutShift(id, notes) { return this._request(`/shifts/${id}/check-out`, { method: 'POST', body: JSON.stringify({ notes: notes || '' }) }) }

  // ── Swaps ───────────────────────────────────────────────────
  async getSwaps(params = {}) {
    const q = new URLSearchParams(params).toString()
    const res = await this._request(`/swaps/${q ? `?${q}` : ''}`)
    return res?.items || res || []
  }
  async createSwap(payload) { return this._request('/swaps/', { method: 'POST', body: JSON.stringify(payload) }) }
  async approveSwap(id, payload = {}) { return this._request(`/swaps/${id}/approve`, { method: 'PUT', body: JSON.stringify(payload) }) }
  async rejectSwap(id, payload = {}) { return this._request(`/swaps/${id}/reject`, { method: 'PUT', body: JSON.stringify(payload) }) }
  async getSwapSuggestions(shiftId) { return this._request(`/swaps/suggest/${shiftId}`) }
  async cancelSwap(id) { return this._request(`/swaps/${id}`, { method: 'DELETE' }) }
  async autoFillShift(shiftId) { return this._request(`/swaps/auto-fill/${shiftId}`, { method: 'POST' }) }
  async getFreeSuggestions(shiftId) { return this._request(`/swaps/suggestions/${shiftId}`) }

  // ── Shifts ──────────────────────────────────────────────────
  async getNoShowAlerts() { return this._request('/shifts/no-show-alerts') }

  // ── Leaves ──────────────────────────────────────────────────
  async getLeaves(params = {}) {
    const q = new URLSearchParams(params).toString()
    const res = await this._request(`/leaves/${q ? `?${q}` : ''}`)
    return res?.items || res || []
  }
  async getLeaveActiveStatus() {
    return this._request('/leaves/active-status', { skipCache: true })
  }
  async getLeaveShiftPlan(id) { return this._request(`/leaves/${id}/shift-plan`) }
  async createLeave(payload) { return this._request('/leaves/', { method: 'POST', body: JSON.stringify(payload) }) }
  async decideLeave(id, payload) { return this._request(`/leaves/${id}/decide`, { method: 'PUT', body: JSON.stringify(payload) }) }
  async returnFromLeave(id) {
    const res = await this._request(`/leaves/${id}/return`, { method: 'POST' })
    this._invalidateCaches('/leaves')
    return res
  }
  async cancelLeave(id) { return this._request(`/leaves/${id}`, { method: 'DELETE' }) }

  // ── Availability ────────────────────────────────────────────
  async getAvailability(params = {}) {
    const q = new URLSearchParams(params).toString()
    return this._request(`/availability/${q ? `?${q}` : ''}`)
  }
  async upsertAvailability(payload) { return this._request('/availability/', { method: 'POST', body: JSON.stringify(payload) }) }
  async deleteAvailability(id) { return this._request(`/availability/${id}`, { method: 'DELETE' }) }

  // ── Analytics ───────────────────────────────────────────────
  async getBurnoutAnalytics(employee_id = null) {
    const q = employee_id ? `?employee_id=${encodeURIComponent(employee_id)}` : ''
    return this._request(`/analytics/burnout${q}`)
  }
  async getSwapReasoning(id) { return this._request(`/swaps/${id}/reasoning`) }
  async getLeaveReasoning(id) { return this._request(`/leaves/${id}/reasoning`) }
  async getBatchReasoning(payload) { return this._request('/swaps/batch-reasoning', { method: 'POST', body: JSON.stringify(payload) }) }
  async getExecutiveSummary() { return this._request('/analytics/executive-summary') }
  async getCoverageAnalytics() { return this._request('/analytics/coverage') }
  async getStaffingAnalytics() { return this._request('/analytics/staffing') }
  async getAttendanceAnalytics(employee_id = null) {
    const q = employee_id ? `?employee_id=${encodeURIComponent(employee_id)}` : ''
    return this._request(`/analytics/attendance${q}`)
  }
  async getReports(params = {}) {
    const q = new URLSearchParams(params).toString()
    return this._request(`/analytics/reports${q ? `?${q}` : ''}`)
  }

  // ── Notifications ──────────────────────────────────────────
  async getNotifications() {
    const res = await this._request('/notifications/')
    return res?.items || res || []
  }
  async markNotificationRead(id) { return this._request(`/notifications/${id}/read`, { method: 'PUT' }) }
  async markAllNotificationsRead() { return this._request('/notifications/read-all', { method: 'PUT' }) }
  async deleteNotification(id) { return this._request(`/notifications/${id}`, { method: 'DELETE' }) }
  async sendNotification(payload) { return this._request('/notifications/send', { method: 'POST', body: JSON.stringify(payload) }) }

  // ── Invites ────────────────────────────────────────────────
  async getInvites() { return this._request('/invites/') }
  async createInvite(payload) { return this._request('/invites/', { method: 'POST', body: JSON.stringify(payload) }) }
  async revokeInvite(id) { return this._request(`/invites/${id}/revoke`, { method: 'PUT' }) }
  async acceptInvite(token, password) { return this._request('/invites/accept', { method: 'POST', body: JSON.stringify({ token, password }) }) }
  async previewInvite(token) { return this._request(`/invites/preview/${token}`) }

  // ── Audit ──────────────────────────────────────────────────
  async getAudit(params = {}) {
    const q = new URLSearchParams(params).toString()
    return this._request(`/audit/${q ? `?${q}` : ''}`)
  }
  async logAudit(payload) { return this._request('/audit/log', { method: 'POST', body: JSON.stringify(payload) }) }

  // ── Integrations / AI ──────────────────────────────────────
  // Stable per-browser-tab session id so the AI can remember the conversation.
  _getChatSessionId() {
    let sid = localStorage.getItem('gs_chat_session_id')
    if (!sid) {
      // crypto.randomUUID is widely available in modern browsers + node 14.17+
      sid = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'sess-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem('gs_chat_session_id', sid)
    }
    return sid
  }
  _resetChatSessionId() {
    const sid = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'sess-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('gs_chat_session_id', sid)
    return sid
  }
  async aiChat(message, context = {}) {
    const session_id = context.session_id || this._getChatSessionId()
    return this._request('/integrations/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, session_id, context: { ...context, session_id: undefined } }),
    }).then(r => { if (r && r.session_id) localStorage.setItem('gs_chat_session_id', r.session_id); return r })
  }
  async aiHistory(sessionId, limit = 50) {
    const q = new URLSearchParams({ session_id: sessionId, limit: String(limit) }).toString()
    return this._request(`/integrations/ai/history?${q}`)
  }
  async aiSessions() { return this._request('/integrations/ai/sessions') }
  async aiClearSession(sessionId) {
    return this._request(`/integrations/ai/sessions/${sessionId}`, { method: 'DELETE' })
  }
  newChatSession() { return this._resetChatSessionId() }
  async shiftRecommendations(payload) { return this._request('/integrations/ai/shift-recommendations', { method: 'POST', body: JSON.stringify(payload) }) }
  async burnoutAnalysis(payload) { return this._request('/integrations/ai/burnout-analysis', { method: 'POST', body: JSON.stringify(payload) }) }
  async scheduleOptimization(payload) { return this._request('/integrations/ai/schedule-optimization', { method: 'POST', body: JSON.stringify(payload) }) }
  async integrationsStatus() { return this._request('/integrations/status') }

}

export const realAPI = new RealAPI()
export default realAPI