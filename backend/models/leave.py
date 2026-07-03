"""
Leave Request Model - PTO, sick leave, etc.
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON, ForeignKey, Enum, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from config.database import Base
import enum


class LeaveStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class LeaveType(str, enum.Enum):
    VACATION = "vacation"
    SICK = "sick"
    PERSONAL = "personal"
    BEREAVEMENT = "bereavement"
    JURY_DUTY = "jury_duty"
    MILITARY = "military"
    UNPAID = "unpaid"


class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    __table_args__ = (
        Index('idx_leave_employee_status', 'employee_id', 'status'),
        Index('idx_leave_org_status', 'org_id', 'status'),
    )

    id = Column(String(50), primary_key=True, index=True)
    org_id = Column(String(50), ForeignKey("organizations.id", name="fk_leave_org"), nullable=False)
    employee_id = Column(String(50), ForeignKey("users.id", name="fk_leave_employee"), nullable=False)
    type = Column(String(30), nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    duration_days = Column(Integer, nullable=False)
    status = Column(String(20), default="pending", nullable=False, index=True)
    reason = Column(String(1000))
    approved_by = Column(String(50), ForeignKey("users.id", name="fk_leave_approver"))
    decided_at = Column(DateTime(timezone=True))
    employee_name = Column(String(255))
    approved_at = Column(DateTime(timezone=True))
    rejected_at = Column(DateTime(timezone=True))
    shift_plan = Column(JSON, default=dict)
    returned_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    organization = relationship("Organization")
    employee = relationship("User", back_populates="leave_requests", foreign_keys=[employee_id])
    approved_by_user = relationship("User", back_populates="approved_leaves", foreign_keys=[approved_by])
