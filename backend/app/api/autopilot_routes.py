# backend/app/api/autopilot_routes.py

"""
Autopilot API Routes

Endpoints for managing autopilot functionality with smart features:
- Content selection preferences
- Rate limiting controls
- Quiet hours configuration
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import date

from ..database import get_db
from ..models.user import User
from ..models.collective import CollectiveSchedule
from ..models.enums import ScheduleStatus
from ..utils.dependencies import get_current_user
from ..services.autopilot_service import AutopilotService

router = APIRouter(prefix="/autopilot", tags=["Autopilot"])


# ============================================================================
# Dependency to get autopilot service with db session
# ============================================================================

def get_autopilot_service(db: Session = Depends(get_db)) -> AutopilotService:
    """Get autopilot service instance with database session."""
    return AutopilotService(db)


# ============================================================================
# Request/Response Models
# ============================================================================

class QuietHoursSettings(BaseModel):
    """Quiet hours configuration."""
    enabled: bool = Field(default=False, description="Enable quiet hours")
    start: int = Field(default=22, ge=0, le=23, description="Start hour (0-23)")
    end: int = Field(default=6, ge=0, le=23, description="End hour (0-23)")


class AutopilotSettings(BaseModel):
    """Autopilot configuration settings."""
    max_daily_shares: Optional[int] = Field(
        default=None,
        ge=1,
        le=20,
        description="Maximum shares per day (1-20)"
    )
    max_hourly_shares: Optional[int] = Field(
        default=None,
        ge=1,
        le=5,
        description="Maximum shares per hour (1-5)"
    )
    quiet_hours: Optional[QuietHoursSettings] = Field(
        default=None,
        description="Quiet hours when autopilot won't share"
    )
    preferred_topics: Optional[List[str]] = Field(
        default=None,
        description="Preferred content topics/categories"
    )
    excluded_topics: Optional[List[str]] = Field(
        default=None,
        description="Topics to avoid"
    )


# ============================================================================
# Routes
# ============================================================================

@router.get("/status")
def get_autopilot_status(
    current_user: User = Depends(get_current_user),
    autopilot_service: AutopilotService = Depends(get_autopilot_service)
):
    """
    Get comprehensive autopilot status for current user.

    Returns:
        - enabled: Whether autopilot is active
        - settings: Current configuration
        - current_state: Real-time status (quiet hours, rate limits)
        - today: Today's share statistics
        - eligibility: Requirements check
        - performance_stats: 30-day performance stats
    """
    try:
        # Get comprehensive status (includes eligibility and stats)
        status = autopilot_service.get_autopilot_status(current_user.id)

        if "error" in status:
            raise HTTPException(500, status["error"])

        return status

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to get autopilot status: {str(e)}")


@router.post("/enable")
def enable_autopilot(
    current_user: User = Depends(get_current_user),
    autopilot_service: AutopilotService = Depends(get_autopilot_service)
):
    """
    Enable autopilot for current user.

    Checks eligibility before enabling:
    - Must be member of active collective group
    - Must have published content
    - Must not have excessive strikes

    Returns initial settings with defaults.
    """
    try:
        result = autopilot_service.enable_autopilot(current_user.id)

        if not result["success"]:
            raise HTTPException(
                400,
                detail={
                    "error": result.get("error", "Failed to enable autopilot"),
                    "reasons": result.get("reasons", [])
                }
            )

        return {
            "success": True,
            "message": "Autopilot enabled successfully",
            "settings": result.get("settings", {})
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to enable autopilot: {str(e)}")


@router.post("/disable")
def disable_autopilot(
    current_user: User = Depends(get_current_user),
    autopilot_service: AutopilotService = Depends(get_autopilot_service)
):
    """
    Disable autopilot for current user.

    Pending shares will remain scheduled but won't execute automatically.
    """
    try:
        result = autopilot_service.disable_autopilot(current_user.id)

        if not result["success"]:
            raise HTTPException(400, result.get("error", "Failed to disable autopilot"))

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to disable autopilot: {str(e)}")


@router.put("/settings")
def update_autopilot_settings(
    settings: AutopilotSettings,
    current_user: User = Depends(get_current_user),
    autopilot_service: AutopilotService = Depends(get_autopilot_service)
):
    """
    Update autopilot configuration settings.

    Settings include:
    - max_daily_shares: Maximum shares per day (1-20)
    - max_hourly_shares: Maximum shares per hour (1-5)
    - quiet_hours: Time periods to pause autopilot
    - preferred_topics: Content topics to prioritize
    - excluded_topics: Topics to avoid

    Only provided fields will be updated.
    """
    try:
        # Convert Pydantic model to dict, excluding None values
        settings_dict = settings.dict(exclude_none=True)

        # Convert nested quiet_hours model to dict if present
        if "quiet_hours" in settings_dict and settings_dict["quiet_hours"]:
            # It's already a dict from Pydantic
            pass

        result = autopilot_service.update_autopilot_settings(
            current_user.id,
            settings_dict
        )

        if not result["success"]:
            raise HTTPException(400, result.get("error", "Failed to update settings"))

        return {
            "success": True,
            "message": "Settings updated successfully",
            "settings": result.get("settings", {})
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to update settings: {str(e)}")


@router.get("/settings")
def get_autopilot_settings(
    current_user: User = Depends(get_current_user),
    autopilot_service: AutopilotService = Depends(get_autopilot_service)
):
    """
    Get current autopilot settings for user.

    Returns all configuration including defaults for unset values.
    """
    try:
        status = autopilot_service.get_autopilot_status(current_user.id)

        if "error" in status:
            raise HTTPException(404, status["error"])

        return {
            "settings": status.get("settings", {}),
            "enabled": status.get("enabled", False)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to get settings: {str(e)}")


@router.get("/stats")
def get_autopilot_stats(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    autopilot_service: AutopilotService = Depends(get_autopilot_service)
):
    """
    Get autopilot performance statistics.

    Query Parameters:
        days: Number of days to look back (default: 30, max: 365)

    Returns:
        - total_scheduled: Total shares scheduled
        - completed: Successfully completed shares
        - pending: Upcoming scheduled shares
        - missed: Shares that weren't completed
        - completion_rate: Percentage of completed shares
    """
    try:
        # Validate days parameter
        if days < 1 or days > 365:
            raise HTTPException(400, "Days must be between 1 and 365")

        stats = autopilot_service.get_autopilot_stats(
            current_user.id,
            days=days
        )

        if "error" in stats:
            raise HTTPException(500, stats["error"])

        return stats

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to get autopilot stats: {str(e)}")


@router.post("/test")
def test_autopilot(
    max_shares: int = 5,
    current_user: User = Depends(get_current_user),
    autopilot_service: AutopilotService = Depends(get_autopilot_service)
):
    """
    Test autopilot execution immediately.

    Executes pending shares right away without waiting for scheduled time.
    Useful for testing configuration before fully enabling autopilot.

    Respects:
    - Rate limits
    - Quiet hours
    - Content selection preferences

    Query Parameters:
        max_shares: Maximum shares to execute (default: 5, max: 10)
    """
    try:
        # Validate max_shares
        if max_shares < 1 or max_shares > 10:
            raise HTTPException(400, "max_shares must be between 1 and 10")

        # Check if user has autopilot enabled
        if not getattr(current_user, 'autopilot_enabled', False):
            raise HTTPException(
                400,
                "Autopilot must be enabled to test. Enable it first with POST /autopilot/enable"
            )

        result = autopilot_service.execute_autopilot_shares(
            current_user.id,
            max_shares=max_shares
        )

        return {
            **result,
            "test_mode": True,
            "message": "Test execution completed"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to test autopilot: {str(e)}")


@router.get("/eligibility")
def check_autopilot_eligibility(
    current_user: User = Depends(get_current_user),
    autopilot_service: AutopilotService = Depends(get_autopilot_service)
):
    """
    Check if user is eligible to enable autopilot.

    Requirements:
    - Active membership in at least one collective group
    - Published content available to share
    - No excessive strikes (< 3 per group)

    Returns detailed eligibility status with reasons if not eligible.
    """
    try:
        eligibility = autopilot_service.validate_autopilot_eligibility(
            current_user.id
        )

        return eligibility

    except Exception as e:
        raise HTTPException(500, f"Failed to check eligibility: {str(e)}")


@router.get("/next-share")
def get_next_scheduled_share(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    autopilot_service: AutopilotService = Depends(get_autopilot_service)
):
    """
    Get information about the next scheduled autopilot share.

    Returns:
        - next_share_date: When next share is scheduled
        - will_execute: Whether autopilot will execute it
        - blocked_reason: Why it won't execute (if applicable)
        - target_user: Who will be shared
    """
    try:
        # ✅ Get next pending share with correct field names
        next_share = db.query(CollectiveSchedule).filter(
            CollectiveSchedule.sharer_id == current_user.id,
            CollectiveSchedule.status == ScheduleStatus.PENDING,
            CollectiveSchedule.scheduled_date >= date.today()
        ).order_by(CollectiveSchedule.scheduled_date).first()

        if not next_share:
            return {
                "has_next_share": False,
                "message": "No upcoming scheduled shares"
            }

        # Check if it will execute
        autopilot_enabled = getattr(current_user, 'autopilot_enabled', False)

        blocked_reasons = []
        if not autopilot_enabled:
            blocked_reasons.append("Autopilot is disabled")

        # Check rate limits for that day
        can_share, rate_msg = autopilot_service._check_rate_limits(
            current_user.id,
            current_user
        )
        if not can_share:
            blocked_reasons.append(rate_msg)

        return {
            "has_next_share": True,
            "next_share": {
                "id": next_share.id,
                "date": next_share.scheduled_date.isoformat(),
                "target_user_id": next_share.target_user_id,
                "group_id": next_share.group_id
            },
            "will_execute": autopilot_enabled and len(blocked_reasons) == 0,
            "blocked_reasons": blocked_reasons if blocked_reasons else None
        }

    except Exception as e:
        raise HTTPException(500, f"Failed to get next share: {str(e)}")


# ============================================================================
# Admin/Debug Routes (Optional - remove in production)
# ============================================================================

@router.post("/force-execute/{user_id}")
def force_execute_autopilot(
    user_id: int,
    max_shares: int = 10,
    current_user: User = Depends(get_current_user),
    autopilot_service: AutopilotService = Depends(get_autopilot_service)
):
    """
    Force execute autopilot for any user (admin only).

    WARNING: This bypasses all checks including:
    - Quiet hours
    - Rate limits
    - Autopilot enabled status

    Use only for debugging or emergency interventions.
    """
    # TODO: Add admin permission check
    # if not current_user.is_admin:
    #     raise HTTPException(403, "Admin access required")

    try:
        result = autopilot_service.execute_autopilot_shares(
            user_id,
            max_shares=max_shares
        )

        return {
            **result,
            "forced": True,
            "executed_by": current_user.id
        }

    except Exception as e:
        raise HTTPException(500, f"Failed to force execute: {str(e)}")


# ============================================================================
# Alternative API Router (for /api/reciprocal-ai/autopilot/* paths)
# ============================================================================

api_router = APIRouter(prefix="/api/reciprocal-ai/autopilot", tags=["Autopilot"])

@api_router.get("/settings")
def get_autopilot_settings_api(
    current_user: User = Depends(get_current_user),
    autopilot_service: AutopilotService = Depends(get_autopilot_service)
):
    """
    Get current autopilot settings for user (API path).
    """
    try:
        status = autopilot_service.get_autopilot_status(current_user.id)

        if "error" in status:
            raise HTTPException(404, status["error"])

        return {
            "settings": status.get("settings", {}),
            "enabled": status.get("enabled", False)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to get settings: {str(e)}")
