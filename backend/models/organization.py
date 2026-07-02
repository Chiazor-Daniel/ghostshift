"""
Organization Model
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from config.database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True)
    logo_url = Column(String(500))
    cover_url = Column(String(500))
    description = Column(String(1000))
    website = Column(String(255))
    phone = Column(String(50))
    email = Column(String(255))
    address = Column(String(500))
    city = Column(String(100))
    state = Column(String(50))
    zip_code = Column(String(20))
    country = Column(String(100), default="United States")
    timezone = Column(String(100), default="America/New_York")
    currency = Column(String(10), default="USD")
    settings = Column(JSON, default=dict)
    features = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    users = relationship("User", back_populates="organization")
    departments = relationship("Department", back_populates="organization")
    shifts = relationship("Shift", back_populates="organization")
    leave_policies = relationship("LeavePolicy", back_populates="organization")


class Department(Base):
    __tablename__ = "departments"

    id = Column(String(50), primary_key=True, index=True)
    org_id = Column(String(50), ForeignKey("organizations.id", name="fk_dept_org"), nullable=False)
    name = Column(String(255), nullable=False, index=True)
    description = Column(String(500))
    manager_id = Column(String(50), ForeignKey("users.id", name="fk_dept_manager"))
    headcount = Column(Integer, default=0)
    budget = Column(Integer, default=0)
    settings = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    organization = relationship("Organization", back_populates="departments")
    manager = relationship(
        "User",
        primaryjoin="Department.manager_id==User.id",
        foreign_keys=[manager_id],
    )
    shifts = relationship("Shift", back_populates="department_rel")


class LeavePolicy(Base):
    __tablename__ = "leave_policies"

    id = Column(String(50), primary_key=True, index=True)
    org_id = Column(String(50), ForeignKey("organizations.id", name="fk_leave_policy_org"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(String(500))
    accrual_rate = Column(Integer, default=0)  # hours per pay period
    max_accrual = Column(Integer, default=0)
    rollover_limit = Column(Integer, default=0)
    carryover_limit = Column(Integer, default=0)
    approval_required = Column(Boolean, default=True)
    min_notice_hours = Column(Integer, default=24)
    max_consecutive_days = Column(Integer, default=14)
    settings = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    organization = relationship("Organization", back_populates="leave_policies")
