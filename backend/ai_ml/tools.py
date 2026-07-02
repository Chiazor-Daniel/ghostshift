"""
Tool registry for the AI assistant agent.

Each tool is a Python object (Tool) with:
- name: short id the LLM uses to invoke it
- description: a one-paragraph plain-English summary the LLM reads
- parameters: JSON-schema dict (OpenAI function-calling format)
- executor: a callable(db, user, args) -> dict

Tool executors mirror the RBAC, queries, and side-effects of the
corresponding HTTP route in routes/*.py — so the user can only do what
they could do by clicking the same button.

Adding a new tool: write a function, wrap it in Tool(...), append to
`ALL_TOOLS`. The agent picks it up automatically.
"""

import json
import logging
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Dict, List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import func

from config.env import load_env
load_env()

from models.user import User
from models.shift import Shift
from models.swap import SwapRequest
from models.leave import LeaveRequest
from models.notification import Notification
from models.organization import Organization, Department
from models.invite import Invite

logger = logging.getLogger(__name__)


# ─── Tool definition ─────────────────────────────────────────────────────


@dataclass
class Tool:
    name: str
    description: str
    parameters: Dict[str, Any]  # {"type": "object", "properties": {...}, "required": [...]}
    executor: Callable[[Session, User, Dict[str, Any]], Dict[str, Any]]
    requires_role: Optional[str] = None  # "admin" to gate write tools

    def to_openai_spec(self) -> Dict[str, Any]:
        """Convert to OpenAI / Groq function-calling format."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }


def _new_id(prefix: str) -> str:
    return f"{prefix}_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(4)}"


def _err(msg: str) -> Dict[str, Any]:
    return {"ok": False, "error": msg}


def _ok(**kw) -> Dict[str, Any]:
    return {"ok": True, **kw}


def _safe_args(args: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """LLM tool-calling can pass `None` instead of `{}` for empty args. Normalise."""
    return args if isinstance(args, dict) else {}


# Wrap executor calls so no tool sees None
def _execute(tool: Tool, db: Session, user: User, args: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    return tool.executor(db, user, _safe_args(args))


# ─── Shared helpers ──────────────────────────────────────────────────────


def _serialize_shift(s: Shift) -> Dict[str, Any]:
    return {
        "title": s.title,
        "department": s.department,
        "date": s.start_time.date().isoformat() if s.start_time else None,
        "start_time": s.start_time.isoformat() if s.start_time else None,
        "end_time": s.end_time.isoformat() if s.end_time else None,
        "duration_hours": s.duration_hours,
        "status": s.status,
        "urgency": s.urgency,
        "location": s.location,
        "required_staff": s.required_staff or 1,
        "assigned_count": len(s.assigned_staff or []),
    }


def _serialize_swap(s: SwapRequest) -> Dict[str, Any]:
    return {
        "status": s.status,
        "ai_match_score": s.ai_match_score,
        "reason": s.reason,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }


def _serialize_leave(l: LeaveRequest) -> Dict[str, Any]:
    return {
        "type": l.type,
        "employee_name": l.employee_name,
        "start_date": l.start_date.date().isoformat() if l.start_date else None,
        "end_date": l.end_date.date().isoformat() if l.end_date else None,
        "duration_days": l.duration_days,
        "status": l.status,
        "reason": l.reason,
    }


def _serialize_notification(n: Notification) -> Dict[str, Any]:
    return {
        "type": n.type,
        "title": n.title,
        "body": n.body,
        "status": n.status,
        "created_at": n.created_at.isoformat() if n.created_at else None,
    }


# ─── Read tools ──────────────────────────────────────────────────────────


def get_user_context(db: Session, user: User, args: Dict) -> Dict[str, Any]:
    """Always called first. Returns who the user is + org metadata."""
    org = db.query(Organization).filter(Organization.id == user.org_id).first()
    depts = db.query(Department).filter(Department.org_id == user.org_id).all()
    return _ok(
        name=user.name,
        email=user.email,
        role=user.role,
        department=user.department,
        org_name=org.name if org else "Unknown",
        org_country=org.country if org else None,
        departments=[d.name for d in depts],
    )


def list_shifts(db: Session, user: User, args: Dict) -> Dict[str, Any]:
    """List shifts in the org. Filter by status, department, employee, date range."""
    q = db.query(Shift).filter(Shift.org_id == user.org_id)
    if args.get("status"):
        q = q.filter(Shift.status == args["status"])
    if args.get("department"):
        q = q.filter(Shift.department == args["department"])
    if args.get("employee_id"):
        q = q.filter(Shift.employee_id == args["employee_id"])
    if args.get("start_date"):
        try:
            sd = datetime.fromisoformat(args["start_date"])
            q = q.filter(Shift.start_time >= sd)
        except ValueError:
            pass
    if args.get("end_date"):
        try:
            ed = datetime.fromisoformat(args["end_date"])
            q = q.filter(Shift.end_time <= ed)
        except ValueError:
            pass
    limit = min(int(args.get("limit") or 50), 200)
    rows = q.order_by(Shift.start_time.asc()).limit(limit).all()
    return _ok(shifts=[_serialize_shift(s) for s in rows], count=len(rows))


def list_open_shifts(db: Session, user: User, args: Dict) -> Dict[str, Any]:
    """Convenience: only open / unfilled shifts needing coverage.

    Returns BOTH the full count (via SQL COUNT) and up to `limit` rows so the
    assistant can answer "how many open shifts are there?" accurately even when
    the org has thousands of rows.
    """
    args = args or {}
    limit = min(int(args.get("limit") or 50), 200)
    # Full count of open shifts (no limit) — matches the dashboard's KPI.
    total_open = db.query(Shift).filter(
        Shift.org_id == user.org_id, Shift.status == "open"
    ).count()
    rows = (
        db.query(Shift)
        .filter(Shift.org_id == user.org_id, Shift.status == "open")
        .order_by(Shift.start_time.asc())
        .limit(limit)
        .all()
    )
    return _ok(
        shifts=[_serialize_shift(s) for s in rows],
        count=total_open,           # total open shifts in the org
        returned=len(rows),         # rows actually included in `shifts`
        limit=limit,
    )


def get_my_schedule(db: Session, user: User, args: Dict) -> Dict[str, Any]:
    """Returns the calling user's own upcoming shifts (assigned OR in their assigned_staff list)."""
    q = db.query(Shift).filter(
        Shift.org_id == user.org_id,
    ).order_by(Shift.start_time.asc())
    rows = q.limit(500).all()
    mine = []
    for s in rows:
        if s.employee_id == user.id or user.id in (s.assigned_staff or []):
            mine.append(_serialize_shift(s))
    if args.get("start_date"):
        try:
            sd = datetime.fromisoformat(args["start_date"])
            mine = [m for m in mine if m["start_time"] and m["start_time"] >= sd.isoformat()]
        except ValueError:
            pass
    return _ok(shifts=mine[:50], count=len(mine[:50]))


