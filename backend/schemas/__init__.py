"""Shared Pydantic schemas for the API."""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field


class OrgCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: Optional[str] = None
    type: Optional[str] = None
    size: Optional[str] = None
    location: Optional[str] = None
    country: Optional[str] = "United States"
    timezone: Optional[str] = "America/New_York"
    currency: Optional[str] = "USD"
    description: Optional[str] = None


class OrgUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    type: Optional[str] = None
    size: Optional[str] = None
    timezone: Optional[str] = None
    default_shift_length: Optional[int] = None
    week_starts_on: Optional[str] = None
    currency: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None


class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None


class DepartmentOut(BaseModel):
    id: str
    org_id: str
    name: str
    description: Optional[str] = None
    manager_id: Optional[str] = None
    headcount: int = 0

    class Config:
        from_attributes = True


class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(..., min_length=4)
    role: str = "employee"
    title: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_color: Optional[str] = None


class EmployeeOut(BaseModel):
    id: str
    org_id: str
    email: str
    name: str
    initials: Optional[str] = None
    role: str
    title: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_color: Optional[str] = None
    burnout_score: int = 0
    status: str = "active"

    class Config:
        from_attributes = True


class ShiftCreate(BaseModel):
    title: str
    department: str
    date: str  # YYYY-MM-DD
    start_hour: int = 9
    duration_hours: int = 8
    description: Optional[str] = None
    notes: Optional[str] = None
    urgency: Optional[str] = "medium"
    eligible: Optional[int] = 0
    training_credit: Optional[bool] = False
    seniority_preference: Optional[str] = "none"
    required_staff: Optional[int] = 1
    status: Optional[str] = "open"
    employee_id: Optional[str] = None


class ShiftUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    employee_id: Optional[str] = None
    notes: Optional[str] = None


class InviteCreate(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = "employee"


class SwapCreate(BaseModel):
    from_shift_id: Optional[str] = None
    to_shift_id: Optional[str] = None
    target_employee_id: Optional[str] = None
    reason: Optional[str] = None
    requester_id: str
    requester_name: str


class LeaveCreate(BaseModel):
    employee_id: str
    employee_name: str
    type: str = "vacation"
    start_date: str
    end_date: str
    reason: Optional[str] = None


class LeaveDecision(BaseModel):
    decision: str  # "approve" or "reject"


class AvailabilityUpdate(BaseModel):
    employee_id: Optional[str] = None
    day_of_week: int = 0
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: str = "available"
    notes: Optional[str] = None
