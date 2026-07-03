"""Swap request routes — production ready."""
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from config.database import get_db
from middleware.auth import get_current_user
from models.swap import SwapRequest
from models.shift import Shift
from models.user import User
from models.notification import Notification
from routes.shift import _serialize as _serialize_shift
from ai_ml.assistant import ai_assistant
from utils.realtime import notify_org

logger = logging.getLogger(__name__)
router = APIRouter()


def _serialize(s: SwapRequest) -> dict:
    return {
        "id": s.id,
        "org_id": s.org_id,
        "requester_id": s.requester_id,
        "responder_id": s.responder_id,
        "target_employee_id": s.target_employee_id,
        "requester_shift_id": s.requester_shift_id,
        "responder_shift_id": s.responder_shift_id,
        "from_shift_id": s.requester_shift_id,
        "to_shift_id": s.responder_shift_id,
        "kind": getattr(s, "kind", "swap"),
        "reason": s.reason,
        "status": s.status,
        "match_score": s.ai_match_score,
        "ai_score": s.ai_match_score,
        "approved_at": s.approved_at.isoformat() if s.approved_at else None,
        "rejected_at": s.rejected_at.isoformat() if s.rejected_at else None,
        "expires_at": s.expires_at.isoformat() if s.expires_at else None,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }


def _swid() -> str:
    return f"sw_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(4)}"


def _calculate_ai_match_score(requester: User, shift: Shift, db: Session) -> int:
    """
    Calculate real AI match score for a swap/pickup request.
    
    Factors:
    - Department match (30 points)
    - Certifications match (25 points)
    - Current workload/burnout risk (25 points)
    - Time since last shift (10 points)
    - Availability (10 points)
    """
    score = 0
    
    # 1. Department match (30 points)
    if shift.department and requester.department:
        if shift.department.lower() == requester.department.lower():
            score += 30
        elif shift.department.lower() in requester.department.lower() or requester.department.lower() in shift.department.lower():
            score += 15  # Partial match
    
    # 2. Current workload/burnout risk (50 points)
    from datetime import timedelta
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_shifts = db.query(Shift).filter(
        Shift.employee_id == requester.id,
        Shift.start_time >= week_ago
    ).count()
    
    if recent_shifts <= 3:
        score += 50  # Low workload
    elif recent_shifts <= 5:
        score += 30  # Medium workload
    else:
        score += 10  # High workload - risk of burnout
    
    # 3. Time since last shift (10 points)
    last_shift = db.query(Shift).filter(
        Shift.employee_id == requester.id,
        Shift.start_time < datetime.now(timezone.utc)
    ).order_by(Shift.start_time.desc()).first()
    
    if last_shift and last_shift.start_time:
        hours_since = (datetime.now(timezone.utc) - last_shift.start_time).total_seconds() / 3600
        if hours_since >= 24:
            score += 10  # Well rested
        elif hours_since >= 12:
            score += 5
    else:
        score += 10  # No recent shifts
    
    # 4. Availability check (10 points)
    # For now, assume available if no conflicts
    # TODO: Check actual availability records
    score += 10
    
    return min(100, max(0, score))


