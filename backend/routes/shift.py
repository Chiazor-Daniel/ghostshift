"""Shift routes — production ready."""
import logging
import secrets
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, status, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from config.database import get_db
from middleware.auth import get_current_user
from models.shift import Shift
from models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()


def _sid() -> str:
    return f"s_{int(datetime.utcnow().timestamp() * 1000)}_{secrets.token_hex(4)}"


def _serialize(s: Shift) -> dict:
    return {
        "id": s.id,
        "org_id": s.org_id,
        "department_id": s.department_id,
        "employee_id": s.employee_id,
        "manager_id": s.manager_id,
        "title": s.title,
        "description": s.description,
        "department": s.department,
        "date": s.start_time.date().isoformat() if s.start_time else None,
        "start_time": s.start_time.isoformat() if s.start_time else None,
        "end_time": s.end_time.isoformat() if s.end_time else None,
        "start_hour": s.start_hour if s.start_hour is not None else (
            s.start_time.hour if s.start_time else None
        ),
        "duration_hours": s.duration_hours,
        "status": s.status,
        "type": s.type,
        "urgency": s.urgency,
        "location": s.location,
        "notes": s.notes or "",
        "certifications": s.certifications or [],
        "pay_differential": s.pay_differential or "+0%",
        "eligible": s.eligible_count or 0,
        "training_credit": s.training_credit or False,
        "seniority_preference": s.seniority_preference or "none",
        "required_staff": s.required_staff or 1,
        "assigned_staff": s.assigned_staff or [],
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
        # Frontend mock-shape compat:
        "eligible_count": s.eligible_count or 0,
    }


@router.get("/")
async def list_shifts(request: Request, start_date: Optional[str] = None,
                      end_date: Optional[str] = None, department_id: Optional[str] = None,
                      employee_id: Optional[str] = None, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    q = db.query(Shift).filter(Shift.org_id == user.org_id)
    if start_date:
        try:
            sd = datetime.fromisoformat(start_date)
            q = q.filter(Shift.start_time >= sd)
        except ValueError:
            pass
    if end_date:
        try:
            ed = datetime.fromisoformat(end_date)
            q = q.filter(Shift.end_time <= ed)
        except ValueError:
            pass
    if department_id:
        q = q.filter(Shift.department_id == department_id)
    if employee_id:
        q = q.filter(Shift.employee_id == employee_id)

    rows = q.order_by(Shift.start_time.asc()).all()
    return [_serialize(s) for s in rows]


@router.post("/")
async def create_shift(request: Request, payload: dict, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    title = (payload.get("title") or "").strip()
    department = (payload.get("department") or "").strip()
    if not title or not department:
        raise HTTPException(status_code=400, detail="title and department are required")
    if not payload.get("date"):
        raise HTTPException(status_code=400, detail="date is required")

    try:
        start_dt = datetime.fromisoformat(f"{payload['date']}T{payload.get('start_hour', 9):02d}:00:00")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date or start_hour")

    duration = int(payload.get("duration_hours") or 8)
    end_dt = start_dt + timedelta(hours=duration)

    shift = Shift(
        id=_sid(),
        org_id=user.org_id,
        # Treat empty-string department_id as None — empty string would fail the
        # FK constraint to departments.id.
        department_id=payload.get("department_id") or None,
        employee_id=payload.get("employee_id"),
        manager_id=payload.get("manager_id") or user.id,
        title=title,
        description=payload.get("description") or payload.get("notes"),
        department=department,
        start_time=start_dt,
        end_time=end_dt,
        start_hour=int(payload.get("start_hour", 9)),
        duration_hours=duration,
        status=payload.get("status") or "open",
        type=payload.get("type") or "regular",
        urgency=payload.get("urgency") or "medium",
        certifications=payload.get("certifications") or [],
        pay_differential=payload.get("pay_differential") or "+0%",
        eligible_count=int(payload.get("eligible") or 0),
        training_credit=bool(payload.get("training_credit")),
        seniority_preference=payload.get("seniority_preference") or "none",
        required_staff=int(payload.get("required_staff") or 1),
        assigned_staff=payload.get("assigned_staff") or (
            [payload["employee_id"]] if payload.get("employee_id") else []
        ),
        notes=payload.get("notes"),
        created_at=datetime.utcnow(),
    )
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return _serialize(shift)


@router.get("/{shift_id}")
async def get_shift(request: Request, shift_id: str, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    shift = db.query(Shift).filter(
        Shift.id == shift_id, Shift.org_id == user.org_id
    ).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    return _serialize(shift)


@router.put("/{shift_id}")
async def update_shift(request: Request, shift_id: str, payload: dict,
                       db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    shift = db.query(Shift).filter(
        Shift.id == shift_id, Shift.org_id == user.org_id
    ).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    for k in ("title", "status", "type", "urgency", "location", "notes",
              "description", "department", "pay_differential", "seniority_preference"):
        if k in payload and payload[k] is not None:
            setattr(shift, k, payload[k])

    for k in ("duration_hours", "eligible_count", "start_hour", "required_staff"):
        if k in payload and payload[k] is not None:
            setattr(shift, k, int(payload[k]))

    if "certifications" in payload:
        shift.certifications = payload["certifications"] or []
    if "training_credit" in payload:
        shift.training_credit = bool(payload["training_credit"])
    if "assigned_staff" in payload:
        shift.assigned_staff = payload["assigned_staff"] or []

    if "employee_id" in payload:
        new_emp = payload.get("employee_id")
        shift.employee_id = new_emp
        if new_emp:
            assigned = list(shift.assigned_staff or [])
            if new_emp not in assigned:
                assigned.append(new_emp)
            shift.assigned_staff = assigned
            # Auto-flip status if required_staff now reached
            if len(assigned) >= (shift.required_staff or 1) and shift.status in ("open", "draft"):
                shift.status = "active"

    if "date" in payload and payload["date"]:
        try:
            sh = int(payload.get("start_hour", shift.start_hour or 9))
            start_dt = datetime.fromisoformat(f"{payload['date']}T{sh:02d}:00:00")
            shift.start_time = start_dt
            shift.end_time = start_dt + timedelta(hours=shift.duration_hours or 8)
            shift.start_hour = sh
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date")

    shift.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(shift)
    return _serialize(shift)


@router.delete("/{shift_id}")
async def delete_shift(request: Request, shift_id: str, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    shift = db.query(Shift).filter(
        Shift.id == shift_id, Shift.org_id == user.org_id
    ).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    db.delete(shift)
    db.commit()
    return {"message": "Shift deleted", "id": shift_id}


@router.post("/{shift_id}/assign")
async def assign_shift(request: Request, shift_id: str, payload: dict,
                       db: Session = Depends(get_db)):
    """Convenience: assign an employee to an open shift."""
    user = await get_current_user(request, db)
    shift = db.query(Shift).filter(
        Shift.id == shift_id, Shift.org_id == user.org_id
    ).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    employee_id = payload.get("employee_id")
    if not employee_id:
        raise HTTPException(status_code=400, detail="employee_id required")
    emp = db.query(User).filter(
        User.id == employee_id, User.org_id == user.org_id
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    shift.employee_id = employee_id
    assigned = list(shift.assigned_staff or [])
    if employee_id not in assigned:
        assigned.append(employee_id)
    shift.assigned_staff = assigned
    if len(assigned) >= (shift.required_staff or 1):
        shift.status = "active"
    shift.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(shift)
    return _serialize(shift)
