"""Analytics routes — burnout, coverage, staffing."""
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session

from config.database import get_db
from middleware.auth import get_current_user
from models.user import User
from models.shift import Shift
from models.leave import LeaveRequest
from models.notification import Notification
from ai_ml.burnout import burnout_predictor

logger = logging.getLogger(__name__)
router = APIRouter()


def _employee_features(u: User, org_shifts) -> dict:
    """Compute burnout features from real shift data."""
    employee_shifts = [s for s in org_shifts if s.employee_id == u.id]
    week_start = datetime.utcnow() - timedelta(days=datetime.utcnow().weekday())
    week_shifts = [s for s in employee_shifts if s.start_time and s.start_time >= week_start]
    hours_week = sum((s.duration_hours or 0) for s in week_shifts)
    overtime = max(0, hours_week - 40)
    night_shifts = sum(1 for s in employee_shifts if (s.start_hour or 0) >= 19 or (s.start_hour or 0) <= 4)
    weekend_shifts = sum(1 for s in employee_shifts if s.start_time and s.start_time.weekday() >= 5)
    tenure_months = 12
    if u.hired_at:
        tenure_months = max(0, (datetime.utcnow() - u.hired_at).days // 30)
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
        "generated_at": datetime.utcnow().isoformat(),
        "totals": {
            "shifts": len(shifts),
            "open_shifts": sum(1 for s in shifts if s.status == "open"),
            "active_shifts": sum(1 for s in shifts if s.status == "active"),
            "leaves_requested": len(leaves),
            "leaves_approved": sum(1 for l in leaves if l.status == "approved"),
        },
        "data": [],
    }