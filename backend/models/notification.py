"""
Notification Model - Push notifications and alerts
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON, ForeignKey, Enum, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from config.database import Base
import enum


class NotificationType(str, enum.Enum):
    SHIFT_SCHEDULED = "shift_scheduled"
    SHIFT_CHANGED = "shift_changed"
    SHIFT_CANCELLED = "shift_cancelled"
    SWAP_REQUEST = "swap_request"
    SWAP_APPROVED = "swap_approved"
    SWAP_REJECTED = "swap_rejected"
    LEAVE_REQUEST = "leave_request"
    LEAVE_APPROVED = "leave_approved"
    LEAVE_REJECTED = "leave_rejected"
    BURNOUT_ALERT = "burnout_alert"
    COVERAGE_GAP = "coverage_gap"
    CERT_EXPIRY = "cert_expiry"
    SYSTEM = "system"
    MESSAGE = "message"


class NotificationStatus(str, enum.Enum):
    UNREAD = "unread"
    READ = "read"
    ARCHIVED = "archived"


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        Index('idx_notification_user_status_created', 'user_id', 'status', 'created_at'),
        Index('idx_notification_org_user', 'org_id', 'user_id'),
    )

    id = Column(String(50), primary_key=True, index=True)
    org_id = Column(String(50), ForeignKey("organizations.id", name="fk_notification_org"), nullable=False)
    user_id = Column(String(50), ForeignKey("users.id", name="fk_notification_user"), nullable=False)
    type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    body = Column(String(1000))
    message = Column(String(1000))
    data = Column(JSON, default=dict)
    context = Column(String(255))
    status = Column(String(20), default="unread", nullable=False)
    read_at = Column(DateTime(timezone=True))
    archived_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    organization = relationship("Organization")
    user = relationship("User", back_populates="notifications")
