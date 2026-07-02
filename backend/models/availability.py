"""
Availability Model - Employee availability preferences
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from config.database import Base
import enum


class AvailabilityStatus(str, enum.Enum):
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    PREFERRED = "preferred"


class Availability(Base):
    __tablename__ = "availability"

    id = Column(String(50), primary_key=True, index=True)
    org_id = Column(String(50), ForeignKey("organizations.id", name="fk_availability_org"), nullable=False)
    employee_id = Column(String(50), ForeignKey("users.id", name="fk_availability_employee"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(String(10))  # HH:MM format
    end_time = Column(String(10))
    status = Column(Enum(AvailabilityStatus), default=AvailabilityStatus.AVAILABLE)
    is_recurring = Column(Boolean, default=True)
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    notes = Column(String(500))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    organization = relationship("Organization")
    employee = relationship("User")
