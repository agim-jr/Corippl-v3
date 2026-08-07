from sqlalchemy.orm import Session
from ..models.user import User
from ..models.content import Content
from ..models.conversion import Conversion
from sqlalchemy import func
from typing import Dict, List, Optional, Any
from ..models.analytics import UserAnalytics
from datetime import datetime, timedelta  # ✅ ADD THIS LINE
import logging


logger = logging.getLogger(__name__)


def calculate_stats(db: Session) -> Dict[str, float]:
    """
    Calculates aggregated statistics with proper error handling:
    1. Total Users
    2. Total Content Shares
    3. Average Shares per User
    4. Successful Cross-Promotions
    """
    try:
        # 1. Total Users
        total_users = db.query(func.count(User.id)).scalar() or 0

        # 2. Total Content Shares - handle None values properly
        total_content_shares_result = db.query(func.sum(Content.share_count)).scalar()
        total_content_shares = total_content_shares_result if total_content_shares_result is not None else 0

        # 3. Average Shares per User
        average_shares_per_user = (total_content_shares / total_users) if total_users > 0 else 0

        # 4. Successful Cross-Promotions
        # Use COALESCE to handle None values in the comparison
        successful_cross_promotions = db.query(func.count(Content.id))\
            .filter(
                func.coalesce(Content.share_count, 0) >= func.coalesce(Content.required_shares, 5)
            ).scalar() or 0

        stats = {
            "total_users": int(total_users),
            "total_content_shares": int(total_content_shares),
            "average_shares_per_user": round(float(average_shares_per_user), 2),
            "successful_cross_promotions": int(successful_cross_promotions)
        }

        logger.info(f"Successfully calculated stats: {stats}")
        return stats

    except Exception as e:
        db.rollback()
        logger.error(f"Error calculating stats: {str(e)}")
        # Return default stats instead of raising the exception
        return {
            "total_users": 0,
            "total_content_shares": 0,
            "average_shares_per_user": 0.0,
            "successful_cross_promotions": 0
        }


def get_content_analytics(db: Session, user: User, content_ids: List[int]) -> Dict[int, Dict[str, Any]]:
    """
    Enhanced analytics function that returns comprehensive data for frontend consumption.
    Now includes all fields needed by the AnalyticsTab component.
    Premium users (AI tier and Premium tier) get all metrics.
    """
    analytics = {}
    is_premium = user.has_premium_access  # ✅ Check if user has premium or AI tier access


    try:
        # Fetch contents ensuring they belong to the user
        contents = db.query(Content).filter(Content.id.in_(content_ids), Content.user_id == user.id).all()

        # ✅ SOLUTION: Bulk load all data in 2 queries instead of N queries

        # Single query to get all conversion counts
        conversion_counts = dict(
            db.query(Conversion.content_id, func.count(Conversion.id))
            .filter(Conversion.content_id.in_(content_ids))
            .group_by(Conversion.content_id)
            .all()
        )

        # Single query to get all link clicks
        link_clicks = dict(
            db.query(Link.content_id, func.sum(Link.click_count))
            .filter(Link.content_id.in_(content_ids))
            .group_by(Link.content_id)
            .all()
        )

        for content in contents:
            try:
                # ✅ Look up in pre-loaded dictionary (no query!)
                conversions_count = conversion_counts.get(content.id, 0)
                total_clicks = link_clicks.get(content.id, 0) or 0

# Build comprehensive analytics data - ensure all values are properly typed
                analytics[content.id] = {
                    # Core metrics (integers)
                    "views": int(content.view_count or 0),
                    "shares": int(content.share_count or 0),
                    "short_link_clicks": int(total_clicks),
                    "conversions_count": int(conversions_count),

                    # Frontend compatibility fields (integers)
                    "share_count": int(content.share_count or 0),
                    "view_count": int(content.view_count or 0),

                    # Content metadata (strings)
                    "title": str(content.title or "Untitled"),
                    "content_type": str(content.content_type.value if content.content_type else "unknown"),
                    "required_shares": int(content.required_shares or 5),
                    "status": str(content.status or "unknown"),

                    # Timestamps (strings)
                    "created_at": content.created_at.isoformat() if content.created_at else None,

                    # ✅ ADD CONTENT ID
                    "id": int(content.id),

# Calculated metrics (floats)
                    "completion_rate": float(
                        (content.share_count or 0) / (content.required_shares or 5) * 100
                    ) if (content.required_shares or 5) > 0 else 0.0,
                }

                # ✅ ADD PREMIUM-ONLY METRICS
                if is_premium:
                    analytics[content.id].update({
                        # Click-through rate (clicks per view) - PREMIUM ONLY
                        "click_through_rate": float(
                            (total_clicks / (content.view_count or 1)) * 100
                        ) if (content.view_count or 0) > 0 else 0.0,

                        # Conversion rate (conversions per click) - PREMIUM ONLY
                        "conversion_rate": float(
                            (conversions_count / total_clicks * 100)
                        ) if total_clicks > 0 else 0.0,

                        # Engagement score - PREMIUM ONLY
                        "engagement_score": float(
                            ((content.share_count or 0) * 3 + total_clicks * 2 + (content.view_count or 0)) /
                            max((content.view_count or 1), 1)
                        ),

                        # Performance score - PREMIUM ONLY
                        "performance_score": float(calculate_performance_score(
                            int(content.share_count or 0),
                            int(content.view_count or 0),
                            int(total_clicks),
                            int(conversions_count)
                        ))
                    })
                else:
                    # ✅ FREE USERS GET PLACEHOLDER VALUES
                    analytics[content.id].update({
                        "click_through_rate": None,
                        "conversion_rate": None,
                        "engagement_score": None,
                        "performance_score": None
                    })
            except Exception as e:
                logger.error(f"Error processing content {content.id}: {str(e)}")
                # Add basic data for this content to avoid breaking the response
                analytics[content.id] = {
                    "views": 0,
                    "shares": 0,
                    "short_link_clicks": 0,
                    "conversions_count": 0,
                    "share_count": 0,
                    "view_count": 0,
                    "title": "Error loading content",
                    "content_type": "unknown",
                    "required_shares": 5,
                    "status": "error",
                    "created_at": None,
                    "completion_rate": 0.0,
                    "performance_score": 0.0
                }

        logger.info(f"Generated analytics for {len(analytics)} content items for user {user.username}")
        return analytics

    except Exception as e:
        logger.error(f"Error in get_content_analytics for user {user.username}: {str(e)}")
        return {}


