"""
Attendance Model - Track shift attendance
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from config.database import Base


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(String(50), primary_key=True, index=True)
    shift_id = Column(String(50), ForeignKey("shifts.id", name="fk_attendance_shift"), nullable=False)
    employee_id = Column(String(50), ForeignKey("users.id", name="fk_attendance_employee"), nullable=False)
    clock_in = Column(DateTime)
    clock_out = Column(DateTime)
    actual_hours = Column(Integer)
    status = Column(String(50), default="scheduled")
    notes = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    shift = relationship("Shift", back_populates="attendance")
    employee = relationship("User", back_populates="attendance")
