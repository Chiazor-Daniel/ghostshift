"""
GhostShift Backend - Main Application
Healthcare Workforce Scheduling Platform
"""

import os
import sys
import logging
from contextlib import asynccontextmanager
from datetime import datetime

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

# Import models to create tables (single import registers every mapped class so
# SQLAlchemy can resolve forward references like `"Shift"` used in relationship())
import models  # noqa: F401

# Import routes
from routes import auth, organization, employee, shift, swap, leave, availability, analytics, notification, integration, audit, invite

# Import WebSocket
try:
    from websocket import app as ws_app
except Exception as e:
    logger.warning(f"WebSocket module not loaded: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("Starting GhostShift Backend...")

    # Create database tables
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")

    # Test database connection
    try:
        with engine.connect() as conn:
            conn.execute(__import__('sqlalchemy').text("SELECT 1"))
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
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Configure CORS
# Note: allow_credentials=True forbids allow_origins=["*"] (Starlette drops the
# wildcard silently). Use a regex that matches anything so any demo/tunnel
# origin works without needing to update this list each time.
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")


@app.middleware("http")
async def cors_preflight_handler(request: Request, call_next):
    """Short-circuit OPTIONS preflight requests with explicit CORS headers.

    FastAPI's built-in CORSMiddleware sometimes fails to attach the response
    headers on cross-origin preflight requests routed through tunnels (e.g.
    ngrok free-tier) — the browser then blocks the actual request as
    ERR_FAILED. By handling OPTIONS explicitly we guarantee the preflight
    succeeds regardless of routing layer behaviour.
    """
    if request.method == "OPTIONS":
        origin = request.headers.get("origin", "*")
        requested_headers = request.headers.get("access-control-request-headers", "*")
        return JSONResponse(
            status_code=200,
            content={},
            headers={
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": requested_headers,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Max-Age": "600",
                "Vary": "Origin",
            },
        )
    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
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
        "version": "2.0.0",
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
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat(),
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
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error", "type": type(exc).__name__}
    )


if __name__ == "__main__":
    import uvicorn
    from datetime import datetime
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False, log_level="info")
