import os
import structlog
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from sqlalchemy import text

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from middleware.rate_limit import RateLimitMiddleware

from config.logging import setup_logging, get_logger

setup_logging()
logger = get_logger(__name__)

from config.database import engine, Base
import models
from routes import auth, organization, employee, shift, swap, leave, availability, analytics, notification, integration, audit, invite

try:
    from websocket.app import router as ws_router
    WEBSOCKET_ENABLED = True
except Exception:
    WEBSOCKET_ENABLED = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting GhostShift Backend...")

    import time
    for attempt in range(10):
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables created/verified")
            break
        except Exception as e:
            logger.warning(f"Database not ready (attempt {attempt + 1}/10): {e}")
            if attempt < 9:
                time.sleep(3)
    else:
        logger.error("Could not connect to database after 10 attempts")

    if os.getenv("SEED_DEMO", "true").lower() in ("1", "true", "yes"):
        try:
            import seed_demo
            seed_demo.main()
        except Exception as e:
            logger.warning(f"Demo seed skipped: {e}")

    yield

    logger.info("Shutting down GhostShift Backend...")
    engine.dispose()


app = FastAPI(
    title="GhostShift API",
    description="Workforce Scheduling Platform",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

_origins_env = os.getenv("CORS_ORIGINS")
if not _origins_env:
    raise RuntimeError("CORS_ORIGINS is not set")
origins = [o.strip() for o in _origins_env.split(",") if o.strip()]


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    from uuid import uuid4
    request_id = request.headers.get("X-Request-ID", str(uuid4()))
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(request_id=request_id)
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    RateLimitMiddleware,
    max_requests=int(os.getenv("RATE_LIMIT_MAX", "500")),
    window_seconds=int(os.getenv("RATE_LIMIT_WINDOW", "60")),
)

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
if WEBSOCKET_ENABLED:
    app.include_router(ws_router, prefix="/ws", tags=["WebSocket"])
    logger.info("WebSocket support enabled")


@app.get("/")
async def root():
    return {
        "name": "GhostShift API",
        "version": "2.0.0",
        "endpoints": {
            "auth": "/api/auth/*",
            "employees": "/api/employees/*",
            "shifts": "/api/shifts/*",
            "swaps": "/api/swaps/*",
            "leaves": "/api/leaves/*",
            "availability": "/api/availability/*",
        },
    }


@app.get("/health")
async def health_check():
    db_ok = False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass
    status_val = "healthy" if db_ok else "degraded"
    status_code = status.HTTP_200_OK if db_ok else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(
        status_code=status_code,
        content={
            "status": status_val,
            "version": "2.0.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "components": {
                "database": "up" if db_ok else "down",
                "app": "up",
            },
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("global_exception", error=str(exc), error_type=type(exc).__name__, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
