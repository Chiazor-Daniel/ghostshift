"""
GhostShift Backend - Main Application
Healthcare Workforce Scheduling Platform
"""

import os
import sys
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

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
    from websocket.app import router as ws_router
    WEBSOCKET_ENABLED = True
except Exception as e:
    logger.warning(f"WebSocket module not loaded: {e}")
    WEBSOCKET_ENABLED = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("Starting GhostShift Backend...")

    # Create database tables (covers fresh DBs without migration history).
    # For managed deployments, run `alembic upgrade head` as a separate deploy
    # command rather than inside the app lifespan.
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified")
        try:
            with engine.connect() as conn:
                conn.execute(__import__('sqlalchemy').text(
                    "ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS shift_plan JSONB DEFAULT '{}'"
                ))
                conn.execute(__import__('sqlalchemy').text(
                    "ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ"
                ))
                conn.commit()
        except Exception as col_err:
            logger.debug(f"Leave column migration skipped: {col_err}")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")

    # Test database connection
    try:
        with engine.connect() as conn:
            conn.execute(__import__('sqlalchemy').text("SELECT 1"))
        logger.info("Database connection successful")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")

    # Seed demo data on first boot (idempotent — no-op if already seeded)
    # Set SEED_DEMO=false to skip in production environments with real data.
    if os.getenv("SEED_DEMO", "true").lower() in ("1", "true", "yes"):
        try:
            import seed_demo
            seed_demo.main()
        except Exception as e:
            logger.warning(f"Demo seed step skipped: {e}")

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
# Use only explicitly configured origins. allow_credentials=True combined with a
# wildcard regex lets any malicious website make authenticated requests, so we
# never allow that. For local dev, set CORS_ORIGINS in your .env.
_origins_env = os.getenv("CORS_ORIGINS")
if not _origins_env:
    raise RuntimeError(
        "CORS_ORIGINS is not set. Configure it in the environment or .env file, e.g. "
        "CORS_ORIGINS=http://localhost:5173"
    )
origins = [o.strip() for o in _origins_env.split(",") if o.strip()]


@app.middleware("http")
async def cors_preflight_handler(request: Request, call_next):
    """Short-circuit OPTIONS preflight requests with explicit CORS headers."""
    if request.method == "OPTIONS":
        origin = request.headers.get("origin")
        if origin and origin in origins:
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
        return JSONResponse(status_code=400, content={"detail": "Origin not allowed"})
    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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

# Include WebSocket router
if WEBSOCKET_ENABLED:
    app.include_router(ws_router, prefix="/ws", tags=["WebSocket"])
    logger.info("WebSocket support enabled")


@app.get("/")
async def root():
    """Root endpoint."""
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
        "timestamp": datetime.now(timezone.utc).isoformat(),
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
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False, log_level="info")