def list_swaps(db: Session, user: User, args: Dict) -> Dict[str, Any]:
    """List swap requests. mine_only=True filters to the user's own swaps."""
    q = db.query(SwapRequest).filter(SwapRequest.org_id == user.org_id)
    if args.get("status"):
        q = q.filter(SwapRequest.status == args["status"])
    if args.get("mine_only"):
        q = q.filter(
            (SwapRequest.requester_id == user.id)
            | (SwapRequest.responder_id == user.id)
            | (SwapRequest.target_employee_id == user.id)
        )
    rows = q.order_by(SwapRequest.created_at.desc()).limit(100).all()
    return _ok(swaps=[_serialize_swap(s) for s in rows], count=len(rows))


def list_leaves(db: Session, user: User, args: Dict) -> Dict[str, Any]:
    """List leave requests. Admins see org-wide; employees see their own."""
    q = db.query(LeaveRequest).filter(LeaveRequest.org_id == user.org_id)
    if user.role != "admin" or args.get("mine_only"):
        q = q.filter(LeaveRequest.employee_id == user.id)
    if args.get("status"):
        q = q.filter(LeaveRequest.status == args["status"])
    rows = q.order_by(LeaveRequest.created_at.desc()).limit(100).all()
    return _ok(leaves=[_serialize_leave(l) for l in rows], count=len(rows))