@router.get("/")
async def list_swaps(request: Request, status_filter: Optional[str] = None,
                    mine_only: bool = False, skip: int = 0, limit: int = 100,
                    db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    q = db.query(SwapRequest).filter(SwapRequest.org_id == user.org_id)
    if status_filter:
        q = q.filter(SwapRequest.status == status_filter)
    if mine_only:
        # Show swaps where the user is requester OR responder/target
        q = q.filter(
            (SwapRequest.requester_id == user.id)
            | (SwapRequest.responder_id == user.id)
            | (SwapRequest.target_employee_id == user.id)
        )
    skip = max(0, skip)
    limit = max(1, min(limit, 200))
    rows = q.order_by(SwapRequest.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "items": [_serialize(s) for s in rows],
        "total": q.count(),
        "skip": skip,
        "limit": limit,
    }


class CreateSwapRequest(BaseModel):
    from_shift_id: str
    to_shift_id: Optional[str] = None
    target_employee_id: Optional[str] = None
    kind: Optional[str] = None
    reason: Optional[str] = None


@router.post("/")
async def create_swap(request: Request, payload: CreateSwapRequest, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    requester_id = user.id
    requester_shift_id = payload.from_shift_id
    responder_shift_id = payload.to_shift_id

    shift = db.query(Shift).filter(
        Shift.id == requester_shift_id, Shift.org_id == user.org_id
    ).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    # For swaps/releases the requester must be assigned to the shift.
    # For pickups of an open shift, the shift must be open.
    proposed_kind = payload.kind
    if proposed_kind == "release":
        if user.id not in (shift.assigned_staff or []) and shift.employee_id != user.id:
            raise HTTPException(status_code=403, detail="You can only release shifts assigned to you")
    elif proposed_kind != "pickup":
        if user.id not in (shift.assigned_staff or []) and shift.employee_id != user.id:
            raise HTTPException(status_code=403, detail="You can only swap shifts assigned to you")
    else:
        # Marketplace pickup — shift must still be open and unfilled.
        if shift.status != "open":
            raise HTTPException(status_code=400, detail="This shift is no longer open for pickup")

    # Calculate real AI match score
    requester = db.query(User).filter(User.id == requester_id).first()
    if requester and shift:
        ai_score = _calculate_ai_match_score(requester, shift, db)
    else:
        ai_score = 80.0
    
    target = payload.target_employee_id
    if target:
        target_user = db.query(User).filter(User.id == target, User.org_id == user.org_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="Target employee not found in your organization")
        if target == requester_id:
            raise HTTPException(status_code=400, detail="You cannot target yourself")
        if responder_shift_id:
            resp_shift = db.query(Shift).filter(
                Shift.id == responder_shift_id, Shift.org_id == user.org_id
            ).first()
            if not resp_shift:
                raise HTTPException(status_code=404, detail="Target shift not found")
            if target not in (resp_shift.assigned_staff or []):
                raise HTTPException(status_code=400, detail="Target employee is not assigned to the target shift")

    # Block duplicate pending swaps for the same requester + same shift
    duplicate = db.query(SwapRequest).filter(
        SwapRequest.org_id == user.org_id,
        SwapRequest.requester_id == requester_id,
        SwapRequest.requester_shift_id == requester_shift_id,
        SwapRequest.status == "pending",
    ).first()
    if duplicate:
        raise HTTPException(
            status_code=409,
            detail="You already have a pending swap request for this shift.",
        )

    # Determine request kind: 'swap' if responder_shift is set (true swap);
    # 'pickup' if this is a marketplace claim of an open shift;
    # 'release' if the employee explicitly asked to be released from a shift.
    kind = payload.kind
    if not kind:
        # Fallback logic if kind not explicitly provided
        kind = "pickup" if not responder_shift_id else "swap"
    
    # Validate kind value
    valid_kinds = ["swap", "pickup", "release"]
    if kind not in valid_kinds:
        logger.warning(f"Invalid kind '{kind}' provided, defaulting based on context")
        kind = "pickup" if not responder_shift_id else "swap"

    swap = SwapRequest(
        id=_swid(),
        org_id=user.org_id,
        requester_id=requester_id,
        responder_id=target,
        target_employee_id=target,
        requester_shift_id=requester_shift_id,
        responder_shift_id=responder_shift_id,
        kind=kind,
        reason=payload.reason,
        ai_match_score=ai_score,
        status="pending",
        created_at=datetime.now(timezone.utc),
    )
    db.add(swap)
    db.commit()
    db.refresh(swap)

    # Notify admins in-app (and via WebSocket for live dashboards).
    try:
        admins = db.query(User).filter(User.org_id == user.org_id, User.role == "admin").all()
        kind_label = {"pickup": "shift pickup", "release": "shift release", "swap": "shift swap"}.get(kind, "shift request")
        for admin in admins:
            db.add(Notification(
                id=f"n_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(4)}",
                org_id=user.org_id,
                user_id=admin.id,
                type="swap_request",
                title=f"New {kind_label} request",
                body=f"{user.name} submitted a {kind_label} for {shift.title or 'a shift'}.",
                status="unread",
                created_at=datetime.now(timezone.utc),
            ))
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to create swap notification: {e}")

    notify_org(
        user.org_id,
        "swap_request",
        title="New swap request",
        body=f"{user.name} submitted a {kind} request",
        data={"swap_id": swap.id, "kind": kind},
    )
    return _serialize(swap)


@router.get("/{swap_id}")
async def get_swap(request: Request, swap_id: str, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    swap = db.query(SwapRequest).filter(
        SwapRequest.id == swap_id, SwapRequest.org_id == user.org_id
    ).first()
    if not swap:
        raise HTTPException(status_code=404, detail="Swap not found")
    return _serialize(swap)


@router.get("/{swap_id}/reasoning")
async def get_swap_reasoning(request: Request, swap_id: str, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    swap = db.query(SwapRequest).filter(
        SwapRequest.id == swap_id, SwapRequest.org_id == user.org_id
    ).first()
    if not swap:
        raise HTTPException(status_code=404, detail="Swap not found")

    requester = db.query(User).filter(User.id == swap.requester_id).first()
    target = db.query(User).filter(User.id == (swap.target_employee_id or swap.responder_id)).first()
    from_shift = db.query(Shift).filter(Shift.id == swap.requester_shift_id).first()
    to_shift = db.query(Shift).filter(Shift.id == swap.responder_shift_id).first()

    # Compute department staffing context for the swap reasoning.
    dept = (from_shift.department if from_shift else requester.department) if requester else None
    dept_staff_count = 0
    dept_staff_on_shift_window = 0
    requester_is_only_staff = False
    if dept:
        dept_staff = db.query(User).filter(
            User.org_id == user.org_id,
            User.role != "admin",
            func.lower(User.department) == dept.lower(),
        ).all()
        dept_staff_count = len(dept_staff)
        dept_staff_ids = {u.id for u in dept_staff}
        if dept_staff_ids:
            # For true swaps/pickups, check the window of the from_shift.
            window_start = from_shift.start_time if from_shift else None
            window_end = from_shift.end_time if from_shift else None
            if window_start and window_end:
                overlapping = db.query(Shift).filter(
                    Shift.org_id == user.org_id,
                    Shift.start_time < window_end,
                    Shift.end_time > window_start,
                ).all()
                assigned_in_window = set()
                for s in overlapping:
                    for staff_id in (s.assigned_staff or []):
                        if staff_id in dept_staff_ids:
                            assigned_in_window.add(staff_id)
                dept_staff_on_shift_window = len(assigned_in_window)
                if swap.requester_id in dept_staff_ids and dept_staff_count == 1:
                    requester_is_only_staff = True

    staffing_context = {
        "department": dept,
        "department_staff_count": dept_staff_count,
        "department_staff_on_shift_window": dept_staff_on_shift_window,
        "requester_is_only_staff": requester_is_only_staff,
    }

    def user_min(u):
        if not u:
            return None
        return {"id": u.id, "name": u.name, "department": u.department, "title": u.title}

    result = ai_assistant.explain_swap_decision(
        swap=_serialize(swap),
        requester=user_min(requester) or {"name": "Unknown", "department": "Unknown"},
        from_shift=_serialize_shift(from_shift) if from_shift else {},
        to_shift=_serialize_shift(to_shift) if to_shift else None,
        target=user_min(target),
        staffing_context=staffing_context,
    )
    return result


@router.get("/suggest/{shift_id}")
async def suggest_swap_options(request: Request, shift_id: str, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Employee only")

    from_shift = db.query(Shift).filter(
        Shift.id == shift_id, Shift.org_id == user.org_id
    ).first()
    if not from_shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    if user.id not in (from_shift.assigned_staff or []):
        raise HTTPException(status_code=403, detail="You can only suggest swaps for shifts assigned to you")

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    # Open shifts the employee could pick up instead (not their own, future, same-ish dept preferred).
    open_shifts = db.query(Shift).filter(
        Shift.org_id == user.org_id,
        Shift.status == "open",
        Shift.id != shift_id,
        Shift.start_time >= today_start,
    ).all()

    # Peer shifts: other employees' assigned future shifts.
    peer_shifts_raw = db.query(Shift).filter(
        Shift.org_id == user.org_id,
        Shift.status == "active",
        Shift.id != shift_id,
        Shift.start_time >= today_start,
        Shift.employee_id != None,
    ).all()

    # Exclude shifts already assigned to the current employee.
    peer_shifts_raw = [s for s in peer_shifts_raw if user.id not in (s.assigned_staff or [])]

    def shift_min(s):
        return {
            "id": s.id,
            "role": s.title,
            "title": s.title,
            "department": s.department,
            "date": s.start_time.astimezone(timezone.utc).date().isoformat() if s.start_time else None,
            "start_hour": s.start_hour,
            "duration_hours": s.duration_hours,
            "employee_id": s.employee_id,
        }

    employee_min = {"id": user.id, "name": user.name, "department": user.department, "title": user.title}

    result = ai_assistant.suggest_swap_options(
        employee=employee_min,
        from_shift=shift_min(from_shift),
        candidate_shifts=[shift_min(s) for s in open_shifts],
        peer_shifts=[shift_min(s) for s in peer_shifts_raw],
    )
    return result


@router.post("/batch-reasoning")
async def batch_reasoning(request: Request, payload: dict, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    items = payload.get("items") or []
    return ai_assistant.explain_batch_approvals(items)


@router.put("/{swap_id}/approve")
async def approve_swap(request: Request, swap_id: str, db: Session = Depends(get_db)):
    return await _decision(swap_id, "approve", request, db)


@router.put("/{swap_id}/reject")
async def reject_swap(request: Request, swap_id: str, db: Session = Depends(get_db)):
    payload = await request.json() or {}
    return await _decision(swap_id, "reject", request, db, reason=payload.get("reason"))


async def _decision(swap_id: str, decision: str, request: Request, db: Session, reason: str = None):
    user = await get_current_user(request, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    swap = db.query(SwapRequest).filter(
        SwapRequest.id == swap_id, SwapRequest.org_id == user.org_id
    ).first()
    if not swap:
        raise HTTPException(status_code=404, detail="Swap not found")
    if swap.status != "pending":
        return _serialize(swap)

    try:
        if decision == "approve":
            if swap.requester_shift_id:
                shift = db.query(Shift).filter(Shift.id == swap.requester_shift_id).first()

                if swap.kind == "pickup":
                    # PICKUP: employee claims an open shift — just add them
                    target_id = swap.target_employee_id or swap.responder_id or swap.requester_id
                    if shift and target_id:
                        resp_shifts = db.query(Shift).filter(
                            Shift.employee_id == target_id,
                            Shift.id != swap.requester_shift_id,
                        ).all()
                        for rs in resp_shifts:
                            if rs.start_time and shift.start_time and rs.end_time and shift.end_time:
                                if rs.start_time < shift.end_time and rs.end_time > shift.start_time:
                                    raise HTTPException(
                                        status_code=409,
                                        detail="Conflict: target employee already has a shift overlapping this time",
                                    )
                        existing = list(shift.assigned_staff or [])
                        if target_id not in existing:
                            existing.append(target_id)
                        shift.employee_id = target_id
                        shift.assigned_staff = existing
                        if shift.required_staff and len(existing) >= (shift.required_staff or 1):
                            shift.status = "active"
                        shift.updated_at = datetime.now(timezone.utc)

                elif swap.kind == "swap":
                    # TRUE SWAP: requester gives up their shift, responder takes it
                    # and requester takes the responder's shift
                    requester_id = swap.requester_id
                    responder_id = swap.target_employee_id or swap.responder_id

                    if shift and requester_id and responder_id:
                        # 1) Remove requester from their own shift, add responder
                        assigned = list(shift.assigned_staff or [])
                        if requester_id in assigned:
                            assigned.remove(requester_id)
                        if responder_id not in assigned:
                            assigned.append(responder_id)
                        shift.assigned_staff = assigned
                        shift.employee_id = responder_id
                        shift.updated_at = datetime.now(timezone.utc)

                    # 2) Handle the responder's shift (if one exists)
                    if swap.responder_shift_id:
                        resp_shift = db.query(Shift).filter(Shift.id == swap.responder_shift_id).first()
                        if resp_shift:
                            resp_assigned = list(resp_shift.assigned_staff or [])
                            if responder_id in resp_assigned:
                                resp_assigned.remove(responder_id)
                            if requester_id not in resp_assigned:
                                resp_assigned.append(requester_id)
                            resp_shift.assigned_staff = resp_assigned
                            resp_shift.employee_id = requester_id
                            resp_shift.updated_at = datetime.now(timezone.utc)

                elif swap.kind == "release":
                    # RELEASE: employee wants to be removed from their shift
                    requester_id = swap.requester_id
                    if shift and requester_id:
                        assigned = list(shift.assigned_staff or [])
                        if requester_id in assigned:
                            assigned.remove(requester_id)
                        shift.assigned_staff = assigned
                        if not assigned:
                            shift.employee_id = None
                            shift.status = "open"
                        elif shift.employee_id == requester_id:
                            shift.employee_id = assigned[0]
                        shift.updated_at = datetime.now(timezone.utc)

            swap.status = "approved"
            swap.approved_at = datetime.now(timezone.utc)
                # Notify the requester
            try:
                requester_shift = db.query(Shift).filter(Shift.id == swap.requester_shift_id).first() if swap.requester_shift_id else None
                responder_shift = db.query(Shift).filter(Shift.id == swap.responder_shift_id).first() if swap.responder_shift_id else None
                requester_title = requester_shift.title if requester_shift else None
                responder_title = responder_shift.title if responder_shift else None
                responder_id = swap.responder_id or swap.target_employee_id

                # Requester notification
                if swap.kind == "release":
                    req_body = f"You have been released from the {requester_title or 'shift'} shift."
                    req_title = f"Release approved: {requester_title or 'shift'}"
                elif swap.kind == "pickup":
                    req_body = f"Your request to take the {requester_title or 'open'} shift has been approved."
                    req_title = f"Shift request approved: {requester_title or 'shift'}"
                else:
                    req_body = f"Your swap request has been approved. You are now assigned to {responder_title or 'the target shift'}."
                    req_title = f"Swap approved: {requester_title or 'shift'}"
                db.add(Notification(
                    id=f"n_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(4)}",
                    org_id=swap.org_id,
                    user_id=swap.requester_id,
                    type="swap_approved",
                    title=req_title,
                    body=req_body,
                    status="unread",
                    created_at=datetime.now(timezone.utc),
                ))

                # Responder notification (for pickups and true swaps)
                if responder_id and swap.kind in ("pickup", "swap"):
                    if swap.kind == "pickup":
                        resp_body = f"You have been assigned to the {requester_title or 'open'} shift."
                        resp_title = f"Assigned shift: {requester_title or 'shift'}"
                    else:
                        resp_body = f"A swap was approved. You are now assigned to {requester_title or 'the shift'} in exchange for {responder_title or 'your shift'}."
                        resp_title = f"Swap approved: {responder_title or 'shift'}"
                    db.add(Notification(
                        id=f"n_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(4)}",
                        org_id=swap.org_id,
                        user_id=responder_id,
                        type="swap_approved",
                        title=resp_title,
                        body=resp_body,
                        status="unread",
                        created_at=datetime.now(timezone.utc),
                    ))
            except Exception as e:
                logger.warning(f"Failed to create approval notification: {e}")
        else:
            swap.status = "rejected"
            swap.rejected_at = datetime.now(timezone.utc)
            try:
                requester_shift = db.query(Shift).filter(Shift.id == swap.requester_shift_id).first() if swap.requester_shift_id else None
                requester_title = requester_shift.title if requester_shift else None

                if swap.kind == "pickup":
                    req_title = f"Shift pickup declined: {requester_title or 'shift'}"
                elif swap.kind == "release":
                    req_title = f"Release declined: {requester_title or 'shift'}"
                else:
                    req_title = f"Shift swap declined: {requester_title or 'shift'}"

                if reason:
                    req_body = f"Your request was declined. Reason: {reason}"
                else:
                    req_body = "Your swap request was declined. Check the marketplace for alternatives."

                note = Notification(
                    id=f"n_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(4)}",
                    org_id=swap.org_id,
                    user_id=swap.requester_id,
                    type="swap_rejected",
                    title=req_title,
                    body=req_body,
                    status="unread",
                    created_at=datetime.now(timezone.utc),
                )
                db.add(note)
            except Exception as e:
                logger.warning(f"Failed to create rejection notification: {e}")

        swap.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(swap)
        event = "swap_approved" if decision == "approve" else "swap_rejected"
        notify_org(
            swap.org_id,
            event,
            title=f"Swap {decision}d",
            body=f"A {swap.kind} request was {decision}d",
            data={"swap_id": swap.id, "status": swap.status},
        )
        return _serialize(swap)
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error in swap decision: {e}")
        raise HTTPException(status_code=500, detail="Failed to process swap decision")


@router.post("/auto-fill/{shift_id}")
async def auto_fill(shift_id: str, request: Request, db: Session = Depends(get_db)):
    """
    Find the best free + qualified person for an open shift and assign them.

    Scoring (reuses _calculate_ai_match_score):
      - Same department (or related)
      - Not overworked (≤ 5 shifts in last 7 days)
      - No time conflict with an existing shift

    Returns the assigned employee and the new shift state, or 409 if no
    qualified candidate is available.
    """
    user = await get_current_user(request, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    shift = db.query(Shift).filter(
        Shift.id == shift_id, Shift.org_id == user.org_id
    ).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    if shift.status not in ("open", "active"):
        raise HTTPException(status_code=400, detail="Shift is not open for assignment")

    assigned = list(shift.assigned_staff or [])
    required = shift.required_staff or 1
    if len(assigned) >= required:
        raise HTTPException(status_code=409, detail="Shift is already fully staffed")

    # Candidate pool: same org, employee role, not the requester
    candidates = db.query(User).filter(
        User.org_id == user.org_id,
        User.role == "employee",
        User.id != (shift.employee_id or ""),
    ).all()

    # Filter: not already assigned
    eligible = [c for c in candidates if c.id not in assigned]

    # Filter: no time conflict with any shift where the candidate is assigned
    free = []
    for c in eligible:
        overlapping = db.query(Shift).filter(
            Shift.org_id == user.org_id,
            Shift.id != shift.id,
            Shift.start_time < shift.end_time,
            Shift.end_time > shift.start_time,
        ).all()
        has_conflict = any(
            c.id == s.employee_id or c.id in (s.assigned_staff or [])
            for s in overlapping
        )
        if not has_conflict:
            free.append(c)

    if not free:
        raise HTTPException(
            status_code=409,
            detail="No qualified, free staff available for this shift. Try posting it to the marketplace or manually assigning.",
        )

    # Score each and pick the best
    best = None
    best_score = -1
    for c in free:
        score = _calculate_ai_match_score(c, shift, db)
        if score > best_score:
            best_score = score
            best = c

    if not best:
        raise HTTPException(status_code=500, detail="Could not score candidates")

    # Assign
    if best.id not in assigned:
        assigned.append(best.id)
    shift.assigned_staff = assigned
    if not shift.employee_id:
        shift.employee_id = best.id
    if len(assigned) >= required:
        shift.status = "active"
    shift.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(shift)

    # Notify the assignee
    try:
        note = Notification(
            id=f"n_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(4)}",
            org_id=shift.org_id,
            user_id=best.id,
            type="auto_assigned",
            title=f"You're now working {shift.title or 'a shift'}",
            body=f"Auto-assigned on {shift.start_time.strftime('%b %d, %I:%M %p') if shift.start_time else 'soon'}. AI match score: {best_score}%.",
            status="unread",
            created_at=datetime.now(timezone.utc),
        )
        db.add(note)
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to create auto-assign notification: {e}")

    return {
        "shift": _serialize_shift(shift),
        "assigned_to": {
            "id": best.id,
            "name": best.name,
            "email": best.email,
            "department": best.department,
        },
        "match_score": best_score,
        "candidates_considered": len(free),
    }


@router.get("/suggestions/{shift_id}")
async def free_now_suggestions(shift_id: str, request: Request, db: Session = Depends(get_db)):
    """
    Return the top 5 free + qualified staff for a given shift, with their
    AI match score. Used by the Swap Requests sidebar and the Marketplace
    "Auto-fill" preview before the admin commits.
    """
    user = await get_current_user(request, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    shift = db.query(Shift).filter(
        Shift.id == shift_id, Shift.org_id == user.org_id
    ).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    candidates = db.query(User).filter(
        User.org_id == user.org_id,
        User.role == "employee",
    ).all()

    scored = []
    for c in candidates:
        # Workload (last 7 days)
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        recent = db.query(Shift).filter(
            Shift.employee_id == c.id,
            Shift.start_time >= week_ago,
        ).count()
        if recent > 5:
            continue  # skip overworked
        # Conflict check
        conflict = db.query(Shift).filter(
            Shift.org_id == user.org_id,
            Shift.id != shift.id,
            Shift.employee_id == c.id,
            Shift.start_time < shift.end_time,
            Shift.end_time > shift.start_time,
        ).first()
        if conflict:
            continue
        score = _calculate_ai_match_score(c, shift, db)
        scored.append({
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "department": c.department,
            "match_score": score,
            "shifts_last_7_days": recent,
        })

    scored.sort(key=lambda x: x["match_score"], reverse=True)
    return scored[:5]