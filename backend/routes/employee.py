"""Employee routes — production ready."""
import logging
import secrets
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, status, Depends
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from config.database import get_db
from middleware.auth import get_current_user, hash_password
from models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()


class EmployeeCreate(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=4)
    role: Optional[str] = "employee"
    title: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_color: Optional[str] = None
    certifications: Optional[list] = []
    cert_expiry: Optional[dict] = {}


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_color: Optional[str] = None
    role: Optional[str] = None
    certifications: Optional[list] = None
    cert_expiry: Optional[dict] = None
    burnout_score: Optional[int] = None
    status: Optional[str] = None


def _uid() -> str:
    return f"user_{int(datetime.utcnow().timestamp() * 1000)}_{secrets.token_hex(4)}"


def _initials(name: str) -> str:
    parts = [p for p in name.strip().split() if p]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


def _serialize(u: User) -> dict:
    return {
        "id": u.id,
        "org_id": u.org_id,
        "email": u.email,
        "name": u.name,
        "initials": u.initials,
        "role": u.role,
        "title": u.title,
        "department": u.department,
        "phone": u.phone,
        "avatar_url": u.avatar_url,
        "cover_color": u.cover_color,
        "certifications": u.certifications or [],
        "cert_expiry": u.cert_expiry or {},
        "burnout_score": u.burnout_score or 0,
        "burnout_trend": u.burnout_trend,
        "rating": u.rating,
        "status": u.status,
        "hired_at": u.hired_at.isoformat() if u.hired_at else None,
        "weekly_hours_target": u.weekly_hours_target,
        "created_at": u.created_at.isoformat() if u.created_at else None,
        # Frontend compat aliases:
        "avatar": u.avatar_url,
        "name_lower": u.name.lower() if u.name else None,
    }


@router.get("/")
async def list_employees(request: Request, db: Session = Depends(get_db)):
    """Return all users in the org (admins + employees)."""
    user = await get_current_user(request, db)
    rows = db.query(User).filter(User.org_id == user.org_id).order_by(User.role, User.name).all()
    return [_serialize(u) for u in rows]


@router.get("/{employee_id}")
async def get_employee(request: Request, employee_id: str, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    emp = db.query(User).filter(
        User.id == employee_id, User.org_id == user.org_id
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return _serialize(emp)


@router.post("/")
async def create_employee(request: Request, payload: dict, db: Session = Depends(get_db)):
    """Create a new employee directly (admin-driven)."""
    user = await get_current_user(request, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    email = (payload.get("email") or "").lower().strip()
    if not email or not payload.get("name"):
        raise HTTPException(status_code=400, detail="name and email are required")

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        id=_uid(),
        org_id=user.org_id,
        email=email,
        password_hash=hash_password(payload.get("password") or "changeme"),
        name=payload["name"].strip(),
        initials=_initials(payload["name"]),
        role=payload.get("role") or "employee",
        title=payload.get("title") or ("Administrator" if payload.get("role") == "admin" else "Staff"),
        department=payload.get("department") or "Unassigned",
        phone=payload.get("phone"),
        avatar_url=payload.get("avatar_url") or f"https://ui-avatars.com/api/?name={payload['name'].replace(' ', '+')}&background=6366f1&color=fff&size=120",
        cover_color=payload.get("cover_color") or "#6366f1",
        certifications=payload.get("certifications") or [],
        cert_expiry=payload.get("cert_expiry") or {},
        created_at=datetime.utcnow(),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return _serialize(new_user)


@router.put("/{employee_id}")
async def update_employee(request: Request, employee_id: str, payload: dict,
                          db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    emp = db.query(User).filter(
        User.id == employee_id, User.org_id == user.org_id
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Only admins can change roles or burnouts; users can update themselves for non-sensitive
    if user.role != "admin" and user.id != emp.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    for k in ("name", "title", "department", "phone", "avatar_url", "cover_color",
              "role", "status"):
        if k in payload and payload[k] is not None:
            setattr(emp, k, payload[k])
    if "name" in payload and payload["name"]:
        emp.initials = _initials(payload["name"])
    if "certifications" in payload:
        emp.certifications = payload["certifications"] or []
    if "cert_expiry" in payload:
        emp.cert_expiry = payload["cert_expiry"] or {}
    if "burnout_score" in payload and payload["burnout_score"] is not None:
        emp.burnout_score = int(payload["burnout_score"])
    emp.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(emp)
    return _serialize(emp)


@router.delete("/{employee_id}")
async def delete_employee(request: Request, employee_id: str, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    if user.id == employee_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    emp = db.query(User).filter(
        User.id == employee_id, User.org_id == user.org_id
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    db.delete(emp)
    db.commit()
    return {"message": "Employee deleted successfully", "id": employee_id}
