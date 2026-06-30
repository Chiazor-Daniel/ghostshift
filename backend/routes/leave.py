"""Leave request routes — production ready."""
import logging
import secrets
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.orm import Session

from config.database import get_db
from middleware.auth import get_current_user
from models.leave import LeaveRequest

logger = logging.getLogger(__name__)
router = APIRouter()


def _serialize(l: LeaveRequest) -> dict:
    return {
        "id": l.id,
        "org_id": l.org_id,
        "employee_id": l.employee_id,
        "employee_name": l.employee_name,
        "type": l.type,
        "start_date": l.start_date.isoformat() if l.start_date else None,
        "end_date": l.end_date.isoformat() if l.end_date else None,
        "duration_days": l.duration_days,
        "status": l.status,
        "reason": l.reason,
        "approved_by": l.approved_by,
        "approved_at": l.approved_at.isoformat() if l.approved_at else None,
        "decided_at": l.decided_at.isoformat() if l.decided_at else None,
        "rejected_at": l.rejected_at.isoformat() if l.rejected_at else None,
        "created_at": l.created_at.isoformat() if l.created_at else None,
        "updated_at": l.updated_at.isoformat() if l.updated_at else None,
    }


def _lid() -> str:
    return f"lv_{int(datetime.utcnow().timestamp() * 1000)}_{secrets.token_hex(4)}"


@router.get("/")
async def list_leaves(request: Request, status_filter: Optional[str] = None,
                     mine_only: bool = False, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    q = db.query(LeaveRequest).filter(LeaveRequest.org_id == user.org_id)
    if status_filter:
        q = q.filter(LeaveRequest.status == status_filter)
    if mine_only:
        q = q.filter(LeaveRequest.employee_id == user.id)
    rows = q.order_by(LeaveRequest.created_at.desc()).all()
    return [_serialize(l) for l in rows]


@router.post("/")
async def create_leave(request: Request, payload: dict, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    employee_id = payload.get("employee_id") or user.id
    employee_name = payload.get("employee_name") or user.name
    leave_type = payload.get("type") or "vacation"
    start_str = payload.get("start_date")
    end_str = payload.get("end_date")
    if not start_str or not end_str:
        raise HTTPException(status_code=400, detail="start_date and end_date are required")

    try:
        if "T" in str(start_str):
            start_dt = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
        else:
            start_dt = datetime.fromisoformat(f"{start_str}T00:00:00")
        if "T" in str(end_str):
            end_dt = datetime.fromisoformat(end_str.replace("Z", "+00:00"))
        else:
            end_dt = datetime.fromisoformat(f"{end_str}T00:00:00")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    duration_days = (end_dt.date() - start_dt.date()).days + 1
    leave = LeaveRequest(
        id=_lid(),
        org_id=user.org_id,
        employee_id=employee_id,
        employee_name=employee_name,
        type=leave_type,
        start_date=start_dt,
        end_date=end_dt,
        duration_days=duration_days,
        reason=payload.get("reason"),
        status="pending",
        created_at=datetime.utcnow(),
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return _serialize(leave)


@router.get("/{leave_id}")
async def get_leave(request: Request, leave_id: str, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    leave = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id, LeaveRequest.org_id == user.org_id
    ).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    return _serialize(leave)


async def _decide(leave_id: str, decision: str, request: Request, db: Session):
    user = await get_current_user(request, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    leave = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id, LeaveRequest.org_id == user.org_id
    ).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if leave.status != "pending":
        return _serialize(leave)
    if decision == "approve":
        leave.status = "approved"
        leave.approved_by = user.id
        leave.approved_at = datetime.utcnow()
    else:
        leave.status = "rejected"
        leave.rejected_at = datetime.utcnow()
    leave.decided_at = datetime.utcnow()
    leave.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(leave)
    return _serialize(leave)


@router.put("/{leave_id}/approve")
async def approve_leave(request: Request, leave_id: str, db: Session = Depends(get_db)):
    return await _decide(leave_id, "approve", request, db)


@router.put("/{leave_id}/reject")
async def reject_leave(request: Request, leave_id: str, db: Session = Depends(get_db)):
    return await _decide(leave_id, "reject", request, db)


@router.put("/{leave_id}/decide")
async def decide_leave(request: Request, leave_id: str, payload: dict,
                       db: Session = Depends(get_db)):
    """Compatibility endpoint: frontend sends {status: "approved"|"rejected"}."""
    decision = (payload or {}).get("status", "approved")
    if decision not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="status must be 'approved' or 'rejected'")
    verb = "approve" if decision == "approved" else "reject"
    return await _decide(leave_id, verb, request, db)


@router.delete("/{leave_id}")
async def cancel_leave(request: Request, leave_id: str, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    leave = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id, LeaveRequest.org_id == user.org_id
    ).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if leave.status != "pending":
        raise HTTPException(status_code=400, detail="Can only cancel pending leaves")
    if leave.employee_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Cannot cancel someone else's leave")
    leave.status = "cancelled"
    leave.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Leave cancelled", "id": leave_id}