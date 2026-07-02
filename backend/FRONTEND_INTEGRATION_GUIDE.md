# GhostShift Backend - Frontend Integration Guide

## 🚀 Getting Started

The GhostShift backend is now ready for frontend integration. This guide will help you get started with connecting your frontend to the backend API.

## 🌐 API Access

- **Base URL**: `http://localhost:8000`
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
- **OpenAPI Spec**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

## 🔐 Authentication Flow

### 1. User Registration
```javascript
// POST /api/auth/register
const userData = {
  email: "user@example.com",
  password: "securePassword123!",
  first_name: "John",
  last_name: "Doe",
  role: "employee", // or "manager"
  org_id: "org_12345", // if joining existing org
  department_id: "dept_12345" // optional
};

fetch('http://localhost:8000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(userData)
});
```

### 2. User Login
```javascript
// POST /api/auth/login
const loginData = {
  email: "user@example.com",
  password: "securePassword123!"
};

fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(loginData)
}).then(response => response.json())
  .then(data => {
    // Store the access_token for authenticated requests
    localStorage.setItem('access_token', data.access_token);
  });
```

### 3. Authenticated Requests
```javascript
// Include the token in the Authorization header
const token = localStorage.getItem('access_token');

fetch('http://localhost:8000/api/employees/', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## 📚 API Endpoint Categories

### 1. Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### 2. Organization Management
- `POST /api/organization/` - Create organization
- `GET /api/organization/{id}` - Get organization details
- `PUT /api/organization/{id}` - Update organization
- `POST /api/organization/departments` - Create department
- `GET /api/organization/departments` - List departments

### 3. Employee Management
- `GET /api/employees/` - List employees
- `GET /api/employees/{id}` - Get employee details
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Delete employee

### 4. Shift Management
- `GET /api/shifts/` - List shifts
- `POST /api/shifts/` - Create shift
- `GET /api/shifts/{id}` - Get shift details
- `PUT /api/shifts/{id}` - Update shift
- `DELETE /api/shifts/{id}` - Delete shift

### 5. Shift Swaps
- `GET /api/swaps/` - List swap requests
- `POST /api/swaps/` - Create swap request
- `PUT /api/swaps/{id}/approve` - Approve swap
- `PUT /api/swaps/{id}/reject` - Reject swap

### 6. Leave Requests
- `GET /api/leaves/` - List leave requests
- `POST /api/leaves/` - Create leave request
- `PUT /api/leaves/{id}/approve` - Approve leave
- `PUT /api/leaves/{id}/reject` - Reject leave

### 7. Availability
- `GET /api/availability/` - Get availability
- `POST /api/availability/` - Set availability
- `PUT /api/availability/{id}` - Update availability

### 8. Analytics
- `GET /api/analytics/burnout` - Burnout risk analysis
- `GET /api/analytics/coverage` - Shift coverage analysis
- `GET /api/analytics/staffing` - Staffing recommendations

### 9. Notifications
- `GET /api/notifications/` - List notifications
- `PUT /api/notifications/{id}/read` - Mark as read
- `DELETE /api/notifications/{id}` - Delete notification

## 🛠️ Development Tips

### 1. Explore the API
Use the interactive documentation at [http://localhost:8000/docs](http://localhost:8000/docs) to:
- See all available endpoints
- Test API calls directly in the browser
- View request/response schemas
- Get example requests and responses

### 2. Error Handling
The API returns standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Unprocessable Entity (validation errors)
- `500` - Internal Server Error

### 3. Rate Limiting
The API implements rate limiting to prevent abuse. If you receive a `429` status code, wait before making additional requests.

## 🤖 AI/ML Features

### Burnout Prediction
- Endpoint: `GET /api/analytics/burnout`
- Returns risk scores and recommendations for employees

### AI Assistant
- Endpoint: `POST /api/integrations/ai/assistant`
- Provides intelligent scheduling suggestions and answers

## 📞 Support

If you encounter any issues during integration:

1. Check the API documentation at `/docs`
2. Verify the backend is running with `GET /health`
3. Look at the backend logs for error messages
4. Ensure all required fields are provided in requests

## 🎯 Next Steps

1. **Start Simple**: Begin with authentication and organization setup
2. **Build Incrementally**: Add employee management, then shift scheduling
3. **Test Thoroughly**: Use the API documentation to test each endpoint
4. **Handle Errors**: Implement proper error handling for all API calls
5. **Secure Tokens**: Store JWT tokens securely in your frontend application

The GhostShift backend is production-ready and provides all the functionality needed for a comprehensive workforce management system. Happy coding!