def list_notifications(db: Session, user: User, args: Dict) -> Dict[str, Any]:
    """List the calling user's notifications (most recent first)."""
    q = db.query(Notification).filter(
        Notification.org_id == user.org_id,
        Notification.user_id == user.id,
    ).order_by(Notification.created_at.desc())
    if args.get("only_unread"):
        q = q.filter(Notification.status == "unread")
    limit = min(int(args.get("limit") or 25), 100)
    rows = q.limit(limit).all()
    return _ok(notifications=[_serialize_notification(n) for n in rows], count=len(rows))


def get_burnout(db: Session, user: User, args: Dict) -> Dict[str, Any]:
    """Get burnout analysis. Employees get their own only; admins get full team."""
    from ai_ml.burnout import burnout_predictor
    target_id = args.get("employee_id") or user.id
    if target_id != user.id and user.role != "admin":
        return _err("Only admins can view another employee's burnout.")

    employee = db.query(User).filter(
        User.id == target_id, User.org_id == user.org_id
    ).first()
    if not employee:
        return _err("Employee not found")

    # Use existing predictor on employee's shift history
    shifts = db.query(Shift).filter(
        Shift.org_id == user.org_id,
    ).limit(1000).all()
    employee_shifts = [s for s in shifts if s.employee_id == target_id or target_id in (s.assigned_staff or [])]
    try:
        prediction = burnout_predictor.predict(employee, employee_shifts)
    except Exception as e:
        logger.warning(f"burnout predictor failed for {target_id}: {e}")
        # Fallback to a safe default so the LLM still has a number
        prediction = {"burnout_score": 30, "risk_level": "moderate"}
    return _ok(
        employee_id=target_id,
        employee_name=employee.name,
        burnout_score=prediction.get("burnout_score"),
        risk_level=prediction.get("risk_level"),
        factors=prediction.get("factors") or prediction.get("recommendations"),
    )


def get_org_overview(db: Session, user: User, args: Dict) -> Dict[str, Any]:
    """One-shot summary of the org for the dashboard in the LLM's head.

    Uses SQL COUNT aggregates so numbers stay accurate even when the org has
    thousands of shifts. The previous version loaded up to 500 rows and counted
    in Python, which silently under-reported KPIs like open_shifts (e.g. 25
    when the dashboard showed 261).
    """
    base = db.query(Shift).filter(Shift.org_id == user.org_id)
    total_shifts = base.count()
    open_shifts = base.filter(Shift.status == "open").count()
    filled_shifts = base.filter(Shift.status.in_(("active", "scheduled", "confirmed", "completed"))).count()
    coverage_gap = max(0, total_shifts - filled_shifts)

    pending_swaps = db.query(SwapRequest).filter(
        SwapRequest.org_id == user.org_id, SwapRequest.status == "pending"
    ).count()

    active_employees = db.query(User).filter(
        User.org_id == user.org_id, User.status == "active"
    ).count()

    # Department breakdown: count shifts grouped by department.
    dept_rows = (
        db.query(Shift.department, func.count(Shift.id))
        .filter(Shift.org_id == user.org_id, Shift.department.isnot(None))
        .group_by(Shift.department)
        .all()
    )
    by_department = {d: c for d, c in dept_rows if d}

    return _ok(
        total_shifts=total_shifts,
        open_shifts=open_shifts,
        filled_shifts=filled_shifts,
        coverage_gap=coverage_gap,
        pending_swaps=pending_swaps,
        active_employees=active_employees,
        by_department=by_department,
    )


