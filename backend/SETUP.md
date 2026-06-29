# GhostShift Backend - Setup Guide

## Prerequisites

- Python 3.10+
- PostgreSQL 14+
- Redis 7+
- OpenAI API Key (for AI features)

## Installation

### 1. Clone and Setup

```bash
cd /home/buzz/Documents/GhostShift/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb ghostshift

# Or using psql
psql -U postgres -c "CREATE DATABASE ghostshift;"
```

### 3. Configure Environment

Copy `.env.example` to `.env` and update with your configuration:

```bash
cp .env.example .env
```

Update the following in `.env`:

```env
# Server
PORT=8000
HOST=0.0.0.0
DEBUG=False
LOG_LEVEL=INFO

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=3600
REFRESH_TOKEN_EXPIRES_IN=604800

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/ghostshift

# Redis
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@ghostshift.com

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=ghostshift-uploads

# AI/ML
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o

# HIPAA Compliance
HIPAA_ENABLED=True
ENCRYPTION_ALGORITHM=aes-256-gcm
```

### 4. Run Migrations

```bash
# Initialize Alembic
alembic init migrations

# Create initial migration
alembic revision -m "Initial migration"

# Run migrations
alembic upgrade head
```

### 5. Start Development Server

```bash
# Start FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Start WebSocket server (in separate terminal)
uvicorn websocket:app --reload --host 0.0.0.0 --port 8001
```

### 6. Access API Documentation

Once the server is running:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health Check: `http://localhost:8000/health`

## Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore rules
├── README.md              # Project documentation
├── SETUP.md               # This file
├── config/                # Configuration files
│   ├── __init__.py
│   └── database.py        # Database connection
├── models/                # SQLAlchemy models
│   ├── __init__.py
│   ├── user.py            # User model
│   ├── organization.py    # Organization model
│   ├── shift.py           # Shift model
│   ├── swap.py            # Swap request model
│   ├── leave.py           # Leave request model
│   ├── availability.py    # Availability model
│   ├── notification.py    # Notification model
│   ├── audit.py           # Audit log model
│   ├── invite.py          # Invite model
│   ├── cert_alert.py      # Certification alert model
│   ├── peak_risk.py       # Peak hour risk model
│   └── attendance.py      # Attendance model
├── routes/                # API route handlers
│   ├── __init__.py
│   ├── auth.py            # Authentication routes
│   ├── organization.py    # Organization routes
│   ├── employee.py        # Employee routes
│   ├── shift.py           # Shift routes
│   ├── swap.py            # Swap routes
│   ├── leave.py           # Leave routes
│   ├── availability.py    # Availability routes
│   ├── analytics.py       # Analytics routes
│   ├── notification.py    # Notification routes
│   ├── integration.py     # Integration routes
│   ├── audit.py           # Audit routes
│   └── invite.py          # Invite routes
├── schemas/               # Pydantic schemas
│   ├── __init__.py
│   └── auth.py            # Authentication schemas
├── ai_ml/                 # AI/ML models
│   ├── __init__.py
│   ├── burnout.py         # Burnout prediction model
│   └── assistant.py       # GPT-4o assistant
├── websocket/             # WebSocket handlers
│   ├── __init__.py
│   └── app.py             # WebSocket application
├── middleware/            # Middleware
│   ├── __init__.py
│   └── auth.py            # Authentication middleware
├── utils/                 # Utility functions
│   ├── __init__.py
│   └── email.py           # Email service
├── logs/                  # Application logs
└── models/                # Trained ML models
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user info

### Organization
- `GET /api/organization` - Get organization details
- `PUT /api/organization` - Update organization
- `GET /api/organization/departments` - List departments
- `POST /api/organization/departments` - Create department
- `GET /api/organization/leave-policies` - List leave policies

### Employees
- `GET /api/employees` - List employees
- `GET /api/employees/{id}` - Get employee details
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Delete employee

### Shifts
- `GET /api/shifts` - List shifts
- `POST /api/shifts` - Create shift
- `GET /api/shifts/{id}` - Get shift details
- `PUT /api/shifts/{id}` - Update shift
- `DELETE /api/shifts/{id}` - Delete shift
- `POST /api/shifts/{id}/attendance` - Record attendance

### Swap Requests
- `GET /api/swaps` - List swap requests
- `POST /api/swaps` - Create swap request
- `GET /api/swaps/{id}` - Get swap request details
- `PUT /api/swaps/{id}/approve` - Approve swap
- `PUT /api/swaps/{id}/reject` - Reject swap
- `DELETE /api/swaps/{id}` - Withdraw swap

### Leave Requests
- `GET /api/leaves` - List leave requests
- `POST /api/leaves` - Create leave request
- `GET /api/leaves/{id}` - Get leave request details
- `PUT /api/leaves/{id}/approve` - Approve leave
- `PUT /api/leaves/{id}/reject` - Reject leave
- `DELETE /api/leaves/{id}` - Cancel leave

### Availability
- `GET /api/availability` - Get availability
- `POST /api/availability` - Update availability
- `GET /api/availability/coverage` - Get coverage availability

### Analytics
- `GET /api/analytics/burnout` - Get burnout analytics
- `GET /api/analytics/coverage` - Get coverage analytics
- `GET /api/analytics/staffing` - Get staffing analytics
- `GET /api/analytics/reports` - Get reports

### Notifications
- `GET /api/notifications` - List notifications
- `GET /api/notifications/{id}` - Get notification details
- `PUT /api/notifications/{id}/read` - Mark as read
- `DELETE /api/notifications/{id}` - Delete notification
- `POST /api/notifications/send` - Send notification

### Integrations
- `POST /api/integrations/openai` - OpenAI GPT-4o integration
- `POST /api/integrations/slack` - Slack integration
- `POST /api/integrations/google` - Google integration

### Audit
- `GET /api/audit` - List audit logs
- `GET /api/audit/{id}` - Get audit log details
- `POST /api/audit/log` - Create audit log

### Invites
- `GET /api/invites` - List invites
- `POST /api/invites` - Create invite
- `GET /api/invites/{id}` - Get invite details
- `PUT /api/invites/{id}/revoke` - Revoke invite
- `POST /api/invites/accept` - Accept invite

## WebSocket Channels

- `shifts` - Shift updates
- `swaps` - Swap request notifications
- `burnout_alerts` - Burnout alerts
- `coverage_gaps` - Coverage gap notifications
- `presence` - Online/offline status

## Security Features

- JWT authentication with access tokens (1 hour) and refresh tokens (7 days)
- Password hashing with bcrypt
- CORS protection
- Input validation with Pydantic
- SQL injection protection with SQLAlchemy
- HIPAA compliance support

## Testing

```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_auth.py
```

## Monitoring

- Health check: `GET /health`
- API docs: `GET /docs`
- Metrics: To be implemented with Prometheus

## Deployment

### Docker

```bash
# Build image
docker build -t ghostshift-backend .

# Run container
docker run -p 8000:8000 ghostshift-backend
```

### Production

```bash
# Use gunicorn for production
gunicorn main:app --workers 4 --bind 0.0.0.0:8000
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For support, email support@ghostshift.com or join our Discord server.
