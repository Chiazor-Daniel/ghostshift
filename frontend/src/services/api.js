// API Service for GhostShift Backend
// This service connects to the real backend API instead of localStorage

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

class GhostShiftAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('access_token');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    localStorage.removeItem('access_token');
  }

  // Make API request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authentication header if token exists
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);

      // Handle authentication errors
      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/login';
        throw new Error('Authentication required');
      }

      // Handle successful responses
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        }
        return response;
      }

      // Handle error responses
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }

      throw new Error(errorData.message || `API Error: ${response.status}`);
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Authentication endpoints
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.access_token) {
      this.setToken(response.access_token);
    }

    return response;
  }

  async refreshToken() {
    return this.request('/auth/refresh', {
      method: 'POST',
    });
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.warn('Logout request failed:', error);
    }
    this.clearToken();
  }

  // Organization endpoints
  async createOrganization(orgData) {
    return this.request('/organization/', {
      method: 'POST',
      body: JSON.stringify(orgData),
    });
  }

  async getOrganization(orgId) {
    return this.request(`/organization/${orgId}`, {
      method: 'GET',
    });
  }

  async updateOrganization(orgId, orgData) {
    return this.request(`/organization/${orgId}`, {
      method: 'PUT',
      body: JSON.stringify(orgData),
    });
  }

  async createDepartment(deptData) {
    return this.request('/organization/departments', {
      method: 'POST',
      body: JSON.stringify(deptData),
    });
  }

  async getDepartments() {
    return this.request('/organization/departments', {
      method: 'GET',
    });
  }

  // Employee endpoints
  async getEmployees() {
    return this.request('/employees/', {
      method: 'GET',
    });
  }

  async getEmployee(employeeId) {
    return this.request(`/employees/${employeeId}`, {
      method: 'GET',
    });
  }

  async updateEmployee(employeeId, employeeData) {
    return this.request(`/employees/${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    });
  }

  // Shift endpoints
  async getShifts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `/shifts/${queryString ? `?${queryString}` : ''}`;
    return this.request(url, {
      method: 'GET',
    });
  }

  async createShift(shiftData) {
    return this.request('/shifts/', {
      method: 'POST',
      body: JSON.stringify(shiftData),
    });
  }

  async getShift(shiftId) {
    return this.request(`/shifts/${shiftId}`, {
      method: 'GET',
    });
  }

  async updateShift(shiftId, shiftData) {
    return this.request(`/shifts/${shiftId}`, {
      method: 'PUT',
      body: JSON.stringify(shiftData),
    });
  }

  async deleteShift(shiftId) {
    return this.request(`/shifts/${shiftId}`, {
      method: 'DELETE',
    });
  }

  // Swap endpoints
  async getSwaps() {
    return this.request('/swaps/', {
      method: 'GET',
    });
  }

  async createSwap(swapData) {
    return this.request('/swaps/', {
      method: 'POST',
      body: JSON.stringify(swapData),
    });
  }

  async approveSwap(swapId) {
    return this.request(`/swaps/${swapId}/approve`, {
      method: 'PUT',
    });
  }

  async rejectSwap(swapId) {
    return this.request(`/swaps/${swapId}/reject`, {
      method: 'PUT',
    });
  }

  // Leave endpoints
  async getLeaveRequests() {
    return this.request('/leaves/', {
      method: 'GET',
    });
  }

  async createLeaveRequest(leaveData) {
    return this.request('/leaves/', {
      method: 'POST',
      body: JSON.stringify(leaveData),
    });
  }

  async approveLeave(leaveId) {
    return this.request(`/leaves/${leaveId}/approve`, {
      method: 'PUT',
    });
  }

  async rejectLeave(leaveId) {
    return this.request(`/leaves/${leaveId}/reject`, {
      method: 'PUT',
    });
  }

  // Availability endpoints
  async getAvailability() {
    return this.request('/availability/', {
      method: 'GET',
    });
  }

  async setAvailability(availabilityData) {
    return this.request('/availability/', {
      method: 'POST',
      body: JSON.stringify(availabilityData),
    });
  }

  // Analytics endpoints
  async getBurnoutAnalytics() {
    return this.request('/analytics/burnout', {
      method: 'GET',
    });
  }

  async getCoverageAnalytics() {
    return this.request('/analytics/coverage', {
      method: 'GET',
    });
  }

  async getStaffingAnalytics() {
    return this.request('/analytics/staffing', {
      method: 'GET',
    });
  }

  // Notifications endpoints
  async getNotifications() {
    return this.request('/notifications/', {
      method: 'GET',
    });
  }

  async markNotificationAsRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async deleteNotification(notificationId) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const api = new GhostShiftAPI();

// Export class for testing or multiple instances
export default GhostShiftAPI;