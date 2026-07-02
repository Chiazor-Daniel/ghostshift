"""
Shift Model - Employee scheduling
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON, ForeignKey, Enum, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from config.database import Base
import enum


class ShiftStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    OPEN = "open"
    FILLED = "filled"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class ShiftType(str, enum.Enum):
    REGULAR = "regular"
    OVERTIME = "overtime"
    DOUBLE_TIME = "double_time"
    ON_CALL = "on_call"
    VIRTUAL = "virtual"


class Shift(Base):
    __tablename__ = "shifts"
    __table_args__ = (
        Index('idx_shift_org_start_status', 'org_id', 'start_time', 'status'),
        Index('idx_shift_employee_date', 'employee_id', 'start_time'),
    )

    id = Column(String(50), primary_key=True, index=True)
    org_id = Column(String(50), ForeignKey("organizations.id", name="fk_shift_org"), nullable=False)
    department_id = Column(String(50), ForeignKey("departments.id", name="fk_shift_dept"))
    employee_id = Column(String(50), ForeignKey("users.id", name="fk_shift_employee"))
    manager_id = Column(String(50), ForeignKey("users.id", name="fk_shift_manager"))
    title = Column(String(255), nullable=False)
    description = Column(String(1000))
    department = Column(String(255))  # Free-text department name
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    duration_hours = Column(Integer, nullable=False)
    start_hour = Column(Integer)  # For compat with frontend (0-23)
    status = Column(String(20), default="scheduled", nullable=False, index=True)
    type = Column(String(20), default="regular", nullable=False)
    urgency = Column(String(20), default="medium")
    certifications = Column(JSON, default=list)
    pay_differential = Column(String(20), default="+0%")
    eligible_count = Column(Integer, default=0)
    training_credit = Column(Boolean, default=False)
    seniority_preference = Column(String(20), default="none")
    required_staff = Column(Integer, default=1)
    assigned_staff = Column(JSON, default=list)
    location = Column(String(255))
    notes = Column(String(1000))
    requirements = Column(JSON, default=dict)
    compensation = Column(JSON, default=dict)
    coverage_status = Column(String(50), default="full")
    assigned_count = Column(Integer, default=0)
    required_count = Column(Integer, default=1)
    tags = Column(JSON, default=list)
    # Check-in / check-out — recorded by the assigned employee when they start
    # and end a shift. Surfaced in analytics as actual time worked.
    check_in_at = Column(DateTime(timezone=True), nullable=True)
    check_out_at = Column(DateTime(timezone=True), nullable=True)
    check_in_notes = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    organization = relationship("Organization", back_populates="shifts")
    # NOTE: The Column below is also named "department" (free-text). To avoid a
    # conflict with the string column, the Department relationship is exposed
    # via the `department_rel` attribute.
    department_rel = relationship("Department", back_populates="shifts", foreign_keys=[department_id])
    employee = relationship("User", back_populates="shifts", foreign_keys=[employee_id])
    manager = relationship("User", back_populates="managed_shifts", foreign_keys=[manager_id])
    attendance = relationship("Attendance", back_populates="shift")
    swap_requests_as_requester = relationship("SwapRequest", back_populates="requester_shift", foreign_keys="SwapRequest.requester_shift_id")
    swap_requests_as_responder = relationship("SwapRequest", back_populates="responder_shift", foreign_keys="SwapRequest.responder_shift_id")
