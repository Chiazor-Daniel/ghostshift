# Routes package
from .auth import router as auth_router
from .organization import router as organization_router
from .employee import router as employee_router
from .shift import router as shift_router
from .swap import router as swap_router
from .leave import router as leave_router
from .availability import router as availability_router
from .analytics import router as analytics_router
from .notification import router as notification_router
from .integration import router as integration_router
from .audit import router as audit_router
from .invite import router as invite_router

__all__ = [
    "auth_router",
    "organization_router", 
    "employee_router",
    "shift_router",
    "swap_router",
    "leave_router",
    "availability_router",
    "analytics_router",
    "notification_router",
    "integration_router",
    "audit_router",
    "invite_router"
]
