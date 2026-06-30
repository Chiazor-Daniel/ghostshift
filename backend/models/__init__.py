"""
Models package — import all model modules so SQLAlchemy can resolve
string-based `relationship()` and `back_populates` references between
the mapped classes (which are declared as forward references in some
modules).
"""

from .organization import Organization, Department, LeavePolicy  # noqa: F401
from .user import User, UserRole, UserStatus  # noqa: F401
from .shift import Shift, ShiftStatus, ShiftType  # noqa: F401
from .swap import SwapRequest, SwapStatus  # noqa: F401
from .leave import LeaveRequest, LeaveStatus, LeaveType  # noqa: F401
from .availability import Availability, AvailabilityStatus  # noqa: F401
from .notification import Notification, NotificationType, NotificationStatus  # noqa: F401
from .conversation import ConversationTurn  # noqa: F401
from .audit import AuditLog, AuditAction  # noqa: F401
from .attendance import Attendance  # noqa: F401
from .cert_alert import CertificationAlert, CertAlertStatus  # noqa: F401
from .invite import Invite, InviteStatus  # noqa: F401
from .peak_risk import PeakHourRisk  # noqa: F401