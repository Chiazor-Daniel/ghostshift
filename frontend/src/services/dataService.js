// Data Service - Bridges mock data with real API
// This service provides the same interface as store.js but uses real API calls

import { api } from './api.js';

// Re-export constants from mock store
export const DEFAULT_SHIFT_HOURS = 8;
export const DEFAULT_MAX_WEEKLY = 48;
export const DEFAULT_CONSECUTIVE_MAX = 5;
export const DEFAULT_REST_GAP = 8;

// Helper functions (same as in mock store)
export function today() {
  return new Date(new Date().toISOString().slice(0, 10));
}

export function weekRange() {
  const t = today();
  const d = t.getDay();
  const start = new Date(t);
  start.setDate(t.getDate() - d);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

export function formatDate(d) {
  if (!d) return '';
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateFull(d) {
  if (!d) return '';
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  }
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function timeLabel(h) {
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

// Employee functions - now using real API
export async function getEmployees() {
  try {
    const response = await api.getEmployees();
    return response.data || response;
  } catch (error) {
    console.warn('Failed to fetch employees from API, returning empty array:', error);
    return [];
  }
}

export async function getEmployee(id) {
  try {
    const response = await api.getEmployee(id);
    return response.data || response;
  } catch (error) {
    console.warn(`Failed to fetch employee ${id} from API:`, error);
    return null;
  }
}

export async function addEmployee(emp) {
  try {
    const response = await api.createEmployee(emp);
    return response.data || response;
  } catch (error) {
    console.error('Failed to create employee:', error);
    throw error;
  }
}

export async function updateEmployee(id, patch) {
  try {
    const response = await api.updateEmployee(id, patch);
    return response.data || response;
  } catch (error) {
    console.error(`Failed to update employee ${id}:`, error);
    throw error;
  }
}

export async function getEmployeeByEmail(email) {
  try {
    const employees = await getEmployees();
    return employees.find(e => e.email?.toLowerCase() === email?.toLowerCase());
  } catch (error) {
    console.warn(`Failed to find employee by email ${email}:`, error);
    return null;
  }
}

// Shift functions - now using real API
export async function getShifts(filters = {}) {
  try {
    const response = await api.getShifts(filters);
    return response.data || response;
  } catch (error) {
    console.warn('Failed to fetch shifts from API, returning empty array:', error);
    return [];
  }
}

export async function getShift(id) {
  try {
    const response = await api.getShift(id);
    return response.data || response;
  } catch (error) {
    console.warn(`Failed to fetch shift ${id} from API:`, error);
    return null;
  }
}

export async function addShift(shift) {
  try {
    const response = await api.createShift(shift);
    return response.data || response;
  } catch (error) {
    console.error('Failed to create shift:', error);
    throw error;
  }
}

export async function updateShift(id, patch) {
  try {
    const response = await api.updateShift(id, patch);
    return response.data || response;
  } catch (error) {
    console.error(`Failed to update shift ${id}:`, error);
    throw error;
  }
}

export async function deleteShift(id) {
  try {
    const response = await api.deleteShift(id);
    return response.data || response;
  } catch (error) {
    console.error(`Failed to delete shift ${id}:`, error);
    throw error;
  }
}

export async function assignShift(shiftId, employeeId) {
  try {
    const updatedShift = await updateShift(shiftId, { employeeId, status: 'active' });
    return updatedShift;
  } catch (error) {
    console.error(`Failed to assign shift ${shiftId} to employee ${employeeId}:`, error);
    throw error;
  }
}

export async function getSlotsRemaining(shiftId) {
  try {
    const shift = await getShift(shiftId);
    if (!shift) return 0;
    const required = shift.requiredStaff || 1;
    const assigned = shift.assignedStaff?.length || (shift.employeeId ? 1 : 0);
    return Math.max(0, required - assigned);
  } catch (error) {
    console.warn(`Failed to get slots remaining for shift ${shiftId}:`, error);
    return 0;
  }
}

// Swap functions - now using real API
export async function getSwaps() {
  try {
    const response = await api.getSwaps();
    return response.data || response;
  } catch (error) {
    console.warn('Failed to fetch swaps from API, returning empty array:', error);
    return [];
  }
}

export async function getPendingSwaps() {
  try {
    const swaps = await getSwaps();
    return swaps.filter(s => s.status === 'pending');
  } catch (error) {
    console.warn('Failed to fetch pending swaps:', error);
    return [];
  }
}

export async function addSwap(swap) {
  try {
    const response = await api.createSwap(swap);
    return response.data || response;
  } catch (error) {
    console.error('Failed to create swap:', error);
    throw error;
  }
}

export async function approveSwap(swapId) {
  try {
    const response = await api.approveSwap(swapId);
    return response.data || response;
  } catch (error) {
    console.error(`Failed to approve swap ${swapId}:`, error);
    throw error;
  }
}

export async function rejectSwap(swapId) {
  try {
    const response = await api.rejectSwap(swapId);
    return response.data || response;
  } catch (error) {
    console.error(`Failed to reject swap ${swapId}:`, error);
    throw error;
  }
}

// Leave functions - now using real API
export async function getLeaveRequests() {
  try {
    const response = await api.getLeaveRequests();
    return response.data || response;
  } catch (error) {
    console.warn('Failed to fetch leave requests from API, returning empty array:', error);
    return [];
  }
}

export async function addLeaveRequest(leave) {
  try {
    const response = await api.createLeaveRequest(leave);
    return response.data || response;
  } catch (error) {
    console.error('Failed to create leave request:', error);
    throw error;
  }
}

export async function approveLeave(leaveId) {
  try {
    const response = await api.approveLeave(leaveId);
    return response.data || response;
  } catch (error) {
    console.error(`Failed to approve leave ${leaveId}:`, error);
    throw error;
  }
}

export async function rejectLeave(leaveId) {
  try {
    const response = await api.rejectLeave(leaveId);
    return response.data || response;
  } catch (error) {
    console.error(`Failed to reject leave ${leaveId}:`, error);
    throw error;
  }
}

// Availability functions - now using real API
export async function getAvailability() {
  try {
    const response = await api.getAvailability();
    return response.data || response;
  } catch (error) {
    console.warn('Failed to fetch availability from API, returning empty array:', error);
    return [];
  }
}

export async function setAvailability(availability) {
  try {
    const response = await api.setAvailability(availability);
    return response.data || response;
  } catch (error) {
    console.error('Failed to set availability:', error);
    throw error;
  }
}

// Analytics functions - now using real API
export async function getBurnoutAnalytics() {
  try {
    const response = await api.getBurnoutAnalytics();
    return response.data || response;
  } catch (error) {
    console.warn('Failed to fetch burnout analytics from API:', error);
    return { risk_score: 0, predictions: [] };
  }
}

export async function getCoverageAnalytics() {
  try {
    const response = await api.getCoverageAnalytics();
    return response.data || response;
  } catch (error) {
    console.warn('Failed to fetch coverage analytics from API:', error);
    return { coverage: 0, gaps: [] };
  }
}

// Notification functions - now using real API
export async function getNotifications() {
  try {
    const response = await api.getNotifications();
    return response.data || response;
  } catch (error) {
    console.warn('Failed to fetch notifications from API, returning empty array:', error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId) {
  try {
    const response = await api.markNotificationAsRead(notificationId);
    return response.data || response;
  } catch (error) {
    console.error(`Failed to mark notification ${notificationId} as read:`, error);
    throw error;
  }
}

export async function deleteNotification(notificationId) {
  try {
    const response = await api.deleteNotification(notificationId);
    return response.data || response;
  } catch (error) {
    console.error(`Failed to delete notification ${notificationId}:`, error);
    throw error;
  }
}

// Authentication functions
export async function login(credentials) {
  try {
    const response = await api.login(credentials);
    return response;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

export async function register(userData) {
  try {
    const response = await api.register(userData);
    return response;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
}

export async function logout() {
  try {
    await api.logout();
  } catch (error) {
    console.warn('Logout request failed:', error);
  }
}