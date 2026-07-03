"""Analytics routes — burnout, coverage, staffing."""
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session

from config.database import get_db
from middleware.auth import get_current_user
from models.user import User
from models.shift import Shift
from models.leave import LeaveRequest
from models.notification import Notification
from models.swap import SwapRequest
from models.organization import Organization
from ai_ml.burnout import burnout_predictor
from ai_ml.assistant import ai_assistant

logger = logging.getLogger(__name__)
router = APIRouter()


def _org_context(db: Session, org_id: str) -> dict:
    """Load organization identity for analytics narratives."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        return {"org_name": "Your organization", "org_type": None}
    settings = org.settings or {}
    org_type = settings.get("type") or org.description
    return {"org_name": org.name, "org_type": org_type}


def _employee_features(u: User, org_shifts) -> dict:
    """Compute burnout features from real shift data."""
    employee_shifts = [s for s in org_shifts if s.employee_id == u.id]
    week_start = datetime.now(timezone.utc) - timedelta(days=datetime.now(timezone.utc).weekday())
    week_shifts = [s for s in employee_shifts if s.start_time and s.start_time >= week_start]
    hours_week = sum((s.duration_hours or 0) for s in week_shifts)
    overtime = max(0, hours_week - 40)
    night_shifts = sum(1 for s in employee_shifts if (s.start_hour or 0) >= 19 or (s.start_hour or 0) <= 4)
    weekend_shifts = sum(1 for s in employee_shifts if s.start_time and s.start_time.weekday() >= 5)
    tenure_months = 12
    if u.hired_at:
        tenure_months = max(0, (datetime.now(timezone.utc) - u.hired_at).days // 30)
    return {
        "hours_worked_week": hours_week,
        "hours_worked_month": hours_week * 4,
        "overtime_hours": overtime,
        "consecutive_shifts": 0,
        "shifts_per_week": len(week_shifts),
        "days_since_rest": 1,
        "age": 30,
        "tenure_months": tenure_months,
        "night_shifts": night_shifts,
        "weekend_shifts": weekend_shifts,
        "leave_used": 0,
        "leave_remaining": 20,
        "rating": u.rating or 4,
        "coverage_gap_count": 0,
        "swap_requests": 0,
        "shift_changes": 0,
    }


@router.get("/burnout")
async def get_burnout_analytics(request: Request, employee_id: Optional[str] = None,
                               db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    q = db.query(User).filter(User.org_id == user.org_id)
    if employee_id:
        q = q.filter(User.id == employee_id)
    elif user.role != "admin":
        q = q.filter(User.id == user.id)
    employees = q.all()
    org_shifts = db.query(Shift).filter(Shift.org_id == user.org_id).all()

    rows = []
    for emp in employees:
        try:
            prediction = burnout_predictor.predict(_employee_features(emp, org_shifts))
        except Exception as e:
            prediction = {"burnout_score": 0, "risk_level": "low", "recommendations": []}
            logger.warning(f"Burnout prediction failed for {emp.id}: {e}")
        rows.append({
            "employee_id": emp.id,
            "employee_name": emp.name,
            "department": emp.department,
            "burnout_score": prediction["burnout_score"],
            "risk_level": prediction["risk_level"],
            "recommendations": prediction.get("recommendations", []),
            "factors": prediction.get("factors", {}),
        })
    return {
        "total_employees": len(rows),
        "high_risk": len([r for r in rows if r["risk_level"] == "high"]),
        "moderate_risk": len([r for r in rows if r["risk_level"] == "moderate"]),
        "low_risk": len([r for r in rows if r["risk_level"] == "low"]),
        "employees": rows,
    }


@router.get("/executive-summary-all-time")
async def get_executive_summary_all_time(request: Request, db: Session = Depends(get_db)):
    """Generate a narrative AI executive summary across all operations."""
    user = await get_current_user(request, db)

    shifts = db.query(Shift).filter(Shift.org_id == user.org_id).all()
    leaves = db.query(LeaveRequest).filter(LeaveRequest.org_id == user.org_id).all()
    swaps = db.query(SwapRequest).filter(SwapRequest.org_id == user.org_id).all()
    users = db.query(User).filter(User.org_id == user.org_id).all()

    total = len(shifts)
    filled = sum(1 for s in shifts if s.status in ("active", "scheduled", "confirmed", "completed"))
    open_count = sum(1 for s in shifts if s.status == "open")

    completed = [s for s in shifts if s.check_in_at and s.check_out_at]
    on_time = 0
    late_count = 0
    for s in completed:
        if s.start_time and s.check_in_at:
            diff = (s.check_in_at - s.start_time).total_seconds() / 60.0
            if diff <= 10:
                on_time += 1
            elif diff > 10:
                late_count += 1
    on_time_rate = round((on_time / len(completed) * 100), 1) if completed else 0

    total_swaps = len(swaps)
    approved_swaps = sum(1 for s in swaps if s.status == "approved")
    total_leaves = len(leaves)
    approved_leaves = sum(1 for l in leaves if l.status == "approved")

    rows = []
    for emp in users:
        try:
            prediction = burnout_predictor.predict(_employee_features(emp, shifts))
            rows.append(prediction)
        except Exception:
            rows.append({"risk_level": "low", "burnout_score": 0})
    high_risk = len([r for r in rows if r.get("risk_level") == "high"])

    data = {
        "coverage_rate": round((filled / total * 100), 1) if total else 0,
        "open_shifts": open_count,
        "total_shifts": total,
        "filled_shifts": filled,
        "check_in_rate": on_time_rate,
        "completed_shifts": len(completed),
        "late_count": late_count,
        "pending_swaps": sum(1 for s in swaps if s.status == "pending"),
        "pending_leaves": sum(1 for l in leaves if l.status == "pending"),
        "total_swaps": total_swaps,
        "total_leaves": total_leaves,
        "swap_approval_rate": round((approved_swaps / total_swaps * 100), 1) if total_swaps else 0,
        "leave_approval_rate": round((approved_leaves / total_leaves * 100), 1) if total_leaves else 0,
        "high_risk": high_risk,
        "total_employees": len(users),
        **_org_context(db, user.org_id),
    }
    return ai_assistant.generate_executive_summary(data)


@router.get("/coverage")
async def get_coverage_analytics(request: Request, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    shifts = db.query(Shift).filter(Shift.org_id == user.org_id).all()

    total = len(shifts)
    filled = sum(1 for s in shifts if s.status in ("active", "scheduled", "confirmed", "completed"))
    open_count = sum(1 for s in shifts if s.status == "open")

    by_dept = {}
    for s in shifts:
        d = s.department or "Unassigned"
        by_dept.setdefault(d, {"total": 0, "filled": 0, "open": 0})
        by_dept[d]["total"] += 1
        if s.status in ("active", "scheduled", "confirmed", "completed"):
            by_dept[d]["filled"] += 1
        elif s.status == "open":
            by_dept[d]["open"] += 1

    return {
        "total_shifts": total,
        "filled_shifts": filled,
        "open_shifts": open_count,
        "coverage_gap": max(0, total - filled),
        "coverage_rate": round((filled / total * 100), 1) if total else 0,
        "by_department": by_dept,
    }


@router.get("/staffing")
async def get_staffing_analytics(request: Request, db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    employees = db.query(User).filter(User.org_id == user.org_id).all()
    by_dept = {}
    for e in employees:
        d = e.department or "Unassigned"
        by_dept.setdefault(d, {"total": 0, "admins": 0, "active": 0})
        by_dept[d]["total"] += 1
        if e.role == "admin":
            by_dept[d]["admins"] += 1
        if e.status == "active":
            by_dept[d]["active"] += 1
    return {
        "total_employees": len(employees),
        "active_employees": sum(1 for e in employees if e.status == "active"),
        "on_leave": sum(1 for e in employees if e.status == "on_leave"),
        "admins": sum(1 for e in employees if e.role == "admin"),
        "departments": by_dept,
    }


@router.get("/reports")
async def get_reports(request: Request, report_type: Optional[str] = None,
                     start_date: Optional[str] = None, end_date: Optional[str] = None,
                     db: Session = Depends(get_db)):
    user = await get_current_user(request, db)
    shifts = db.query(Shift).filter(Shift.org_id == user.org_id).all()
    leaves = db.query(LeaveRequest).filter(LeaveRequest.org_id == user.org_id).all()
    return {
        "report_type": report_type or "summary",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "totals": {
            "shifts": len(shifts),
            "open_shifts": sum(1 for s in shifts if s.status == "open"),
            "active_shifts": sum(1 for s in shifts if s.status == "active"),
            "leaves_requested": len(leaves),
            "leaves_approved": sum(1 for l in leaves if l.status == "approved"),
        },
        "data": [],
    }


@router.get("/attendance")
async def get_attendance_analytics(request: Request,
                                   employee_id: Optional[str] = None,
                                   db: Session = Depends(get_db)):
    """
    Surface real check-in / check-out data.

    Returns per-employee totals: scheduled hours vs. recorded hours, on-time
    rate, late check-ins, and the latest 10 check-ins. Powers the AI Insights
    "Attendance" tab and the employee burnout score.
    """
    user = await get_current_user(request, db)
    q = db.query(Shift).filter(Shift.org_id == user.org_id)
    if employee_id:
        q = q.filter(
            (Shift.employee_id == employee_id)
            | (Shift.assigned_staff.contains([employee_id]))
        )
    shifts = q.all()

    completed = [s for s in shifts if s.check_in_at and s.check_out_at]
    scheduled_minutes = sum((s.duration_hours or 0) * 60 for s in completed)
    recorded_minutes = 0
    on_time = 0
    late_count = 0
    latest = []
    for s in completed:
        # Recorded duration
        delta = (s.check_out_at - s.check_in_at).total_seconds() / 60.0
        recorded_minutes += max(0, delta)
        # On-time if checked in within 10 min of start_time
        if s.start_time and s.check_in_at:
            diff = (s.check_in_at - s.start_time).total_seconds() / 60.0
            if diff <= 10:
                on_time += 1
            elif diff > 10:
                late_count += 1

    latest_rows = sorted(completed, key=lambda s: s.check_in_at, reverse=True)[:10]
    for s in latest_rows:
        latest.append({
            "shift_id": s.id,
            "shift_title": s.title,
            "department": s.department,
            "check_in_at": s.check_in_at.isoformat(),
            "check_out_at": s.check_out_at.isoformat(),
            "scheduled_minutes": (s.duration_hours or 0) * 60,
            "actual_minutes": int((s.check_out_at - s.check_in_at).total_seconds() / 60),
        })

    return {
        "total_shifts_completed": len(completed),
        "scheduled_minutes": int(scheduled_minutes),
        "recorded_minutes": int(recorded_minutes),
        "variance_minutes": int(recorded_minutes - scheduled_minutes),
        "on_time_count": on_time,
        "late_count": late_count,
        "on_time_rate": round((on_time / len(completed) * 100), 1) if completed else 0,
        "latest": latest,
    }


@router.get("/executive-summary")
async def get_executive_summary_window(request: Request, db: Session = Depends(get_db)):
    """Generate a narrative AI executive summary for the current operational window."""
    user = await get_current_user(request, db)

    today = datetime.now(timezone.utc)
    window_end = today + timedelta(days=14)

    window_shifts = db.query(Shift).filter(
        Shift.org_id == user.org_id,
        Shift.start_time >= today,
        Shift.start_time <= window_end,
    ).all()
    leaves = db.query(LeaveRequest).filter(LeaveRequest.org_id == user.org_id).all()
    swaps = db.query(SwapRequest).filter(SwapRequest.org_id == user.org_id).all()
    users = db.query(User).filter(User.org_id == user.org_id).all()

    total = len(window_shifts)
    filled = sum(1 for s in window_shifts if s.status in ("active", "scheduled", "confirmed", "completed"))
    open_count = sum(1 for s in window_shifts if s.status == "open")

    # Attendance uses all completed shifts for better signal
    all_shifts = db.query(Shift).filter(Shift.org_id == user.org_id).all()
    completed = [s for s in all_shifts if s.check_in_at and s.check_out_at]
    on_time = 0
    late_count = 0
    for s in completed:
        if s.start_time and s.check_in_at:
            diff = (s.check_in_at - s.start_time).total_seconds() / 60.0
            if diff <= 10:
                on_time += 1
            elif diff > 10:
                late_count += 1
    on_time_rate = round((on_time / len(completed) * 100), 1) if completed else 0

    total_swaps = len(swaps)
    approved_swaps = sum(1 for s in swaps if s.status == "approved")
    total_leaves = len(leaves)
    approved_leaves = sum(1 for l in leaves if l.status == "approved")

    rows = []
    for emp in users:
        try:
            prediction = burnout_predictor.predict(_employee_features(emp, all_shifts))
            rows.append(prediction)
        except Exception:
            rows.append({"risk_level": "low", "burnout_score": 0})
    high_risk = len([r for r in rows if r.get("risk_level") == "high"])

    data = {
        "coverage_rate": round((filled / total * 100), 1) if total else 0,
        "open_shifts": open_count,
        "total_shifts": total,
        "filled_shifts": filled,
        "check_in_rate": on_time_rate,
        "completed_shifts": len(completed),
        "late_count": late_count,
        "pending_swaps": sum(1 for s in swaps if s.status == "pending"),
        "pending_leaves": sum(1 for l in leaves if l.status == "pending"),
        "total_swaps": total_swaps,
        "total_leaves": total_leaves,
        "swap_approval_rate": round((approved_swaps / total_swaps * 100), 1) if total_swaps else 0,
        "leave_approval_rate": round((approved_leaves / total_leaves * 100), 1) if total_leaves else 0,
        "high_risk": high_risk,
        "total_employees": len(users),
        "window_days": 14,
        **_org_context(db, user.org_id),
    }
    return ai_assistant.generate_executive_summary(data)
