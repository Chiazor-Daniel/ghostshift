"""
GhostShift Backend - Main Application
Healthcare Workforce Scheduling Platform
"""

import os
import sys
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.responses import PlainTextResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('logs/app.log')
    ]
)
logger = logging.getLogger(__name__)

# Import database
from config.database import engine, Base, get_db

# Import models to create tables
import models.user
import models.organization
import models.shift
import models.swap
import models.leave
import models.availability
import models.notification
import models.audit
import models.invite
import models.attendance
import models.cert_alert
import models.peak_risk

# Import routes
from routes import auth, organization, employee, shift, swap, leave, availability, analytics, notification, integration, audit, invite

# Import WebSocket
from websocket import app as ws_app


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("Starting GhostShift Backend...")
    
    # Create database tables
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
    
    # Test database connection
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        logger.info("Database connection successful")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
    
    yield
    
    logger.info("Shutting down GhostShift Backend...")
    engine.dispose()


# Create FastAPI app
app = FastAPI(
    title="GhostShift API",
    description="Healthcare Workforce Scheduling Platform - Backend API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(organization.router, prefix="/api/organization", tags=["Organization"])
app.include_router(employee.router, prefix="/api/employees", tags=["Employees"])
app.include_router(shift.router, prefix="/api/shifts", tags=["Shifts"])
app.include_router(swap.router, prefix="/api/swaps", tags=["Swap Requests"])
app.include_router(leave.router, prefix="/api/leaves", tags=["Leave Requests"])
app.include_router(availability.router, prefix="/api/availability", tags=["Availability"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(notification.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(integration.router, prefix="/api/integrations", tags=["Integrations"])
app.include_router(audit.router, prefix="/api/audit", tags=["Audit Logs"])
app.include_router(invite.router, prefix="/api/invites", tags=["Invitations"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "GhostShift API",
        "version": "1.0.0",
        "description": "Healthcare Workforce Scheduling Platform",
        "endpoints": {
            "auth": "/api/auth/*",
            "organization": "/api/organization/*",
            "employees": "/api/employees/*",
            "shifts": "/api/shifts/*",
            "swaps": "/api/swaps/*",
            "leaves": "/api/leaves/*",
            "availability": "/api/availability/*",
            "analytics": "/api/analytics/*",
            "notifications": "/api/notifications/*",
            "integrations": "/api/integrations/*",
            "audit": "/api/audit/*",
            "invites": "/api/invites/*"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": "2026-06-29T10:00:00Z",
        "uptime": 0
    }


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()}
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle global exceptions"""
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
