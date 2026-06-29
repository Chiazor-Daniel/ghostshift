# GhostShift Frontend Integration Documentation

## 🎯 Overview

This documentation guides frontend developers through integrating the GhostShift React frontend with the real backend API. The integration replaces the existing localStorage-based mock data system with real API calls while maintaining backward compatibility.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   ├── pages/               # Page components
│   ├── data/                # Original mock data (preserved)
│   ├── services/            # New API integration services
│   │   ├── api.js          # Low-level API client
│   │   ├── dataService.js  # High-level data service
│   │   └── testAPI.js      # API connectivity testing
│   ├── layout/             # Layout components
│   └── ...                 # Other frontend files
├── frontend_backup/        # Complete backup of original frontend
└── MIGRATION_GUIDE.md      # Detailed migration instructions
```

## 🚀 Getting Started

### 1. Verify Backend Connectivity

First, ensure the GhostShift backend is running:

```bash
# In the backend directory
cd /path/to/ghostshift/backend
source venv/bin/activate
uvicorn main:app --reload
```

Test connectivity:
```bash
# Health check
curl http://localhost:8000/health

# API documentation
curl http://localhost:8000/docs
```

### 2. Test API Integration

Use the provided test component to verify connectivity:

```javascript
import APITestComponent from './components/APITestComponent.jsx';

function App() {
  return (
    <div>
      <APITestComponent />
      {/* Rest of your app */}
    </div>
  );
}
```

## 📡 API Services

### Low-Level API Client (`api.js`)

The `api.js` file provides a low-level HTTP client for direct API calls:

```javascript
import { api } from './services/api.js';

// Direct API calls
const employees = await api.getEmployees();
const newEmployee = await api.createEmployee(employeeData);
const updatedShift = await api.updateShift(shiftId, shiftData);
```

### High-Level Data Service (`dataService.js`)

The `dataService.js` provides the same interface as the original `store.js` but with real API calls:

```javascript
import { getEmployees, getShifts, addSwap } from './services/dataService.js';

// Same function signatures as original store.js
const employees = await getEmployees();
const shifts = await getShifts({ department: 'ICU' });
const newSwap = await addSwap(swapData);
```

## 🔧 Migration Process

### 1. Simple Import Replacement

Replace mock data imports with real API imports:

```javascript
// Before (mock data)
import { getEmployees, getShifts } from '../data/store.js';

// After (real API)
import { getEmployees, getShifts } from '../services/dataService.js';
```

### 2. Handle Async Operations

Since API calls are asynchronous, update component logic:

```javascript
// Before (synchronous)
const employees = getEmployees();

// After (asynchronous)
const employees = await getEmployees();

// Or using useEffect in React components
useEffect(() => {
  async function loadEmployees() {
    const data = await getEmployees();
    setEmployees(data);
  }
  loadEmployees();
}, []);
```

### 3. Add Loading States

Handle loading and error states in components:

```javascript
function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadEmployees() {
      try {
        setLoading(true);
        const data = await getEmployees();
        setEmployees(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadEmployees();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {employees.map(emp => (
        <EmployeeCard key={emp.id} employee={emp} />
      ))}
    </div>
  );
}
```

## 📋 Available API Functions

### Authentication
```javascript
import { login, register, logout } from './services/dataService.js';

// User login
const authResult = await login({ email, password });

// User registration
const registerResult = await register(userData);

// User logout
await logout();
```

### Employees
```javascript
import { 
  getEmployees, 
  getEmployee, 
  addEmployee, 
  updateEmployee, 
  getEmployeeByEmail 
} from './services/dataService.js';

// Get all employees
const employees = await getEmployees();

// Get single employee
const employee = await getEmployee('emp_123');

// Create employee
const newEmployee = await addEmployee(employeeData);

// Update employee
const updatedEmployee = await updateEmployee('emp_123', updateData);

// Find by email
const employee = await getEmployeeByEmail('user@example.com');
```

### Shifts
```javascript
import { 
  getShifts, 
  getShift, 
  addShift, 
  updateShift, 
  deleteShift,
  assignShift,
  getSlotsRemaining
} from './services/dataService.js';

// Get shifts with filters
const shifts = await getShifts({ department: 'ICU', date: '2026-06-30' });

// Get single shift
const shift = await getShift('shift_123');

// Create shift
const newShift = await addShift(shiftData);

// Update shift
const updatedShift = await updateShift('shift_123', updateData);

// Delete shift
await deleteShift('shift_123');

// Assign employee to shift
const assignedShift = await assignShift('shift_123', 'emp_456');

// Check available slots
const slots = await getSlotsRemaining('shift_123');
```

### Swaps
```javascript
import { 
  getSwaps, 
  getPendingSwaps, 
  addSwap, 
  approveSwap, 
  rejectSwap 
} from './services/dataService.js';

// Get all swaps
const swaps = await getSwaps();

// Get pending swaps
const pendingSwaps = await getPendingSwaps();

// Create swap request
const newSwap = await addSwap(swapData);

// Approve swap
const approvedSwap = await approveSwap('swap_123');

// Reject swap
const rejectedSwap = await rejectSwap('swap_123');
```

### Analytics
```javascript
import { 
  getBurnoutAnalytics, 
  getCoverageAnalytics 
} from './services/dataService.js';

// Get burnout analytics
const burnoutData = await getBurnoutAnalytics();

// Get coverage analytics
const coverageData = await getCoverageAnalytics();
```

## 🛡️ Error Handling

All API functions include proper error handling:

```javascript
try {
  const employees = await getEmployees();
  setEmployees(employees);
} catch (error) {
  // Handle different types of errors
  if (error.message.includes('401')) {
    // Authentication error - redirect to login
    window.location.href = '/login';
  } else if (error.message.includes('404')) {
    // Not found - show user-friendly message
    setError('Data not found');
  } else {
    // Other errors - show generic message
    setError('Failed to load data. Please try again.');
  }
}
```

## 🧪 Testing

### API Connectivity Test
Use the provided test component to verify backend connectivity:

```javascript
import APITestComponent from './components/APITestComponent.jsx';

function TestPage() {
  return (
    <div>
      <h1>API Test</h1>
      <APITestComponent />
    </div>
  );
}
```

### Manual API Testing
Test endpoints directly using curl or Postman:

```bash
# Health check
curl http://localhost:8000/health

# API documentation
curl http://localhost:8000/docs

# OpenAPI specification
curl http://localhost:8000/openapi.json
```

## 🚨 Important Notes

### 1. Backward Compatibility
The new data service maintains the same function signatures as the original store, making migration straightforward.

### 2. Fallback Mechanisms
All functions include fallback mechanisms to handle API failures gracefully.

### 3. Authentication
The API service automatically handles JWT token management and includes automatic redirect on authentication errors.

### 4. Data Consistency
The API service maintains the same data structure as the mock data, so existing components work without major changes.

## 📞 Support

For issues during integration:

1. **Check the Migration Guide**: `MIGRATION_GUIDE.md`
2. **Review Original Mock Data**: `frontend_backup/mock_data/`
3. **Verify Backend Status**: `http://localhost:8000/health`
4. **Check API Documentation**: `http://localhost:8000/docs`

## 🎉 Success Metrics

After successful integration, you should see:

- ✅ Real-time data from the backend
- ✅ Multi-user support
- ✅ Persistent data storage
- ✅ Real analytics and insights
- ✅ Working authentication flow
- ✅ Functional shift management
- ✅ Operational swap requests

The GhostShift frontend is now ready for production use with real backend integration!