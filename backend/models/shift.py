"""
Shift Model - Employee scheduling
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
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

    id = Column(String(50), primary_key=True, index=True)
    org_id = Column(String(50), ForeignKey("organizations.id", name="fk_shift_org"), nullable=False)
    department_id = Column(String(50), ForeignKey("departments.id", name="fk_shift_dept"))
    employee_id = Column(String(50), ForeignKey("users.id", name="fk_shift_employee"))
    manager_id = Column(String(50), ForeignKey("users.id", name="fk_shift_manager"))
    title = Column(String(255), nullable=False)
    description = Column(String(1000))
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    duration_hours = Column(Integer, nullable=False)
    status = Column(Enum(ShiftStatus), default=ShiftStatus.SCHEDULED)
    type = Column(Enum(ShiftType), default=ShiftType.REGULAR)
    location = Column(String(255))
    notes = Column(String(1000))
    requirements = Column(JSON, default=dict)
    compensation = Column(JSON, default=dict)
    coverage_status = Column(String(50), default="full")
    assigned_count = Column(Integer, default=0)
    required_count = Column(Integer, default=1)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="shifts")
    department = relationship("Department", back_populates="shifts")
    employee = relationship("User", back_populates="shifts", foreign_keys=[employee_id])
    manager = relationship("User", back_populates="managed_shifts", foreign_keys=[manager_id])
    attendance = relationship("Attendance", back_populates="shift")
    swap_requests_as_requester = relationship("SwapRequest", back_populates="requester_shift", foreign_keys="SwapRequest.requester_shift_id")
    swap_requests_as_responder = relationship("SwapRequest", back_populates="responder_shift", foreign_keys="SwapRequest.responder_shift_id")