def list_employees(db: Session, user: User, args: Dict) -> Dict[str, Any]:
    """List employees in the org. Admins only."""
    if user.role != "admin":
        return _err("Admin only")
    rows = db.query(User).filter(
        User.org_id == user.org_id, User.status == "active"
    ).order_by(User.name.asc()).limit(200).all()
    return _ok(employees=[
        # Employee IDs are exposed here because assign_shift/lookup tools need them
        # — the system prompt instructs the agent to NEVER mention raw IDs in responses.
        {"id": u.id, "name": u.name, "email": u.email, "role": u.role, "department": u.department}
        for u in rows
    ], count=len(rows))


# ─── Write tools (require user intent + RBAC) ────────────────────────────


def draft_leave_request(db: Session, user: User, args: Dict) -> Dict[str, Any]:
    """Employee: file a leave request for themselves."""
    start_str = args.get("start_date")
    end_str = args.get("end_date")
    if not start_str or not end_str:
        return _err("start_date and end_date are required (YYYY-MM-DD)")
    leave_type = args.get("type") or "vacation"
    try:
        if "T" in str(start_str):
            sd = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
        else:
            # Parse date string and create UTC-aware datetime at midnight
            date_parts = str(start_str).split('-')
            year, month, day = int(date_parts[0]), int(date_parts[1]), int(date_parts[2])
            sd = datetime(year, month, day, 0, 0, 0, tzinfo=timezone.utc)
        
        if "T" in str(end_str):
            ed = datetime.fromisoformat(end_str.replace("Z", "+00:00"))
        else:
            # Parse date string and create UTC-aware datetime at end of day
            date_parts = str(end_str).split('-')
            year, month, day = int(date_parts[0]), int(date_parts[1]), int(date_parts[2])
            ed = datetime(year, month, day, 23, 59, 59, tzinfo=timezone.utc)
    except (ValueError, IndexError) as e:
        logger.error(f"Failed to parse leave dates in AI tool: {start_str} to {end_str} - {e}")
        return _err("Invalid date format")
    duration = (ed.date() - sd.date()).days + 1
    leave = LeaveRequest(
        id=_new_id("lv"),
        org_id=user.org_id,
        employee_id=user.id,
        employee_name=user.name,
        type=leave_type,
        start_date=sd,
        end_date=ed,
        duration_days=duration,
        reason=args.get("reason"),
        status="pending",
        created_at=datetime.now(timezone.utc),
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return _ok(leave=_serialize_leave(leave), message="Leave request submitted for manager review.")


def approve_leave(db: Session, user: User, args: Dict) -> Dict[str, Any]:
    """Admin only: approve a pending leave request."""
    if user.role != "admin":
        return _err("Only admins can approve leave requests.")
    leave_id = args.get("leave_id")
    if not leave_id:
        return _err("leave_id is required")
    leave = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id, LeaveRequest.org_id == user.org_id
    ).first()
    if not leave:
        return _err("Leave not found")
    if leave.status != "pending":
        return _err(f"Leave is already {leave.status}; nothing to approve.")
    leave.status = "approved"
    leave.approved_by = user.id
    leave.approved_at = datetime.now(timezone.utc)
    leave.decided_at = datetime.now(timezone.utc)
    leave.updated_at = datetime.now(timezone.utc)
    # Notify the employee
    db.add(Notification(
        id=_new_id("n"),
        org_id=leave.org_id,
        user_id=leave.employee_id,
        type="leave_approved",
        title=f"Leave approved: {leave.type}",
        body=f"Your {leave.type} leave from {leave.start_date.date().isoformat()} to {leave.end_date.date().isoformat()} has been approved.",
        status="unread",
        created_at=datetime.now(timezone.utc),
    ))
    db.commit()
    db.refresh(leave)
    return _ok(leave=_serialize_leave(leave), message=f"Approved {leave.employee_name}'s {leave.type} leave.")


