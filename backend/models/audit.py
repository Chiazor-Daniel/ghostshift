"""
Audit Log Model - Track all system changes
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from config.database import Base
import enum


class AuditAction(str, enum.Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    APPROVE = "approve"
    REJECT = "reject"
    SWAP = "swap"
    LEAVE = "leave"
    SHIFT = "shift"
    USER = "user"
    ORGANIZATION = "organization"
    SETTINGS = "settings"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(50), primary_key=True, index=True)
    org_id = Column(String(50), ForeignKey("organizations.id", name="fk_audit_org"), nullable=False)
    user_id = Column(String(50), ForeignKey("users.id", name="fk_audit_user"), nullable=False)
    action = Column(String(50), nullable=False)
    entity_type = Column(String(100))
    entity_id = Column(String(50))
    old_values = Column(JSON, default=dict)
    new_values = Column(JSON, default=dict)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    organization = relationship("Organization")
    user = relationship("User")
