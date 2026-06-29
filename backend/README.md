# GhostShift Backend - Python FastAPI

FastAPI backend for GhostShift Healthcare Workforce Scheduling Platform

## Features

- **FastAPI** - Modern, fast web framework for Python
- **SQLAlchemy** - ORM for PostgreSQL
- **LightGBM** - ML model for burnout prediction
- **GPT-4o** - AI assistant for chat and recommendations
- **WebSocket** - Real-time communication
- **Celery** - Background task processing
- **Redis** - Caching and session management

## Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Start WebSocket server
uvicorn websocket:app --reload --host 0.0.0.0 --port 8001
```

## Project Structure

```
backend/
├── main.py                 # FastAPI app entry point
├── config/                 # Configuration
│   ├── __init__.py
│   ├── settings.py
│   └── database.py
├── models/                 # Database models
│   ├── __init__.py
│   ├── user.py
│   ├── organization.py
│   ├── shift.py
│   ├── swap.py
│   ├── leave.py
│   └── notification.py
├── schemas/                # Pydantic schemas
│   ├── __init__.py
│   ├── user.py
│   ├── shift.py
│   └── auth.py
├── routes/                 # API routes
│   ├── __init__.py
│   ├── auth.py
│   ├── organization.py
│   ├── employee.py
│   ├── shift.py
│   ├── swap.py
│   ├── leave.py
│   ├── analytics.py
│   └── notification.py
├── ai/                     # AI/ML models
│   ├── __init__.py
│   ├── burnout.py
│   ├── match_scoring.py
│   └── assistant.py
├── utils/                  # Utility functions
│   ├── __init__.py
│   ├── auth.py
│   ├── email.py
│   └── logger.py
├── database/               # Database connection
│   ├── __init__.py
│   ├── session.py
│   └── base.py
├── migrations/             # Alembic migrations
├── tests/                  # Test files
├── requirements.txt
└── .env
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Organization
- `GET /api/organization` - Get organization details
- `PUT /api/organization` - Update organization
- `GET /api/organization/departments` - Get all departments
- `POST /api/organization/departments` - Create department
- `PUT /api/organization/departments/{id}` - Update department
- `DELETE /api/organization/departments/{id}` - Delete department

### Employees
- `GET /api/employees` - Get all employees (admin only)
- `GET /api/employees/{id}` - Get employee details
- `PUT /api/employees/{id}` - Update employee
- `GET /api/employees/{id}/burnout` - Get burnout analysis
- `GET /api/employees/{id}/shifts` - Get employee shifts
- `GET /api/employees/{id}/certifications` - Get certifications
- `GET /api/employees/{id}/attendance` - Get attendance records

### Shifts
- `GET /api/shifts` - Get all shifts
- `GET /api/shifts/{id}` - Get shift details
- `POST /api/shifts` - Create shift
- `PUT /api/shifts/{id}` - Update shift
- `DELETE /api/shifts/{id}` - Delete shift
- `POST /api/shifts/{id}/assign` - Assign employee to shift
- `POST /api/shifts/{id}/publish` - Publish shift
- `GET /api/shifts/open` - Get open shifts (marketplace)

### Swap Requests
- `GET /api/swaps` - Get all swap requests
- `GET /api/swaps/{id}` - Get swap request details
- `POST /api/swaps` - Create swap request
- `PUT /api/swaps/{id}/approve` - Approve swap request
- `PUT /api/swaps/{id}/decline` - Decline swap request
- `DELETE /api/swaps/{id}` - Cancel swap request

### Leave Requests
- `GET /api/leaves` - Get all leave requests
- `GET /api/leaves/{id}` - Get leave request details
- `POST /api/leaves` - Create leave request
- `PUT /api/leaves/{id}/approve` - Approve leave request
- `PUT /api/leaves/{id}/decline` - Decline leave request

### Analytics
- `GET /api/analytics/burnout` - Get burnout analytics
- `GET /api/analytics/fairness` - Get fairness analytics
- `GET /api/analytics/absenteeism` - Get absenteeism analytics
- `GET /api/analytics/peak-hour-risks` - Get peak hour risks
- `GET /api/analytics/certification-expiry` - Get certification alerts

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/{id}/read` - Mark as read
- `PUT /api/notifications/read` - Mark all as read
- `GET /api/notifications/unread-count` - Get unread count

### Integrations
- `GET /api/integrations` - Get integrations status
- `POST /api/integrations/{key}/connect` - Connect integration
- `POST /api/integrations/{key}/sync` - Trigger sync
- `DELETE /api/integrations/{key}` - Disconnect integration

### Audit Logs
- `GET /api/audit-logs` - Get audit logs (admin only)

## Real-Time Features (WebSocket)

- Live shift updates
- Swap request notifications
- Burnout alert broadcasts
- Coverage gap alerts
- Presence indicators
- Live chat
- Shift check-in confirmations

## AI/ML Models

### Burnout Prediction (LightGBM)
- Input: 14 features (overtime, consecutive days, night shifts, etc.)
- Output: Score 0-100, trend, risk level
- Performance: 94% accuracy

### Swap Match Scoring
- Input: 10 factors (certifications, availability, fairness, etc.)
- Output: Score 0-100
- Auto-approval threshold: ≥85

### AI Assistant (GPT-4o)
- Chat with employees
- Draft swap requests
- Answer questions
- Provide recommendations

## Security

- JWT authentication
- Role-based access control (RBAC)
- Password hashing (bcrypt)
- Rate limiting
- CORS protection
- SQL injection protection
- XSS protection
- HIPAA compliant

## Deployment

```bash
# Production build
docker build -t ghostshift-backend .
docker run -p 8000:8000 ghostshift-backend

# Or use Kubernetes
kubectl apply -f k8s/
```

## Monitoring

- Prometheus metrics
- Grafana dashboards
- ELK stack for logs
- Sentry for error tracking
