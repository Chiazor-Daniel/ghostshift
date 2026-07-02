# GhostShift Frontend - Migration from Mock Data to Real API

## 🎯 Migration Goals

1. **Preserve all existing functionality** while replacing mock data with real API calls
2. **Maintain backward compatibility** during the transition
3. **Provide fallback mechanisms** in case of API failures
4. **Keep the same interface** so existing components don't need major changes

## 📁 Directory Structure

```
frontend/
├── src/
│   ├── data/                 # Original mock data (preserved)
│   ├── services/             # New API services
│   │   ├── api.js           # Low-level API client
│   │   └── dataService.js   # High-level data service (replaces store.js)
│   └── ...                   # Existing components and pages
├── frontend_backup/         # Complete backup of original frontend
│   ├── mock_data/           # Original mock.js and store.js
│   └── src_with_mock/       # Complete original src directory
└── MIGRATION_GUIDE.md       # This guide
```

## 🔄 Migration Strategy

### Phase 1: Setup and Testing
- ✅ Created API service (`api.js`) - Low-level HTTP client
- ✅ Created Data service (`dataService.js`) - High-level data operations
- ✅ Preserved all mock data in `frontend_backup/`
- ✅ Maintained same function signatures as original `store.js`

### Phase 2: Gradual Replacement
Replace imports in components one by one:

**Before (using mock data):**
```javascript
import { getEmployees, getShifts, addSwap } from '../data/store.js'
```

**After (using real API):**
```javascript
import { getEmployees, getShifts, addSwap } from '../services/dataService.js'
```

### Phase 3: Fallback Implementation
The data service includes fallback mechanisms:

```javascript
export async function getEmployees() {
  try {
    const response = await api.getEmployees();
    return response.data || response;
  } catch (error) {
    console.warn('Failed to fetch employees from API, returning empty array:', error);
    return []; // Safe fallback
  }
}
```

## 🛠️ How to Migrate Components

### 1. Simple Replacement
For most components, simply change the import:

```javascript
// Before
import { getEmployees, getShifts } from '../data/store.js';

// After
import { getEmployees, getShifts } from '../services/dataService.js';
```

### 2. Handle Async Operations
Since the new service uses real API calls, functions are now async:

```javascript
// Before (synchronous)
const employees = getEmployees();

// After (asynchronous)
const employees = await getEmployees();
```

### 3. Update Component State Management
Use React hooks for async data loading:

```javascript
import { useState, useEffect } from 'react';
import { getEmployees } from '../services/dataService.js';

function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const data = await getEmployees();
        setEmployees(data);
      } catch (error) {
        console.error('Failed to load employees:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEmployees();
  }, []);

  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {employees.map(emp => (
        <div key={emp.id}>{emp.name}</div>
      ))}
    </div>
  );
}
```

## 📋 Migration Checklist

### Core Data Functions
- [ ] `getEmployees()` - Employee list
- [ ] `getEmployee(id)` - Single employee
- [ ] `addEmployee(emp)` - Create employee
- [ ] `updateEmployee(id, patch)` - Update employee
- [ ] `getEmployeeByEmail(email)` - Find employee by email

### Shift Management
- [ ] `getShifts(filters)` - Shift list with filters
- [ ] `getShift(id)` - Single shift
- [ ] `addShift(shift)` - Create shift
- [ ] `updateShift(id, patch)` - Update shift
- [ ] `deleteShift(id)` - Delete shift
- [ ] `assignShift(shiftId, employeeId)` - Assign employee to shift
- [ ] `getSlotsRemaining(shiftId)` - Available slots

### Swap Requests
- [ ] `getSwaps()` - All swap requests
- [ ] `getPendingSwaps()` - Pending requests
- [ ] `addSwap(swap)` - Create swap request
- [ ] `approveSwap(swapId)` - Approve swap
- [ ] `rejectSwap(swapId)` - Reject swap

### Leave Management
- [ ] `getLeaveRequests()` - All leave requests
- [ ] `addLeaveRequest(leave)` - Create leave request
- [ ] `approveLeave(leaveId)` - Approve leave
- [ ] `rejectLeave(leaveId)` - Reject leave

### Availability
- [ ] `getAvailability()` - Get availability settings
- [ ] `setAvailability(availability)` - Set availability

### Analytics
- [ ] `getBurnoutAnalytics()` - Burnout risk data
- [ ] `getCoverageAnalytics()` - Shift coverage data

### Notifications
- [ ] `getNotifications()` - Notification list
- [ ] `markNotificationAsRead(id)` - Mark as read
- [ ] `deleteNotification(id)` - Delete notification

### Authentication
- [ ] `login(credentials)` - User login
- [ ] `register(userData)` - User registration
- [ ] `logout()` - User logout

## 🚨 Important Considerations

### 1. Error Handling
All API calls include proper error handling with fallbacks:

```javascript
try {
  const employees = await getEmployees();
  setEmployees(employees);
} catch (error) {
  // Handle error gracefully
  setError('Failed to load employees');
  // Optionally show cached/mock data
}
```

### 2. Loading States
Components need to handle loading states since API calls are asynchronous:

```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

// Show loading indicator while fetching
{loading && <div>Loading...</div>}
{error && <div className="error">Error: {error}</div>}
```

### 3. Data Consistency
The API service maintains the same data structure as the mock data, so existing components should work without major changes.

## 🧪 Testing During Migration

### 1. Verify API Connectivity
```bash
# Test if backend is running
curl http://localhost:8000/health

# Test API endpoints
curl http://localhost:8000/api/employees/
```

### 2. Test Individual Components
- Test authentication flow
- Test employee listing
- Test shift management
- Test swap requests
- Test analytics pages

### 3. Fallback Testing
- Temporarily disable backend
- Verify components gracefully handle API failures
- Check that fallback data is displayed appropriately

## 🎉 Benefits of Migration

1. **Real-time Data** - No more localStorage limitations
2. **Multi-user Support** - Data shared across all users
3. **Persistent Storage** - Data survives browser refreshes
4. **Scalability** - Can handle large datasets
5. **Analytics** - Real burnout predictions and insights
6. **Notifications** - Real-time alerts and updates

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend has proper CORS configuration
   - Check if API is running on `http://localhost:8000`

2. **Authentication Failures**
   - Verify JWT token handling
   - Check if user is properly logged in

3. **404 Errors**
   - Verify API endpoints match backend routes
   - Check if backend services are running

4. **Network Errors**
   - Ensure backend server is accessible
   - Check firewall and network settings

### Debugging Tips

1. **Check Browser Console** for detailed error messages
2. **Use Network Tab** to inspect API requests and responses
3. **Verify Backend Health** at `http://localhost:8000/health`
4. **Test API Endpoints** directly using tools like Postman or curl

## 📞 Support

If you encounter issues during migration:

1. Check the original mock data in `frontend_backup/mock_data/`
2. Compare function signatures between `store.js` and `dataService.js`
3. Verify backend is running and accessible
4. Review the API documentation at `http://localhost:8000/docs`

The migration should be straightforward since the new data service maintains the same interface as the original store.