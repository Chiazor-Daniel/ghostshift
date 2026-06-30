"""Swap request routes — production ready."""
import logging
import secrets
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from config.database import get_db
from middleware.auth import get_current_user
from models.swap import SwapRequest
from models.shift import Shift
from models.user import User
from models.notification import Notification

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
    return f"sw_{int(datetime.utcnow().timestamp() * 1000)}_{secrets.token_hex(4)}"


@router.get("/")
async def list_swaps(request: Request, status_filter: Optional[str] = None,
                    mine_only: bool = False, db: Session = Depends(get_db)):
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
    rows = q.order_by(SwapRequest.created_at.desc()).all()
    return [_serialize(s) for s in rows]


@router.post("/")
async def create_swap(request: Request, payload: dict, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    requester_id = payload.get("requester_id") or user.id
    requester_shift_id = payload.get("from_shift_id") or payload.get("requester_shift_id")
    responder_shift_id = payload.get("to_shift_id") or payload.get("responder_shift_id")
    if not requester_shift_id:
        raise HTTPException(status_code=400, detail="from_shift_id/requester_shift_id required")

    ai_score = float(payload.get("ai_score") or payload.get("match_score") or 80.0)
    target = payload.get("target_employee_id") or payload.get("responder_id")

    swap = SwapRequest(
        id=_swid(),
        org_id=user.org_id,
        requester_id=requester_id,
        responder_id=target,
        target_employee_id=target,
        requester_shift_id=requester_shift_id,
        responder_shift_id=responder_shift_id,
        reason=payload.get("reason"),
        ai_match_score=ai_score,
        status="pending",
        created_at=datetime.utcnow(),
    )
    db.add(swap)
    db.commit()
    db.refresh(swap)
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


@router.put("/{swap_id}/approve")
async def approve_swap(request: Request, swap_id: str, db: Session = Depends(get_db)):
    return await _decision(swap_id, "approve", request, db)


@router.put("/{swap_id}/reject")
async def reject_swap(request: Request, swap_id: str, db: Session = Depends(get_db)):
    return await _decision(swap_id, "reject", request, db)


async def _decision(swap_id: str, decision: str, request: Request, db: Session):
    user = await get_current_user(request, db)
    swap = db.query(SwapRequest).filter(
        SwapRequest.id == swap_id, SwapRequest.org_id == user.org_id
    ).first()
    if not swap:
        raise HTTPException(status_code=404, detail="Swap not found")
    if swap.status != "pending":
        return _serialize(swap)

    if decision == "approve":
        if swap.requester_shift_id:
            shift = db.query(Shift).filter(Shift.id == swap.requester_shift_id).first()
            # For marketplace pickups, target_id is None — fall back to the
            # requester (the person who claimed the open shift).
            target_id = swap.target_employee_id or swap.responder_id or swap.requester_id
            if shift and target_id:
                # Conflict detection
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
                # Apply the swap (or marketplace pickup)
                existing = list(shift.assigned_staff or [])
                if target_id not in existing:
                    existing.append(target_id)
                shift.employee_id = target_id
                shift.assigned_staff = existing
                # Mark shift active if all required staff slots are filled, else keep open
                if shift.required_staff and len(existing) >= (shift.required_staff or 1):
                    shift.status = "active"
                shift.updated_at = datetime.utcnow()
        swap.status = "approved"
        swap.approved_at = datetime.utcnow()
        # Notify the requester
        try:
            shift_title = ""
            if swap.requester_shift_id:
                s = db.query(Shift).filter(Shift.id == swap.requester_shift_id).first()
                if s:
                    shift_title = s.title
            note = Notification(
                id=f"n_{int(datetime.utcnow().timestamp() * 1000)}_{secrets.token_hex(4)}",
                org_id=swap.org_id,
                user_id=swap.requester_id,
                type="swap_approved",
                title=f"Shift swap approved: {shift_title or 'shift'}",
                body=f"Your request to take the {shift_title or 'open'} shift has been approved.",
                status="unread",
                created_at=datetime.utcnow(),
            )
            db.add(note)
        except Exception as e:
            logger.warning(f"Failed to create approval notification: {e}")
    else:
        swap.status = "rejected"
        swap.rejected_at = datetime.utcnow()
        try:
            note = Notification(
                id=f"n_{int(datetime.utcnow().timestamp() * 1000)}_{secrets.token_hex(4)}",
                org_id=swap.org_id,
                user_id=swap.requester_id,
                type="swap_rejected",
                title="Shift swap declined",
                body="Your swap request was declined. Check the marketplace for alternatives.",
                status="unread",
                created_at=datetime.utcnow(),
            )
            db.add(note)
        except Exception as e:
            logger.warning(f"Failed to create rejection notification: {e}")

    swap.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(swap)
    return _serialize(swap)