"""Leave request routes — production ready."""
import logging
import secrets
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.orm import Session

from config.database import get_db
from middleware.auth import get_current_user
from models.leave import LeaveRequest
from models.user import User
from models.shift import Shift
from models.notification import Notification
from ai_ml.assistant import ai_assistant
from routes.shift import _serialize as _serialize_shift
from utils.realtime import notify_org
from utils.leave_shifts import (
    affected_shifts,
    build_shift_plan,
    apply_shift_plan,
    active_leave_for_user,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _serialize(l: LeaveRequest) -> dict:
    plan = getattr(l, "shift_plan", None) or {}
    returned = getattr(l, "returned_at", None)
    return {
        "id": l.id,
        "org_id": l.org_id,
        "employee_id": l.employee_id,
        "employee_name": l.employee_name,
        "type": l.type,
        "start_date": l.start_date.astimezone(timezone.utc).date().isoformat() if l.start_date else None,
        "end_date": l.end_date.astimezone(timezone.utc).date().isoformat() if l.end_date else None,
        "duration_days": l.duration_days,
        "status": l.status,
        "reason": l.reason,
        "approved_by": l.approved_by,
        "approved_at": l.approved_at.isoformat() if l.approved_at else None,
        "decided_at": l.decided_at.isoformat() if l.decided_at else None,
        "rejected_at": l.rejected_at.isoformat() if l.rejected_at else None,
        "returned_at": returned.isoformat() if returned else None,
        "shift_plan": plan,
        "created_at": l.created_at.isoformat() if l.created_at else None,
        "updated_at": l.updated_at.isoformat() if l.updated_at else None,
    }


def _lid() -> str:
    return f"lv_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(4)}"


def _parse_leave_dates(start_str, end_str):
    if "T" in str(start_str):
        start_dt = datetime.fromisoformat(str(start_str).replace("Z", "+00:00"))
    else:
        y, m, d = [int(x) for x in str(start_str).split("-")]
        start_dt = datetime(y, m, d, 0, 0, 0, tzinfo=timezone.utc)
    if "T" in str(end_str):
        end_dt = datetime.fromisoformat(str(end_str).replace("Z", "+00:00"))
    else:
        y, m, d = [int(x) for x in str(end_str).split("-")]
        end_dt = datetime(y, m, d, 23, 59, 59, tzinfo=timezone.utc)
    return start_dt, end_dt


@router.get("/active-status")
async def get_active_leave_status(request: Request, db: Session = Depends(get_db)):
    """Whether the current user is on an approved active leave."""
    user = await get_current_user(request, db)
    lv = active_leave_for_user(db, user)
    if not lv:
        return {"on_leave": False, "leave": None}
    return {
        "on_leave": True,
        "leave": _serialize(lv),
    }


@router.get("/")
async def list_leaves(request: Request, status_filter: Optional[str] = None,
                     mine_only: bool = False, skip: int = 0, limit: int = 100,
                     db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    q = db.query(LeaveRequest).filter(LeaveRequest.org_id == user.org_id)
    if status_filter:
        q = q.filter(LeaveRequest.status == status_filter)
    if mine_only:
        q = q.filter(LeaveRequest.employee_id == user.id)
    skip = max(0, skip)
    limit = max(1, min(limit, 200))
    rows = q.order_by(LeaveRequest.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "items": [_serialize(l) for l in rows],
        "total": q.count(),
        "skip": skip,
        "limit": limit,
    }


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
        start_dt, end_dt = _parse_leave_dates(start_str, end_str)
    except (ValueError, IndexError) as e:
        logger.error(f"Failed to parse leave dates: {start_str} to {end_str} - {e}")
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
        created_at=datetime.now(timezone.utc),
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)

    try:
        admins = db.query(User).filter(User.org_id == user.org_id, User.role == "admin").all()
        for admin in admins:
            db.add(Notification(
                id=f"n_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(4)}",
                org_id=user.org_id,
                user_id=admin.id,
                type="leave_request",
                title="New leave request",
                body=f"{employee_name} requested {leave_type} leave ({duration_days} day{'s' if duration_days != 1 else ''}).",
                status="unread",
                created_at=datetime.now(timezone.utc),
            ))
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to create leave notification: {e}")

    notify_org(user.org_id, "leave_request", title="New leave request",
               body=f"{employee_name} requested leave", data={"leave_id": leave.id})
    return _serialize(leave)


@router.get("/{leave_id}/shift-plan")
async def get_leave_shift_plan(request: Request, leave_id: str, db: Session = Depends(get_db)):
    """AI-assisted shift redistribution plan — required before approval."""
    user = await get_current_user(request, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    leave = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id, LeaveRequest.org_id == user.org_id
    ).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if leave.status != "pending":
        raise HTTPException(status_code=400, detail="Leave is no longer pending")

    plan = build_shift_plan(db, leave)
    employees = db.query(User).filter(
        User.org_id == user.org_id,
        User.role != "admin",
        User.id != leave.employee_id,
    ).all()
    return {
        **plan,
        "leave_id": leave.id,
        "employee_name": leave.employee_name,
        "start_date": _serialize(leave)["start_date"],
        "end_date": _serialize(leave)["end_date"],
        "candidates": [{"id": e.id, "name": e.name, "department": e.department} for e in employees],
    }


@router.get("/{leave_id}")
async def get_leave(request: Request, leave_id: str, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    leave = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id, LeaveRequest.org_id == user.org_id
    ).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    return _serialize(leave)


@router.get("/{leave_id}/reasoning")
async def get_leave_reasoning(request: Request, leave_id: str, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    leave = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id, LeaveRequest.org_id == user.org_id
    ).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    requester = db.query(User).filter(User.id == leave.employee_id).first()
    shifts = db.query(Shift).filter(Shift.org_id == user.org_id).all()
    affected = affected_shifts(db, leave)

    requester_shifts = [s for s in shifts if s.employee_id == leave.employee_id or (leave.employee_id in (s.assigned_staff or []))]
    completed_shifts = [s for s in requester_shifts if s.check_in_at and s.check_out_at]
    work_history = {
        "total_assigned_shifts": len(requester_shifts),
        "total_completed_shifts": len(completed_shifts),
        "affected_during_leave": len(affected),
    }

    result = ai_assistant.explain_leave_decision(
        leave=_serialize(leave),
        requester={
            "name": requester.name if requester else "Unknown",
            "department": requester.department if requester else "Unknown",
        },
        org_shifts=[_serialize_shift(s) for s in shifts],
        work_history=work_history,
    )
    return result


async def _decide(leave_id: str, decision: str, request: Request, db: Session, payload: dict = None):
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

    payload = payload or {}

    if decision == "approve":
        affected = affected_shifts(db, leave)
        shift_actions: List[dict] = payload.get("shift_plan") or []

        if affected and not shift_actions:
            raise HTTPException(
                status_code=400,
                detail="Shift coverage plan required before approval. Load shift plan and confirm redistribution.",
            )

        if affected:
            planned_ids = {a.get("shift_id") for a in shift_actions}
            missing = [s.id for s in affected if s.id not in planned_ids]
            if missing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Shift plan must cover all {len(affected)} affected shifts",
                )
            applied = apply_shift_plan(db, leave, shift_actions)
            leave.shift_plan = {"items": shift_actions, "applied": applied}
        else:
            leave.shift_plan = {"items": [], "applied": []}

        employee = db.query(User).filter(User.id == leave.employee_id).first()
        if employee:
            employee.status = "on_leave"
            employee.updated_at = datetime.now(timezone.utc)

        leave.status = "approved"
        leave.approved_by = user.id
        leave.approved_at = datetime.now(timezone.utc)
    else:
        leave.status = "rejected"
        leave.rejected_at = datetime.now(timezone.utc)

    leave.decided_at = datetime.now(timezone.utc)
    leave.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(leave)

    try:
        status_word = "approved" if decision == "approve" else "declined"
        body = f"Your {leave.type} leave ({leave.duration_days} day{'s' if leave.duration_days != 1 else ''}) was {status_word}."
        if decision == "approve" and leave.shift_plan:
            n = len((leave.shift_plan or {}).get("applied") or [])
            if n:
                body += f" {n} shift{'s' if n != 1 else ''} were reassigned or posted to the marketplace."
        db.add(Notification(
            id=f"n_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(4)}",
            org_id=leave.org_id,
            user_id=leave.employee_id,
            type=f"leave_{status_word}",
            title=f"Leave request {status_word}",
            body=body,
            status="unread",
            created_at=datetime.now(timezone.utc),
        ))
        if decision == "approve":
            for admin in db.query(User).filter(User.org_id == leave.org_id, User.role == "admin").all():
                if admin.id == user.id:
                    continue
                db.add(Notification(
                    id=f"n_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(4)}",
                    org_id=leave.org_id,
                    user_id=admin.id,
                    type="leave_approved",
                    title="Leave approved with shift plan",
                    body=f"{leave.employee_name}'s leave was approved. Shifts were redistributed.",
                    status="unread",
                    created_at=datetime.now(timezone.utc),
                ))
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to create leave decision notification: {e}")

    notify_org(
        leave.org_id,
        f"leave_{decision}d",
        title=f"Leave {decision}d",
        body=f"Leave request for {leave.employee_name} was {decision}d",
        data={"leave_id": leave.id, "status": leave.status},
    )
    return _serialize(leave)


