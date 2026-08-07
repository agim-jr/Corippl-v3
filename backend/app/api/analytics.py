from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Union
import logging
from ..services.analytics_service import calculate_stats, get_content_analytics, get_user_analytics
from ..database import get_db
from ..models.schemas import UserAnalyticsSchema
from ..utils.dependencies import get_current_user
from ..models.user import User

logger = logging.getLogger(__name__)  # ✅ ADD THIS LINE


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
    responses={404: {"description": "Not found"}},
)

@router.get("/stats", response_model=Dict[str, float])
def get_stats(db: Session = Depends(get_db)):
    """
    Retrieves aggregated statistics for the SocialProof component.
    """
    try:
        stats = calculate_stats(db)
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/", response_model=Dict[int, Dict[str, Any]])
def get_content_analytics_endpoint(
    content_analytics_request: Dict[str, List[int]],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get analytics for specified content IDs.

    Free users: Basic metrics (views, shares) only
    Premium/AI users: Basic metrics + trackable link analytics
    """
    content_ids = content_analytics_request.get("content_ids", [])
    if not content_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No content IDs provided."
        )

    try:
        # Get full analytics from database
        full_analytics = get_content_analytics(db, current_user, content_ids)

        # FREE USERS: Remove all link-tracking related metrics
        if not current_user.has_premium_access:
            basic_analytics = {}
            for content_id, data in full_analytics.items():
                basic_analytics[content_id] = {
                    # ✅ Basic content metrics (available to free users)
                    "id": data.get("id"),
                    "views": data.get("views", 0),
                    "shares": data.get("shares", 0),
                    "share_count": data.get("share_count", 0),
                    "view_count": data.get("view_count", 0),

                    # ✅ Content metadata
                    "title": data.get("title", ""),
                    "content_type": data.get("content_type", ""),
                    "required_shares": data.get("required_shares"),
                    "status": data.get("status", ""),
                    "created_at": data.get("created_at"),

                    # ✅ Completion tracking (not link-related)
                    "completion_rate": data.get("completion_rate", 0.0),

                    # 🔒 Premium features locked (return None, not 0)
                    "short_link_clicks": None,
                    "conversions_count": None,
                    "click_through_rate": None,
                    "conversion_rate": None,
                    "engagement_score": None,
                    "performance_score": None,
                }
            return basic_analytics

        # PREMIUM/AI USERS: Return everything including link analytics
        return full_analytics

    except Exception as e:
        logger.error(f"Error fetching analytics for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve analytics"
        )

@router.get("/user/{user_id}", response_model=UserAnalyticsSchema)
def get_user_analytics_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve analytics data for the specified user.
    """
    analytics = get_user_analytics(db, user_id)
    if not analytics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analytics data not found for this user."
        )
    return analytics

@router.get("/ai-automation-stats")
def get_automation_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get AI automation statistics for current user.
    Shows breakdown of AI-automated vs manual shares.
    """
    try:
        from ..services.analytics_service import get_ai_automation_stats

        stats = get_ai_automation_stats(db, current_user.id)

        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        logger.error(f"Error fetching AI automation stats for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve AI automation statistics"
        )
