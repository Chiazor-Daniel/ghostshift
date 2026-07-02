"""Shift routes — production ready."""
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, status, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func

from config.database import get_db
from middleware.auth import get_current_user
from models.shift import Shift
from models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()


def _sid() -> str:
    return f"s_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(4)}"


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
        # Use start_hour and reconstruct date in UTC to avoid timezone drift
        "date": s.start_time.astimezone(timezone.utc).date().isoformat() if s.start_time else None,
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

        "eligible": s.eligible_count or 0,
        "training_credit": s.training_credit or False,
        "seniority_preference": s.seniority_preference or "none",
        "required_staff": s.required_staff or 1,
        "assigned_staff": s.assigned_staff or [],
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
        "check_in_at": s.check_in_at.isoformat() if s.check_in_at else None,
        "check_out_at": s.check_out_at.isoformat() if s.check_out_at else None,
        "check_in_notes": s.check_in_notes,
        # Frontend mock-shape compat:
        "eligible_count": s.eligible_count or 0,
    }


@router.get("/")
async def list_shifts(request: Request, start_date: Optional[str] = None,
                      end_date: Optional[str] = None, department_id: Optional[str] = None,
                      employee_id: Optional[str] = None, status: Optional[str] = None,
                      department: Optional[str] = None,
                      skip: int = 0, limit: int = 200,
                      db: Session = Depends(get_db)):
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
    if department:
        q = q.filter(Shift.department == department)
    if employee_id:
        q = q.filter(Shift.employee_id == employee_id)
    if status:
        q = q.filter(Shift.status == status)

    skip = max(0, skip)
    limit = max(1, min(limit, 500))

    # Department scoping: employees only see shifts for their own department
    # (and the marketplace-shared "open" pool, if it has no department).
    # Admins see everything in the org.
    if user.role != "admin":
        user_dept = (user.department or "").strip()
        q = q.filter(
            (Shift.department == None)
            | (func.lower(Shift.department) == user_dept.lower())
        )

    rows = q.order_by(Shift.start_time.asc()).offset(skip).limit(limit).all()
    serialized = [_serialize(s) for s in rows]

    total = db.query(Shift).filter(Shift.org_id == user.org_id).count()
    return {
        "items": serialized,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("/")
async def create_shift(request: Request, payload: dict, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    title = (payload.get("title") or "").strip()
    department = (payload.get("department") or "").strip()
    if not title or not department:
        raise HTTPException(status_code=400, detail="title and department are required")
    if not payload.get("date"):
        raise HTTPException(status_code=400, detail="date is required")

    try:
        # Parse date and create UTC-aware datetime to avoid timezone drift
        date_str = payload['date']
        start_hour = int(payload.get('start_hour', 9))
        # Parse the date string (format: YYYY-MM-DD)
        date_parts = date_str.split('-')
        year, month, day = int(date_parts[0]), int(date_parts[1]), int(date_parts[2])
        # Create UTC-aware datetime
        start_dt = datetime(year, month, day, start_hour, 0, 0, tzinfo=timezone.utc)
    except (ValueError, IndexError) as e:
        logger.error(f"Failed to parse date/time: {payload.get('date')} {payload.get('start_hour')} - {e}")
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
        eligible_count=int(payload.get("eligible") or 0),
        training_credit=bool(payload.get("training_credit")),
        seniority_preference=payload.get("seniority_preference") or "none",
        required_staff=int(payload.get("required_staff") or 1),
        assigned_staff=payload.get("assigned_staff") or (
            [payload["employee_id"]] if payload.get("employee_id") else []
        ),
        notes=payload.get("notes"),
        created_at=datetime.now(timezone.utc),
    )
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return _serialize(shift)


@router.get("/no-show-alerts")
async def no_show_alerts(request: Request, db: Session = Depends(get_db)):
    """
    Shifts that started > 15 minutes ago, have an assigned employee, but no one
    has checked in yet. Surfaced on the Admin overview so the admin can nudge
    or re-assign before coverage gaps become patient-impacting.

    NOTE: This route must be registered BEFORE the /{shift_id} catch-all
    below, otherwise FastAPI will treat "no-show-alerts" as a shift id.
    """
    user = await get_current_user(request, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=15)
    q = db.query(Shift).filter(
        Shift.org_id == user.org_id,
        Shift.start_time <= cutoff,
        Shift.start_time >= now - timedelta(days=2),
        Shift.check_in_at.is_(None),
        Shift.status.in_(["active", "open", "scheduled"]),
    ).order_by(Shift.start_time.asc())
    rows = q.all()
    out = []
    for s in rows:
        d = _serialize(s)
        if s.start_time:
            late_min = int((now - s.start_time).total_seconds() / 60)
            d["minutes_late"] = late_min
        out.append(d)
    return out


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
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    shift = db.query(Shift).filter(
        Shift.id == shift_id, Shift.org_id == user.org_id
    ).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    for k in ("title", "status", "type", "urgency", "location", "notes",
              "description", "department", "seniority_preference"):
        if k in payload and payload[k] is not None:
            setattr(shift, k, payload[k])

    for k in ("duration_hours", "eligible_count", "start_hour", "required_staff"):
        if k in payload and payload[k] is not None:
            setattr(shift, k, int(payload[k]))
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
            # Parse the date string and create UTC-aware datetime
            date_str = payload['date']
            date_parts = date_str.split('-')
            year, month, day = int(date_parts[0]), int(date_parts[1]), int(date_parts[2])
            start_dt = datetime(year, month, day, sh, 0, 0, tzinfo=timezone.utc)
            shift.start_time = start_dt
            shift.end_time = start_dt + timedelta(hours=shift.duration_hours or 8)
            shift.start_hour = sh
        except (ValueError, IndexError) as e:
            logger.error(f"Failed to parse date/time in update: {payload.get('date')} {payload.get('start_hour')} - {e}")
            raise HTTPException(status_code=400, detail="Invalid date")

    shift.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(shift)
    return _serialize(shift)


@router.delete("/{shift_id}")
async def delete_shift(request: Request, shift_id: str, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    shift = db.query(Shift).filter(
        Shift.id == shift_id, Shift.org_id == user.org_id
    ).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    db.delete(shift)
    db.commit()
    return {"message": "Shift deleted", "id": shift_id}


@router.post("/{shift_id}/unassign")
async def unassign_shift(request: Request, shift_id: str, payload: dict,
                         db: Session = Depends(get_db)):
    """Remove an employee from a shift. Admin only."""
    user = await get_current_user(request, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    shift = db.query(Shift).filter(
        Shift.id == shift_id, Shift.org_id == user.org_id
    ).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    employee_id = payload.get("employee_id")
    if not employee_id:
        raise HTTPException(status_code=400, detail="employee_id required")

    assigned = list(shift.assigned_staff or [])
    if employee_id in assigned:
        assigned.remove(employee_id)
    shift.assigned_staff = assigned

    if shift.employee_id == employee_id:
        shift.employee_id = assigned[0] if assigned else None

    if not assigned:
        if shift.status not in ("cancelled", "completed"):
            shift.status = "open"
    else:
        if len(assigned) < (shift.required_staff or 1) and shift.status == "active":
            shift.status = "open"

    shift.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(shift)
    return _serialize(shift)


@router.post("/{shift_id}/assign")
async def assign_shift(request: Request, shift_id: str, payload: dict,
                       db: Session = Depends(get_db)):
    """Assign an employee to a shift. Employees can self-assign to open shifts."""
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
    shift.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(shift)
    return _serialize(shift)


@router.post("/{shift_id}/check-in")
async def check_in(request: Request, shift_id: str, payload: dict = None,
                   db: Session = Depends(get_db)):
    """Employee records the start of a shift they are working."""
    user = await get_current_user(request, db)
    payload = payload or {}
    shift = db.query(Shift).filter(
        Shift.id == shift_id, Shift.org_id == user.org_id
    ).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    # The employee must be assigned to the shift
    assigned = list(shift.assigned_staff or [])
    if user.id not in assigned and shift.employee_id != user.id and user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="You can only check in to shifts you are assigned to.",
        )

    if shift.check_in_at:
        raise HTTPException(
            status_code=409,
            detail=f"Already checked in at {shift.check_in_at.isoformat()}",
        )

    shift.check_in_at = datetime.now(timezone.utc)
    shift.check_in_notes = (payload.get("notes") or "")[:500] or None
    shift.status = "active"
    shift.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(shift)
    return _serialize(shift)


@router.post("/{shift_id}/check-out")
async def check_out(request: Request, shift_id: str, payload: dict = None,
                    db: Session = Depends(get_db)):
    """Employee records the end of a shift they are working."""
    user = await get_current_user(request, db)
    payload = payload or {}
    shift = db.query(Shift).filter(
        Shift.id == shift_id, Shift.org_id == user.org_id
    ).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    assigned = list(shift.assigned_staff or [])
    if user.id not in assigned and shift.employee_id != user.id and user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="You can only check out of shifts you are assigned to.",
        )

    if not shift.check_in_at:
        raise HTTPException(
            status_code=400,
            detail="You must check in before you can check out.",
        )
    if shift.check_out_at:
        raise HTTPException(
            status_code=409,
            detail=f"Already checked out at {shift.check_out_at.isoformat()}",
        )

    shift.check_out_at = datetime.now(timezone.utc)
    if payload.get("notes"):
        # Append any checkout notes to the existing field
        existing = shift.check_in_notes or ""
        shift.check_in_notes = (existing + f"\n[out] {payload['notes']}"[:500]) or None
    shift.status = "completed"
    shift.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(shift)
    return _serialize(shift)
