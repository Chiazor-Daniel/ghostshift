"""Shift coverage helpers for approved leave requests."""

from datetime import datetime, timezone, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session

from models.shift import Shift
from models.user import User
from models.leave import LeaveRequest


def _shift_on_employee(shift: Shift, employee_id: str) -> bool:
    if shift.employee_id == employee_id:
        return True
    return employee_id in (shift.assigned_staff or [])


def affected_shifts(db: Session, leave: LeaveRequest) -> List[Shift]:
    """Shifts assigned to the employee that fall within the leave window."""
    if not leave.start_date or not leave.end_date:
        return []
    start = leave.start_date.astimezone(timezone.utc).date()
    end = leave.end_date.astimezone(timezone.utc).date()

    rows = db.query(Shift).filter(
        Shift.org_id == leave.org_id,
        Shift.status.notin_(["completed", "cancelled"]),
    ).all()

    out = []
    for s in rows:
        if not _shift_on_employee(s, leave.employee_id):
            continue
        if not s.start_time:
            continue
        d = s.start_time.astimezone(timezone.utc).date()
        if start <= d <= end:
            out.append(s)
    return sorted(out, key=lambda x: x.start_time or datetime.min.replace(tzinfo=timezone.utc))


def _has_conflict(db: Session, employee_id: str, shift: Shift, exclude_shift_id: str) -> bool:
    if not shift.start_time or not shift.end_time:
        return False
    others = db.query(Shift).filter(
        Shift.org_id == shift.org_id,
        Shift.id != exclude_shift_id,
        Shift.status.notin_(["completed", "cancelled", "open"]),
    ).all()
    for o in others:
        if employee_id not in (o.assigned_staff or []) and o.employee_id != employee_id:
            continue
        if o.start_time and o.end_time and o.start_time < shift.end_time and o.end_time > shift.start_time:
            return True
    return False


def _score_candidate(emp: User, shift: Shift, db: Session) -> int:
    score = 50
    if shift.department and emp.department:
        if shift.department.lower() == emp.department.lower():
            score += 25
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent = db.query(Shift).filter(
        Shift.employee_id == emp.id,
        Shift.start_time >= week_ago,
    ).count()
    if recent <= 3:
        score += 15
    elif recent <= 5:
        score += 8
    if emp.burnout_score and emp.burnout_score > 70:
        score -= 15
    if _has_conflict(db, emp.id, shift, shift.id):
        score -= 40
    return max(0, min(100, score))


def build_shift_plan(db: Session, leave: LeaveRequest) -> dict:
    """AI-assisted plan: assign to teammate or post to marketplace."""
    shifts = affected_shifts(db, leave)
    candidates = db.query(User).filter(
        User.org_id == leave.org_id,
        User.role != "admin",
        User.id != leave.employee_id,
        User.status != "inactive",
    ).all()

    items = []
    for shift in shifts:
        best_emp = None
        best_score = 0
        for emp in candidates:
            if shift.department and emp.department:
                if shift.department.lower() not in emp.department.lower() and emp.department.lower() not in shift.department.lower():
                    continue
            sc = _score_candidate(emp, shift, db)
            if sc > best_score:
                best_score = sc
                best_emp = emp

        date_str = shift.start_time.astimezone(timezone.utc).date().isoformat() if shift.start_time else None
        if best_emp and best_score >= 60:
            items.append({
                "shift_id": shift.id,
                "title": shift.title,
                "department": shift.department,
                "date": date_str,
                "start_hour": shift.start_hour,
                "action": "assign",
                "assignee_id": best_emp.id,
                "assignee_name": best_emp.name,
                "ai_score": best_score,
                "reason": f"Assign to {best_emp.name} (fit score {best_score})",
            })
        else:
            items.append({
                "shift_id": shift.id,
                "title": shift.title,
                "department": shift.department,
                "date": date_str,
                "start_hour": shift.start_hour,
                "action": "marketplace",
                "assignee_id": None,
                "assignee_name": None,
                "ai_score": best_score,
                "reason": "No strong teammate match — post to shift marketplace",
            })

    assign_count = sum(1 for i in items if i["action"] == "assign")
    market_count = sum(1 for i in items if i["action"] == "marketplace")
    summary = (
        f"{len(items)} shift{'s' if len(items) != 1 else ''} affected. "
        f"{assign_count} recommended for reassignment, {market_count} to marketplace."
        if items else "No shifts scheduled during this absence window."
    )

    return {
        "affected_count": len(shifts),
        "items": items,
        "summary": summary,
    }


def apply_shift_plan(db: Session, leave: LeaveRequest, actions: List[dict]) -> List[dict]:
    """Apply admin-confirmed shift actions. Returns applied log."""
    employee_id = leave.employee_id
    applied = []

    for act in actions:
        shift_id = act.get("shift_id")
        action = act.get("action")
        assignee_id = act.get("assignee_id")

        shift = db.query(Shift).filter(
            Shift.id == shift_id,
            Shift.org_id == leave.org_id,
        ).first()
        if not shift:
            continue

        assigned = list(shift.assigned_staff or [])
        if employee_id in assigned:
            assigned.remove(employee_id)
        if shift.employee_id == employee_id:
            shift.employee_id = None

        if action == "assign" and assignee_id:
            if assignee_id not in assigned:
                assigned.append(assignee_id)
            shift.employee_id = assignee_id
            shift.assigned_staff = assigned
            shift.status = "scheduled" if len(assigned) < (shift.required_staff or 1) else "active"
            applied.append({"shift_id": shift.id, "action": "assign", "assignee_id": assignee_id})
        else:
            shift.assigned_staff = assigned
            if not assigned:
                shift.employee_id = None
                shift.status = "open"
            elif shift.employee_id is None:
                shift.employee_id = assigned[0]
            applied.append({"shift_id": shift.id, "action": "marketplace"})

        shift.updated_at = datetime.now(timezone.utc)

    return applied


def active_leave_for_user(db: Session, user: User) -> Optional[LeaveRequest]:
    """Approved leave the employee should see as active (overlay / app lock)."""
    today = datetime.now(timezone.utc).date()
    rows = db.query(LeaveRequest).filter(
        LeaveRequest.org_id == user.org_id,
        LeaveRequest.employee_id == user.id,
        LeaveRequest.status == "approved",
    ).order_by(LeaveRequest.start_date.asc()).all()

    candidates = []
    for lv in rows:
        if getattr(lv, "returned_at", None):
            continue
        if not lv.start_date or not lv.end_date:
            continue
        start = lv.start_date.astimezone(timezone.utc).date()
        end = lv.end_date.astimezone(timezone.utc).date()
        if today > end:
            continue
        candidates.append((lv, start, end))

    if not candidates:
        return None

    # Currently within leave dates — always lock.
    for lv, start, end in candidates:
        if start <= today <= end:
            return lv

    # Approved future leave: lock from approval until employee taps "I'm back".
    if getattr(user, "status", None) == "on_leave":
        upcoming = [(lv, start, end) for lv, start, end in candidates if start > today]
        if upcoming:
            return upcoming[0][0]

    return None
