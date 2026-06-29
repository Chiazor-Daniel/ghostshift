"""
Analytics Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from config.database import get_db
from middleware.auth import get_current_user
from models.user import User
from ai_ml.burnout import burnout_predictor
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/burnout")
async def get_burnout_analytics(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    employee_id: str = None
):
    """Get burnout analytics for employees"""
    query = db.query(User).filter(User.org_id == current_user.org_id)
    
    if employee_id:
        query = query.filter(User.id == employee_id)
    
    employees = query.all()
    
    burnout_data = []
    for employee in employees:
        # Prepare employee data for prediction
        employee_data = {
            "hours_worked_week": employee.weekly_hours_this_week,
            "hours_worked_month": employee.weekly_hours_this_week * 4,
            "overtime_hours": 0,  # Would need to calculate from shifts
            "consecutive_shifts": 0,
            "shifts_per_week": 5,
            "days_since_rest": 1,
            "age": 30,  # Would need to store age
            "tenure_months": 12,
            "night_shifts": 0,
            "weekend_shifts": 0,
            "leave_used": 0,
            "leave_remaining": 0,
            "rating": employee.rating,
            "coverage_gap_count": 0,
            "swap_requests": 0,
            "shift_changes": 0
        }
        
        prediction = burnout_predictor.predict(employee_data)
        
        burnout_data.append({
            "employee_id": employee.id,
            "employee_name": employee.name,
            "burnout_score": prediction["burnout_score"],
            "risk_level": prediction["risk_level"],
            "recommendations": prediction.get("recommendations", [])
        })
    
    return {
        "total_employees": len(burnout_data),
        "high_risk": len([e for e in burnout_data if e["risk_level"] == "high"]),
        "moderate_risk": len([e for e in burnout_data if e["risk_level"] == "moderate"]),
        "low_risk": len([e for e in burnout_data if e["risk_level"] == "low"]),
        "employees": burnout_data
    }


@router.get("/coverage")
async def get_coverage_analytics(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    department_id: str = None,
    date: str = None
):
    """Get coverage analytics"""
    # Calculate coverage gaps
    return {
        "total_shifts": 0,
        "filled_shifts": 0,
        "coverage_gap": 0,
        "coverage_rate": 0
    }


@router.get("/staffing")
async def get_staffing_analytics(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get staffing analytics"""
    return {
        "total_employees": 0,
        "active_employees": 0,
        "on_leave": 0,
        "departments": []
    }


@router.get("/reports")
async def get_reports(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    report_type: str = None,
    start_date: str = None,
    end_date: str = None
):
    """Generate reports"""
    return {
        "report_type": report_type,
        "generated_at": datetime.utcnow().isoformat(),
        "data": []
    }