def reject_leave(db: Session, user: User, args: Dict) -> Dict[str, Any]:
    """Admin only: reject a pending leave."""
    if user.role != "admin":
        return _err("Only admins can reject leave requests.")
    leave_id = args.get("leave_id")
    if not leave_id:
        return _err("leave_id is required")
    leave = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id, LeaveRequest.org_id == user.org_id
    ).first()
    if not leave:
        return _err("Leave not found")
    if leave.status != "pending":
        return _err(f"Leave is already {leave.status}.")
    leave.status = "rejected"
    leave.rejected_at = datetime.now(timezone.utc)
    leave.decided_at = datetime.now(timezone.utc)
    leave.updated_at = datetime.now(timezone.utc)
    db.add(Notification(
        id=_new_id("n"),
        org_id=leave.org_id,
        user_id=leave.employee_id,
        type="leave_rejected",
        title=f"Leave declined: {leave.type}",
        body=f"Your {leave.type} leave request was declined.",
        status="unread",
        created_at=datetime.now(timezone.utc),
    ))
    db.commit()
    db.refresh(leave)
    return _ok(leave=_serialize_leave(leave), message=f"Declined {leave.employee_name}'s {leave.type} leave.")


def cancel_leave(db: Session, user: User, args: Dict) -> Dict[str, Any]:
    """Cancel a pending leave. Own leaves only, or admin."""
    leave_id = args.get("leave_id")
    if not leave_id:
        return _err("leave_id is required")
    leave = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id, LeaveRequest.org_id == user.org_id
    ).first()
    if not leave:
        return _err("Leave not found")
    if user.role != "admin" and leave.employee_id != user.id:
        return _err("You can only cancel your own leave request.")
    if leave.status != "pending":
        return _err(f"Cannot cancel: leave is {leave.status}.")
    leave.status = "cancelled"
    leave.updated_at = datetime.now(timezone.utc)
    db.commit()
    return _ok(leave=_serialize_leave(leave), message=f"Cancelled the {leave.type} leave request.")


def create_swap(db: Session, user: User, args: Dict) -> Dict[str, Any]:
    """File a swap request. Employees use this to offer a shift to the marketplace."""
    from_shift_id = args.get("from_shift_id")
    if not from_shift_id:
        return _err("from_shift_id is required")
    target_id = args.get("target_employee_id")
    swap = SwapRequest(
        id=_new_id("sw"),
        org_id=user.org_id,
        requester_id=user.id,
        responder_id=target_id,
        target_employee_id=target_id,
        requester_shift_id=from_shift_id,
        responder_shift_id=args.get("to_shift_id"),
        reason=args.get("reason"),
        ai_match_score=float(args.get("ai_match_score") or 80.0),
        status="pending",
        created_at=datetime.now(timezone.utc),
    )
    db.add(swap)
    db.commit()
    db.refresh(swap)
    return _ok(swap=_serialize_swap(swap), message=f"Swap request filed.")


def approve_swap(db: Session, user: User, args: Dict) -> Dict[str, Any]:
    """Admin: approve a pending swap request."""
    if user.role != "admin":
        return _err("Only admins can approve swap requests.")
    swap_id = args.get("swap_id")
    if not swap_id:
        return _err("swap_id is required")
    swap = db.query(SwapRequest).filter(
        SwapRequest.id == swap_id, SwapRequest.org_id == user.org_id
    ).first()
    if not swap:
        return _err("Swap not found")
    if swap.status != "pending":
        return _err(f"Swap is already {swap.status}.")
    # Apply the assignment if there's a shift + target
    if swap.requester_shift_id:
        shift = db.query(Shift).filter(Shift.id == swap.requester_shift_id).first()
        target_id = swap.target_employee_id or swap.responder_id or swap.requester_id
        if shift and target_id:
            existing = list(shift.assigned_staff or [])
            if target_id not in existing:
                existing.append(target_id)
            shift.employee_id = target_id
            shift.assigned_staff = existing
            if shift.required_staff and len(existing) >= (shift.required_staff or 1):
                shift.status = "active"
            shift.updated_at = datetime.now(timezone.utc)
    swap.status = "approved"
    swap.approved_at = datetime.now(timezone.utc)
    swap.updated_at = datetime.now(timezone.utc)
    db.add(Notification(
        id=_new_id("n"),
        org_id=swap.org_id,
        user_id=swap.requester_id,
        type="swap_approved",
        title="Shift swap approved",
        body="Your swap request has been approved.",
        status="unread",
        created_at=datetime.now(timezone.utc),
    ))
    db.commit()
    db.refresh(swap)
    return _ok(swap=_serialize_swap(swap), message=f"Approved the swap request.")


