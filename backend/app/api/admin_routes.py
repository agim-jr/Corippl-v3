# backend/app/api/admin_routes.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..utils.dependencies import get_current_user
from ..tasks.collective_scheduler import CollectiveScheduler

router = APIRouter(prefix="/admin", tags=["Admin"])


def get_scheduler() -> CollectiveScheduler:
    """Get scheduler instance."""
    return CollectiveScheduler()


def require_admin(current_user: User = Depends(get_current_user)):
    """Ensure user is an admin."""
    if not getattr(current_user, 'is_admin', False):
        raise HTTPException(403, "Admin access required")
    return current_user


@router.post("/tasks/autopilot")
def trigger_autopilot(
    admin: User = Depends(require_admin),
    scheduler: CollectiveScheduler = Depends(get_scheduler)
):
    """Manually trigger autopilot execution."""
    try:
        results = scheduler.run_daily_autopilot()
        return {
            "success": True,
            "message": "Autopilot executed",
            "users_processed": len(results),
            "successful": sum(1 for r in results if r.get("success"))
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to run autopilot: {str(e)}")


@router.post("/tasks/check-missed")
def trigger_missed_check(
    admin: User = Depends(require_admin),
    scheduler: CollectiveScheduler = Depends(get_scheduler)
):
    """Manually trigger missed share check."""
    try:
        results = scheduler.check_missed_shares()
        return {
            "success": True,
            "message": "Missed shares checked",
            "shares_processed": len(results)
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to check missed shares: {str(e)}")


@router.post("/tasks/reminders")
def trigger_reminders(
    admin: User = Depends(require_admin),
    scheduler: CollectiveScheduler = Depends(get_scheduler)
):
    """Manually trigger daily reminders."""
    try:
        results = scheduler.send_daily_reminders()
        return {
            "success": True,
            "message": "Reminders sent",
            **results
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to send reminders: {str(e)}")


@router.post("/tasks/optimize-schedules")
def trigger_schedule_optimization(
    admin: User = Depends(require_admin),
    scheduler: CollectiveScheduler = Depends(get_scheduler)
):
    """Manually trigger schedule optimization."""
    try:
        results = scheduler.optimize_group_schedules()
        return {
            "success": True,
            "message": "Schedules optimized",
            **results
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to optimize schedules: {str(e)}")


@router.post("/tasks/health-check")
def trigger_health_analysis(
    admin: User = Depends(require_admin),
    scheduler: CollectiveScheduler = Depends(get_scheduler)
):
    """Manually trigger group health analysis."""
    try:
        results = scheduler.analyze_group_health()
        return {
            "success": True,
            "message": "Health analyzed",
            "groups_analyzed": len(results)
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to analyze health: {str(e)}")


@router.post("/tasks/weekly-reports")
def trigger_weekly_reports(
    admin: User = Depends(require_admin),
    scheduler: CollectiveScheduler = Depends(get_scheduler)
):
    """Manually trigger weekly report generation."""
    try:
        results = scheduler.generate_weekly_reports()
        return {
            "success": True,
            "message": "Reports generated",
            "reports_count": len(results)
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to generate reports: {str(e)}")