def calculate_performance_score(shares: int, views: int, clicks: int, conversions: int) -> float:
    """
    Calculate a performance score based on various metrics.
    This helps with sorting and ranking content performance.
    """
    try:
        # Weighted scoring system
        score = (
            shares * 10 +           # Shares are most valuable
            clicks * 5 +            # Clicks are valuable
            conversions * 15 +      # Conversions are highly valuable
            views * 1               # Views have base value
        )

        # Normalize to 0-100 scale (adjust divisor based on your typical values)
        normalized_score = min(score / 10, 100)
        return round(normalized_score, 2)
    except Exception as e:
        logger.error(f"Error calculating performance score: {str(e)}")
        return 0.0


def get_enhanced_content_analytics(
    db: Session,
    user: User,
    content_ids: List[int],
    include_metadata: bool = True
) -> Dict[int, Dict[str, Any]]:
    """
    Enhanced version with optional metadata inclusion for performance.
    """
    if include_metadata:
        return get_content_analytics(db, user, content_ids)

    # Lightweight version for basic analytics
    analytics = {}
    try:
        contents = db.query(Content).filter(Content.id.in_(content_ids), Content.user_id == user.id).all()

        for content in contents:
            analytics[content.id] = {
                "shares": content.share_count or 0,
                "views": content.view_count or 0,
                "short_link_clicks": sum(link.click_count or 0 for link in content.links) if hasattr(content, 'links') and content.links else 0,
            }
    except Exception as e:
        logger.error(f"Error in get_enhanced_content_analytics: {str(e)}")

    return analytics


def get_user_analytics(db: Session, user_id: int) -> Optional[UserAnalytics]:
    try:
        analytics = db.query(UserAnalytics).filter(UserAnalytics.user_id == user_id).first()
        if not analytics:
            analytics = create_user_analytics(db, user_id)
        return analytics
    except Exception as e:
        logger.error(f"Error getting user analytics for user {user_id}: {str(e)}")
        return None


def create_user_analytics(db: Session, user_id: int) -> Optional[UserAnalytics]:
    try:
        analytics = UserAnalytics(user_id=user_id)
        db.add(analytics)
        db.commit()
        db.refresh(analytics)
        return analytics
    except Exception as e:
        logger.error(f"Error creating user analytics for user {user_id}: {str(e)}")
        db.rollback()
        return None


def increment_total_content_shares(db: Session, user_id: int, increment: int = 1):
    try:
        analytics = get_user_analytics(db, user_id)
        if not analytics:
            analytics = create_user_analytics(db, user_id)
        if analytics:
            analytics.total_content_shares += increment
            db.commit()
            db.refresh(analytics)
        return analytics
    except Exception as e:
        logger.error(f"Error incrementing content shares for user {user_id}: {str(e)}")
        db.rollback()
        return None


def increment_successful_cross_promotions(db: Session, user_id: int, increment: int = 1):
    try:
        analytics = get_user_analytics(db, user_id)
        if not analytics:
            analytics = create_user_analytics(db, user_id)
        if analytics:
            analytics.successful_cross_promotions += increment
            db.commit()
            db.refresh(analytics)
        return analytics
    except Exception as e:
        logger.error(f"Error incrementing cross promotions for user {user_id}: {str(e)}")
        db.rollback()
        return None