@router.post("/{leave_id}/return")
async def return_from_leave(request: Request, leave_id: str, db: Session = Depends(get_db)):
    """Employee signals they are back from approved leave."""
    user = await get_current_user(request, db)
    leave = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id,
        LeaveRequest.org_id == user.org_id,
        LeaveRequest.employee_id == user.id,
        LeaveRequest.status == "approved",
    ).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Active leave not found")

    if getattr(leave, "returned_at", None):
        return {"message": "Already marked as returned", "leave": _serialize(leave)}

    leave.returned_at = datetime.now(timezone.utc)
    leave.updated_at = datetime.now(timezone.utc)
    user.status = "active"
    user.updated_at = datetime.now(timezone.utc)
    db.commit()

    try:
        for admin in db.query(User).filter(User.org_id == user.org_id, User.role == "admin").all():
            db.add(Notification(
                id=f"n_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(4)}",
                org_id=user.org_id,
                user_id=admin.id,
                type="leave_return",
                title=f"{user.name} is back from leave",
                body=f"{user.name} marked themselves as returned from {leave.type} leave.",
                status="unread",
                created_at=datetime.now(timezone.utc),
            ))
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to notify admins of return: {e}")

    notify_org(user.org_id, "leave_return", title="Employee returned",
               body=f"{user.name} is back from leave", data={"leave_id": leave.id})
    return {"message": "Welcome back!", "leave": _serialize(leave)}


@router.put("/{leave_id}/approve")
async def approve_leave(request: Request, leave_id: str, db: Session = Depends(get_db)):
    payload = await request.json() if request.headers.get("content-type", "").startswith("application/json") else {}
    return await _decide(leave_id, "approve", request, db, payload)


@router.put("/{leave_id}/reject")
async def reject_leave(request: Request, leave_id: str, db: Session = Depends(get_db)):
    return await _decide(leave_id, "reject", request, db)


@router.put("/{leave_id}/decide")
async def decide_leave(request: Request, leave_id: str, payload: dict,
                       db: Session = Depends(get_db)):
    decision = (payload or {}).get("status", "approved")
    if decision not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="status must be 'approved' or 'rejected'")
    verb = "approve" if decision == "approved" else "reject"
    return await _decide(leave_id, verb, request, db, payload)


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
    leave.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Leave cancelled", "id": leave_id}
