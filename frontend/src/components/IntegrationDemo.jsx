// Integration Demo Component
// Demonstrates how to use the new API services
import React, { useState, useEffect } from 'react';
import {
  getEmployees,
  getShifts,
  getBurnoutAnalytics,
  login,
  register
} from '../services/dataService.js';

const IntegrationDemo = () => {
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState({
    employees: false,
    shifts: false,
    analytics: false
  });
  const [error, setError] = useState(null);

  // Load employees
  const loadEmployees = async () => {
    try {
      setLoading(prev => ({ ...prev, employees: true }));
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      setError(`Failed to load employees: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, employees: false }));
    }
  };

  // Load shifts
  const loadShifts = async () => {
    try {
      setLoading(prev => ({ ...prev, shifts: true }));
      const data = await getShifts();
      setShifts(data);
    } catch (err) {
      setError(`Failed to load shifts: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, shifts: false }));
    }
  };

  // Load analytics
  const loadAnalytics = async () => {
    try {
      setLoading(prev => ({ ...prev, analytics: true }));
      const data = await getBurnoutAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(`Failed to load analytics: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, analytics: false }));
    }
  };

  // Demo authentication
  const demoLogin = async () => {
    try {
      // In a real app, you'd get these from a form
      const credentials = {
        email: 'demo@example.com',
        password: 'demo123'
      };
      const result = await login(credentials);
      console.log('Login successful:', result);
    } catch (err) {
      console.error('Login failed:', err.message);
    }
  };

  // Demo registration
  const demoRegister = async () => {
    try {
      const userData = {
        email: 'newuser@example.com',
        password: 'securepassword',
        first_name: 'New',
        last_name: 'User'
      };
      const result = await register(userData);
      console.log('Registration successful:', result);
    } catch (err) {
      console.error('Registration failed:', err.message);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadEmployees();
    loadShifts();
    loadAnalytics();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">GhostShift API Integration Demo</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Employees Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Employees</h2>
          <button
            onClick={loadEmployees}
            disabled={loading.employees}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading.employees ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {loading.employees ? (
          <p>Loading employees...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.slice(0, 6).map(emp => (
              <div key={emp.id} className="border rounded-lg p-4">
                <div className="flex items-center mb-2">
                  {emp.avatar ? (
                    <img src={emp.avatar} alt={emp.name} className="w-10 h-10 rounded-full mr-3" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
                      {emp.initials || emp.name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium">{emp.name}</h3>
                    <p className="text-sm text-gray-600">{emp.role}</p>
                  </div>
                </div>
                <div className="text-sm">
                  <p>Department: {emp.dept || emp.department}</p>
                  <p>Burnout Score: {emp.burnoutScore || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shifts Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Shifts</h2>
          <button
            onClick={loadShifts}
            disabled={loading.shifts}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading.shifts ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {loading.shifts ? (
          <p>Loading shifts...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shifts.slice(0, 5).map(shift => (
                  <tr key={shift.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {shift.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shift.date ? new Date(shift.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shift.department || shift.dept || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${shift.status === 'active' ? 'bg-green-100 text-green-800' :
                          shift.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {shift.status || 'draft'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Analytics Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Burnout Analytics</h2>
          <button
            onClick={loadAnalytics}
            disabled={loading.analytics}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading.analytics ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {loading.analytics ? (
          <p>Loading analytics...</p>
        ) : analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-medium text-red-800">High Risk</h3>
              <p className="text-2xl font-bold text-red-600">
                {analytics.high_risk || analytics.highRisk || 0}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-medium text-yellow-800">Medium Risk</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {analytics.medium_risk || analytics.mediumRisk || 0}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800">Low Risk</h3>
              <p className="text-2xl font-bold text-green-600">
                {analytics.low_risk || analytics.lowRisk || 0}
              </p>
            </div>
          </div>
        ) : (
          <p>No analytics data available</p>
        )}
      </div>

      {/* Authentication Demo */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Authentication Demo</h2>
        <div className="flex space-x-4">
          <button
            onClick={demoLogin}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Demo Login
          </button>
          <button
            onClick={demoRegister}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Demo Register
          </button>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          Check the browser console for authentication results
        </p>
      </div>
    </div>
  );
};

export default IntegrationDemo;