def get_analytics_summary(db: Session, user: User) -> Dict[str, Any]:
    """
    Get a comprehensive analytics summary for a user's dashboard.
    """
    try:
        user_analytics = get_user_analytics(db, user.id)

        # Get user's content
        user_contents = db.query(Content).filter(Content.user_id == user.id).all()

        if not user_contents:
            return {
                "total_content": 0,
                "total_shares": 0,
                "total_views": 0,
                "total_clicks": 0,
                "completion_rate": 0.0,
                "successful_cross_promotions": 0,
                "performance_trend": "stable"
            }

        content_ids = [content.id for content in user_contents]
        analytics_data = get_content_analytics(db, user, content_ids)

        # Calculate summary metrics
        total_shares = sum(data["shares"] for data in analytics_data.values())
        total_views = sum(data["views"] for data in analytics_data.values())
        total_clicks = sum(data["short_link_clicks"] for data in analytics_data.values())

        completed_content = sum(
            1 for data in analytics_data.values()
            if data["shares"] >= data["required_shares"]
        )

        completion_rate = (completed_content / len(analytics_data)) * 100 if analytics_data else 0

        return {
            "total_content": len(analytics_data),
            "total_shares": total_shares,
            "total_views": total_views,
            "total_clicks": total_clicks,
            "completion_rate": round(completion_rate, 1),
            "successful_cross_promotions": user_analytics.successful_cross_promotions if user_analytics else 0,
            "performance_trend": calculate_performance_trend(analytics_data)
        }
    except Exception as e:
        logger.error(f"Error getting analytics summary for user {user.username}: {str(e)}")
        return {
            "total_content": 0,
            "total_shares": 0,
            "total_views": 0,
            "total_clicks": 0,
            "completion_rate": 0.0,
            "successful_cross_promotions": 0,
            "performance_trend": "stable"
        }


def calculate_performance_trend(analytics_data: Dict[int, Dict[str, Any]]) -> str:
    """
    Calculate performance trend based on recent activity.
    """
    try:
        if not analytics_data:
            return "stable"

        # Simple trend calculation based on performance scores
        scores = [data.get("performance_score", 0) for data in analytics_data.values()]
        avg_score = sum(scores) / len(scores) if scores else 0

        if avg_score > 75:
            return "excellent"
        elif avg_score > 50:
            return "good"
        elif avg_score > 25:
            return "improving"
        else:
            return "needs_attention"
    except Exception as e:
        logger.error(f"Error calculating performance trend: {str(e)}")
        return "stable"


def get_content_analytics_batch(
    db: Session,
    user: User,
    limit: int = 50,
    offset: int = 0
) -> Dict[str, Any]:
    """
    Get analytics for user's content with pagination support.
    """
    try:
        # Get user's content with pagination
        contents = db.query(Content).filter(
            Content.user_id == user.id
        ).offset(offset).limit(limit).all()

        if not contents:
            return {
                "analytics": {},
                "summary": get_analytics_summary(db, user),
                "has_more": False,
                "total_count": 0
            }

        content_ids = [content.id for content in contents]
        analytics_data = get_content_analytics(db, user, content_ids)

        # Check if there are more contents
        total_count = db.query(func.count(Content.id)).filter(Content.user_id == user.id).scalar()
        has_more = (offset + limit) < total_count

        return {
            "analytics": analytics_data,
            "summary": get_analytics_summary(db, user),
            "has_more": has_more,
            "total_count": total_count
        }
    except Exception as e:
        logger.error(f"Error getting content analytics batch for user {user.username}: {str(e)}")
        return {
            "analytics": {},
            "summary": get_analytics_summary(db, user),
            "has_more": False,
            "total_count": 0
        }

def get_ai_automation_stats(db: Session, user_id: int) -> dict:
    """Get statistics on AI-automated vs manual shares"""
    from ..models.content import Share

    try:
        # Total shares by this user
        total_shares = db.query(func.count(Share.id)).filter(
            Share.user_id == user_id
        ).scalar() or 0

        # AI automated shares
        ai_shares = db.query(func.count(Share.id)).filter(
            Share.user_id == user_id,
            Share.is_ai_automated == True
        ).scalar() or 0

        # Manual shares
        manual_shares = total_shares - ai_shares

        # Calculate percentage
        ai_percentage = (ai_shares / total_shares * 100) if total_shares > 0 else 0

        # Get recent shares (last 7 days)
        from datetime import timedelta
        seven_days_ago = datetime.utcnow() - timedelta(days=7)

        recent_total = db.query(func.count(Share.id)).filter(
            Share.user_id == user_id,
            Share.created_at >= seven_days_ago
        ).scalar() or 0

        recent_ai = db.query(func.count(Share.id)).filter(
            Share.user_id == user_id,
            Share.is_ai_automated == True,
            Share.created_at >= seven_days_ago
        ).scalar() or 0

        return {
            "total_shares": total_shares,
            "ai_automated_shares": ai_shares,
            "manual_shares": manual_shares,
            "automation_percentage": round(ai_percentage, 1),
            "recent_7_days": {
                "total": recent_total,
                "ai_automated": recent_ai,
                "manual": recent_total - recent_ai
            }
        }

    except Exception as e:
        logger.error(f"Error getting AI automation stats: {e}")
        return {
            "total_shares": 0,
            "ai_automated_shares": 0,
            "manual_shares": 0,
            "automation_percentage": 0.0,
            "recent_7_days": {
                "total": 0,
                "ai_automated": 0,
                "manual": 0
            }
        }
