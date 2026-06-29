"""
User Model - Employee and Admin
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from config.database import Base
import enum


class UserRole(str, enum.Enum):
    EMPLOYEE = "employee"
    ADMIN = "admin"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ON_LEAVE = "on_leave"


class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    org_id = Column(String(50), ForeignKey("organizations.id", name="fk_user_org"), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    initials = Column(String(10))
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE)
    title = Column(String(255))
    department_id = Column(String(50), ForeignKey("departments.id", name="fk_user_dept"))
    manager_id = Column(String(50), ForeignKey("users.id", name="fk_user_manager"))
    phone = Column(String(50))
    avatar_url = Column(String(500))
    cover_color = Column(String(20))
    hired_at = Column(DateTime)
    certifications = Column(JSON, default=list)
    cert_expiry = Column(JSON, default=dict)
    weekly_hours_target = Column(Integer, default=36)
    weekly_hours_this_week = Column(Integer, default=0)
    preferences = Column(JSON, default=dict)
    burnout_score = Column(Integer, default=0)
    burnout_trend = Column(String(10), default="stable")
    rating = Column(Integer, default=4)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE)
    last_active = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="users")
    department = relationship("Department", back_populates="employees")
    manager = relationship("User", remote_side=[id], foreign_keys=[manager_id])
    subordinates = relationship("User", back_populates="manager", foreign_keys=[manager_id])
    shifts = relationship("Shift", back_populates="employee", foreign_keys="Shift.employee_id")
    managed_shifts = relationship("Shift", back_populates="manager", foreign_keys="Shift.manager_id")
    swap_requests = relationship("SwapRequest", back_populates="requester", foreign_keys="SwapRequest.requester_id")
    swap_responses = relationship("SwapRequest", back_populates="responder", foreign_keys="SwapRequest.responder_id")
    leave_requests = relationship("LeaveRequest", back_populates="employee", foreign_keys="LeaveRequest.employee_id")
    approved_leaves = relationship("LeaveRequest", back_populates="approved_by_user", foreign_keys="LeaveRequest.approved_by")
    notifications = relationship("Notification", back_populates="user")
    attendance = relationship("Attendance", back_populates="employee")
    cert_alerts = relationship("CertificationAlert", back_populates="employee")
    invites = relationship("Invite", back_populates="invited_by")
    managed_departments = relationship("Department", back_populates="manager")