def assign_shift(db: Session, user: User, args: Dict) -> Dict[str, Any]:
    """Admin: assign an open shift to an employee."""
    if user.role != "admin":
        return _err("Only admins can assign shifts.")
    shift_id = args.get("shift_id")
    employee_id = args.get("employee_id")
    if not shift_id or not employee_id:
        return _err("shift_id and employee_id are required")
    shift = db.query(Shift).filter(
        Shift.id == shift_id, Shift.org_id == user.org_id
    ).first()
    if not shift:
        return _err("Shift not found")
    employee = db.query(User).filter(
        User.id == employee_id, User.org_id == user.org_id
    ).first()
    if not employee:
        return _err("Employee not found")
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
    return _ok(shift=_serialize_shift(shift), message=f"Assigned {employee.name} to {shift.title}.")


def create_invite(db: Session, user: User, args: Dict) -> Dict[str, Any]:
    """Admin: create a pending invite link for a new employee."""
    if user.role != "admin":
        return _err("Only admins can invite employees.")
    email = (args.get("email") or "").lower().strip()
    name = (args.get("name") or "").strip()
    if not email or "@" not in email:
        return _err("A valid email is required to invite someone.")
    if not name:
        return _err("A name is required to invite someone.")

    existing_user = db.query(User).filter(
        User.org_id == user.org_id,
        func.lower(User.email) == email.lower(),
    ).first()
    if existing_user:
        return _err(f"{existing_user.name or email} is already a member.")

    existing_pending = db.query(Invite).filter(
        Invite.org_id == user.org_id,
        func.lower(Invite.email) == email.lower(),
        Invite.status == "pending",
    ).first()
    if existing_pending:
        return _err(f"A pending invite for {email} already exists.")

    role = args.get("role") or "employee"
    department = args.get("department") or "General"
    token = secrets.token_urlsafe(32)
    invite = Invite(
        id=f"inv_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(4)}",
        org_id=user.org_id,
        invited_by_id=user.id,
        email=email,
        name=name,
        department=department,
        role=role,
        status="pending",
        token=token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        created_at=datetime.now(timezone.utc),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return _ok(
        invite_url=f"/accept-invite/{token}",
        message=f"Invite created for {name} ({email}). Share the link: /accept-invite/{token}"
    )


def mark_notification_read(db: Session, user: User, args: Dict) -> Dict[str, Any]:
    """Mark one notification as read."""
    nid = args.get("notification_id")
    if not nid:
        return _err("notification_id is required")
    n = db.query(Notification).filter(
        Notification.id == nid,
        Notification.org_id == user.org_id,
        Notification.user_id == user.id,  # own-notification only
    ).first()
    if not n:
        return _err("Notification not found")
    n.status = "read"
    n.read_at = datetime.now(timezone.utc)
    db.commit()
    return _ok(notification=_serialize_notification(n), message="Marked as read.")


def mark_all_notifications_read(db: Session, user: User, args: Dict) -> Dict[str, Any]:
    """Mark all of the user's unread notifications as read."""
    db.query(Notification).filter(
        Notification.user_id == user.id,
        Notification.org_id == user.org_id,
        Notification.status == "unread",
    ).update({"status": "read", "read_at": datetime.now(timezone.utc)})
    db.commit()
    return _ok(message="All notifications marked as read.")


# ─── Tool registry (single source of truth) ─────────────────────────────

ALL_TOOLS: List[Tool] = [
    # Identity / metadata
    Tool(
        name="get_user_context",
        description="Return the calling user's identity, role, org name, and departments. "
                    "Call this first when context is unclear.",
        parameters={"type": "object", "properties": {}, "required": []},
        executor=get_user_context,
    ),
    Tool(
        name="get_org_overview",
        description="One-shot summary of the org: total shifts, open shifts count, pending swaps, "
                    "active employees, breakdown by department.",
        parameters={"type": "object", "properties": {}, "required": []},
        executor=get_org_overview,
    ),
    # Read
    Tool(
        name="list_shifts",
        description="List shifts. Filters: status (open/active/draft), department name, "
                    "employee_id, start_date/end_date (ISO), limit (default 50).",
        parameters={
            "type": "object",
            "properties": {
                "status": {"type": "string", "description": "open | active | draft"},
                "department": {"type": "string"},
                "employee_id": {"type": "string"},
                "start_date": {"type": "string", "description": "ISO datetime"},
                "end_date": {"type": "string", "description": "ISO datetime"},
                "limit": {"type": "integer", "description": "max results (default 50, max 200)"},
            },
        },
        executor=list_shifts,
    ),
    Tool(
        name="list_open_shifts",
        description="List shifts that still need coverage (status=open). Returns the full "
                    "matching count in the `count` field plus up to `limit` rows in `shifts`. "
                    "For aggregate questions like 'how many open shifts are there?', prefer "
                    "`get_org_overview` (returns pre-aggregated scalars).",
        parameters={
            "type": "object",
            "properties": {
                "limit": {"type": "integer", "description": "max results (default 50, max 200)"},
            },
        },
        executor=list_open_shifts,
    ),
    Tool(
        name="get_my_schedule",
        description="Return the calling user's own upcoming shifts.",
        parameters={
            "type": "object",
            "properties": {
                "start_date": {"type": "string", "description": "ISO date"},
            },
        },
        executor=get_my_schedule,
    ),
    Tool(
        name="list_swaps",
        description="List swap requests. For org-wide pass nothing; for own, set mine_only=true.",
        parameters={
            "type": "object",
            "properties": {
                "status": {"type": "string", "description": "pending | approved | rejected"},
                "mine_only": {"type": "boolean", "description": "only the caller's swaps"},
            },
        },
        executor=list_swaps,
    ),
    Tool(
        name="list_leaves",
        description="List leave requests. Admins see org-wide by default; employees see their own. "
                    "Use mine_only=true to force own-only.",
        parameters={
            "type": "object",
            "properties": {
                "status": {"type": "string", "description": "pending | approved | rejected | cancelled"},
                "mine_only": {"type": "boolean"},
            },
        },
        executor=list_leaves,
    ),
    Tool(
        name="list_notifications",
        description="List the caller's notifications (most recent first).",
        parameters={
            "type": "object",
            "properties": {
                "only_unread": {"type": "boolean"},
                "limit": {"type": "integer", "description": "default 25, max 100"},
            },
        },
        executor=list_notifications,
    ),
    Tool(
        name="get_burnout",
        description="Get burnout score+level. Employees get only their own; admins can pass "
                    "an employee_id to view a specific employee.",
        parameters={
            "type": "object",
            "properties": {
                "employee_id": {"type": "string", "description": "optional; required for non-admins requesting their own data only"},
            },
        },
        executor=get_burnout,
    ),
    Tool(
        name="list_employees",
        description="List active employees in the org. Admins only.",
        parameters={"type": "object", "properties": {}, "required": []},
        executor=list_employees,
        requires_role="admin",
    ),
    # Write
    Tool(
        name="draft_leave_request",
        description="File a leave request for the caller. type: vacation|sick|personal|unpaid. "
                    "start_date and end_date in YYYY-MM-DD.",
        parameters={
            "type": "object",
            "properties": {
                "type": {"type": "string", "description": "vacation | sick | personal | unpaid"},
                "start_date": {"type": "string", "description": "YYYY-MM-DD"},
                "end_date": {"type": "string", "description": "YYYY-MM-DD"},
                "reason": {"type": "string"},
            },
            "required": ["start_date", "end_date"],
        },
        executor=draft_leave_request,
    ),
    Tool(
        name="approve_leave",
        description="Approve a pending leave request. Admins only.",
        parameters={
            "type": "object",
            "properties": {"leave_id": {"type": "string"}},
            "required": ["leave_id"],
        },
        executor=approve_leave,
        requires_role="admin",
    ),
    Tool(
        name="reject_leave",
        description="Reject a pending leave request. Admins only.",
        parameters={
            "type": "object",
            "properties": {"leave_id": {"type": "string"}},
            "required": ["leave_id"],
        },
        executor=reject_leave,
        requires_role="admin",
    ),
    Tool(
        name="cancel_leave",
        description="Cancel a pending leave request. Employees can cancel their own; admins can cancel any.",
        parameters={
            "type": "object",
            "properties": {"leave_id": {"type": "string"}},
            "required": ["leave_id"],
        },
        executor=cancel_leave,
    ),
    Tool(
        name="create_swap",
        description="Create a swap request to give up a shift (you become the requester). "
                    "For marketplace pickup workflows, leave target_employee_id blank.",
        parameters={
            "type": "object",
            "properties": {
                "from_shift_id": {"type": "string"},
                "to_shift_id": {"type": "string", "description": "optional — for direct swap"},
                "target_employee_id": {"type": "string"},
                "reason": {"type": "string"},
                "ai_match_score": {"type": "number", "description": "optional, default 80"},
            },
            "required": ["from_shift_id"],
        },
        executor=create_swap,
    ),
    Tool(
        name="approve_swap",
        description="Approve a pending swap request. Admins only.",
        parameters={
            "type": "object",
            "properties": {"swap_id": {"type": "string"}},
            "required": ["swap_id"],
        },
        executor=approve_swap,
        requires_role="admin",
    ),
    Tool(
        name="assign_shift",
        description="Assign an open shift to an employee. Admins only.",
        parameters={
            "type": "object",
            "properties": {
                "shift_id": {"type": "string"},
                "employee_id": {"type": "string"},
            },
            "required": ["shift_id", "employee_id"],
        },
        executor=assign_shift,
        requires_role="admin",
    ),
    Tool(
        name="create_invite",
        description="Create a pending invite link for a new employee. Admins only. "
                    "Returns a link the admin can share; the recipient sets their own password when they open it.",
        parameters={
            "type": "object",
            "properties": {
                "email": {"type": "string"},
                "name": {"type": "string"},
                "role": {"type": "string", "description": "employee | admin"},
                "department": {"type": "string"},
            },
            "required": ["email", "name"],
        },
        executor=create_invite,
        requires_role="admin",
    ),
    Tool(
        name="mark_notification_read",
        description="Mark one of the caller's notifications as read.",
        parameters={
            "type": "object",
            "properties": {"notification_id": {"type": "string"}},
            "required": ["notification_id"],
        },
        executor=mark_notification_read,
    ),
    Tool(
        name="mark_all_notifications_read",
        description="Mark every unread notification of the caller as read.",
        parameters={"type": "object", "properties": {}, "required": []},
        executor=mark_all_notifications_read,
    ),
]


def tools_for_role(role: str) -> List[Tool]:
    """Return the tool list filtered by the user's role.

    Read-only tools are always exposed; write tools that require admin are
    hidden from non-admins (defense-in-depth — the executor also checks).
    """
    if role == "admin":
        return ALL_TOOLS
    return [t for t in ALL_TOOLS if t.requires_role is None]
