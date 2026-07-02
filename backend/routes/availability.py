"""Availability routes — production ready."""
import logging
import secrets
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.orm import Session

from config.database import get_db
from middleware.auth import get_current_user
from models.availability import Availability

logger = logging.getLogger(__name__)
router = APIRouter()


def _serialize(a: Availability) -> dict:
    return {
        "id": a.id,
        "org_id": a.org_id,
        "employee_id": a.employee_id,
        "day_of_week": a.day_of_week,
        "start_time": a.start_time,
        "end_time": a.end_time,
        "status": a.status,
        "is_recurring": a.is_recurring,
        "notes": a.notes,
        "created_at": a.created_at.isoformat() if a.created_at else None,
        "updated_at": a.updated_at.isoformat() if a.updated_at else None,
    }


def _aid() -> str:
    return f"av_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(4)}"


@router.get("/")
async def list_availability(request: Request, employee_id: Optional[str] = None,
                            db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    q = db.query(Availability).filter(Availability.org_id == user.org_id)
    if employee_id:
        q = q.filter(Availability.employee_id == employee_id)
    elif user.role != "admin":
        # Non-admins see only their own availability
        q = q.filter(Availability.employee_id == user.id)
    rows = q.all()
    return [_serialize(a) for a in rows]


@router.post("/")
async def upsert_availability(request: Request, payload: dict, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    target_emp = payload.get("employee_id") or user.id
    # Non-admins can only set their own
    if user.role != "admin" and target_emp != user.id:
        raise HTTPException(status_code=403, detail="Cannot edit others' availability")

    existing = db.query(Availability).filter(
        Availability.org_id == user.org_id,
        Availability.employee_id == target_emp,
        Availability.day_of_week == payload.get("day_of_week", 0),
    ).first()

    if existing:
        for k in ("start_time", "end_time", "status", "is_recurring", "notes"):
            if k in payload and payload[k] is not None:
                setattr(existing, k, payload[k])
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        return _serialize(existing)

    row = Availability(
        id=_aid(),
        org_id=user.org_id,
        employee_id=target_emp,
        day_of_week=payload.get("day_of_week", 0),
        start_time=payload.get("start_time"),
        end_time=payload.get("end_time"),
        status=payload.get("status", "available"),
        is_recurring=payload.get("is_recurring", True),
        notes=payload.get("notes"),
        created_at=datetime.now(timezone.utc),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _serialize(row)


@router.put("/bulk")
async def bulk_upsert(request: Request, payload: dict, db: Session = Depends(get_db)):
    """Bulk-replace all availability entries for an employee (used by the grid UI)."""
    user = await get_current_user(request, db)
    target_emp = payload.get("employee_id") or user.id
    if user.role != "admin" and target_emp != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    db.query(Availability).filter(
        Availability.org_id == user.org_id,
        Availability.employee_id == target_emp,
    ).delete()
    db.commit()

    entries = payload.get("entries") or []
    created = []
    for e in entries:
        row = Availability(
            id=_aid(),
            org_id=user.org_id,
            employee_id=target_emp,
            day_of_week=e.get("day_of_week"),
            start_time=e.get("start_time"),
            end_time=e.get("end_time"),
            status=e.get("status", "available"),
            is_recurring=e.get("is_recurring", True),
            notes=e.get("notes"),
            created_at=datetime.now(timezone.utc),
        )
        db.add(row)
        created.append(row)
    db.commit()
    for c in created:
        db.refresh(c)
    return [_serialize(c) for c in created]


@router.delete("/{avail_id}")
async def delete_availability(request: Request, avail_id: str, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    row = db.query(Availability).filter(
        Availability.id == avail_id, Availability.org_id == user.org_id
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Availability not found")
    if user.role != "admin" and row.employee_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    db.delete(row)
    db.commit()
    return {"message": "Availability deleted", "id": avail_id}