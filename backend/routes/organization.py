"""Organization routes."""
import logging
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request, status, Depends
from sqlalchemy.orm import Session
from typing import Optional

from config.database import get_db
from middleware.auth import get_current_user
from models.organization import Organization, Department, LeavePolicy

logger = logging.getLogger(__name__)
router = APIRouter()


def _oid() -> str:
    return f"dept_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(4)}"


@router.get("/")
async def get_organization(request: Request, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    org = db.query(Organization).filter(Organization.id == user.org_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return _serialize_org(org)


@router.put("/")
async def update_organization(request: Request, payload: dict, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    org = db.query(Organization).filter(Organization.id == user.org_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    for key in ("name", "country", "timezone", "currency",
                "description", "address", "city", "state", "zip_code"):
        if key in payload and payload[key] is not None:
            setattr(org, key, payload[key])

    # settings-style fields stored together
    settings = dict(org.settings or {})
    for sk in ("display_name", "type", "size", "default_shift_length",
              "week_starts_on", "location", "departments"):
        if sk in payload and payload[sk] is not None:
            settings[sk] = payload[sk]
    if payload:
        org.settings = settings

    org.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(org)
    return _serialize_org(org)


def _serialize_org(o: Organization) -> dict:
    base = {
        "id": o.id,
        "name": o.name,
        "slug": o.slug,
        "display_name": (o.settings or {}).get("display_name") or o.name,
        "description": o.description,
        "country": o.country,
        "timezone": o.timezone,
        "currency": o.currency,
        "address": o.address,
        "city": o.city,
        "state": o.state,
        "zip_code": o.zip_code,
        "settings": o.settings or {},
        "is_active": o.is_active,
        "created_at": o.created_at.isoformat() if o.created_at else None,
        "updated_at": o.updated_at.isoformat() if o.updated_at else None,
    }
    base.setdefault("displayName", base["display_name"])
    base.setdefault("defaultShiftLength", (o.settings or {}).get("default_shift_length", 8))
    base.setdefault("weekStartsOn", (o.settings or {}).get("week_starts_on", "monday"))
    return base


@router.get("/departments")
async def list_departments(request: Request, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    depts = db.query(Department).filter(Department.org_id == user.org_id).all()
    return [_serialize_dept(d) for d in depts]


@router.post("/departments")
async def create_department(request: Request, payload: dict, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Department name required")
    existing = db.query(Department).filter(
        Department.org_id == user.org_id, Department.name == name
    ).first()
    if existing:
        return _serialize_dept(existing)
    dept = Department(
        id=_oid(),
        org_id=user.org_id,
        name=name,
        description=payload.get("description"),
        manager_id=payload.get("manager_id"),
        created_at=datetime.now(timezone.utc),
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return _serialize_dept(dept)


@router.put("/departments/{dept_id}")
async def update_department(request: Request, dept_id: str, payload: dict,
                             db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    dept = db.query(Department).filter(
        Department.id == dept_id, Department.org_id == user.org_id
    ).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    for k in ("name", "description", "manager_id", "headcount", "budget"):
        if k in payload and payload[k] is not None:
            setattr(dept, k, payload[k])
    dept.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(dept)
    return _serialize_dept(dept)


@router.delete("/departments/{dept_id}")
async def delete_department(request: Request, dept_id: str, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    dept = db.query(Department).filter(
        Department.id == dept_id, Department.org_id == user.org_id
    ).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
    return {"message": "Department deleted", "id": dept_id}


def _serialize_dept(d: Department) -> dict:
    return {
        "id": d.id,
        "org_id": d.org_id,
        "name": d.name,
        "description": d.description,
        "manager_id": d.manager_id,
        "headcount": d.headcount or 0,
        "budget": d.budget or 0,
        "created_at": d.created_at.isoformat() if d.created_at else None,
    }


@router.get("/leave-policies")
async def list_leave_policies(request: Request, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    policies = db.query(LeavePolicy).filter(LeavePolicy.org_id == user.org_id).all()
    return [_serialize_lp(p) for p in policies]


def _serialize_lp(p: LeavePolicy) -> dict:
    return {
        "id": p.id,
        "org_id": p.org_id,
        "name": p.name,
        "description": p.description,
        "accrual_rate": p.accrual_rate,
        "max_accrual": p.max_accrual,
        "approval_required": p.approval_required,
    }
