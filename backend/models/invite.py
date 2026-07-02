"""
Invite Model - Employee invitations
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from config.database import Base
import enum


class InviteStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"
    REVOKED = "revoked"


class Invite(Base):
    __tablename__ = "invites"

    id = Column(String(50), primary_key=True, index=True)
    org_id = Column(String(50), ForeignKey("organizations.id", name="fk_invite_org"), nullable=False)
    invited_by_id = Column(String(50), ForeignKey("users.id", name="fk_invite_inviter"), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    role = Column(String(50), nullable=False)
    department = Column(String(255))
    name = Column(String(255))
    status = Column(String(20), default="pending", nullable=False, index=True)
    token = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    accepted_at = Column(DateTime(timezone=True))
    password_hash = Column(String(255))  # pre-set when invite is auto-accepted
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    organization = relationship("Organization")
    invited_by = relationship("User", back_populates="invites")
