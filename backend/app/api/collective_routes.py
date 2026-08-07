# backend/app/api/collective_routes.py

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta
import logging

from ..database import get_db
from ..models.user import User
from ..models.profile import Profile
from ..utils.tier_limits import get_tier_limits
from ..models.collective import CollectiveMembership, CollectiveGroup, CollectiveSchedule, CollectiveShare, CollectiveActivityLog
from ..models.schemas import (
    CollectiveGroupCreate,
    CollectiveGroupResponse,
    CollectiveMembershipResponse,
    CollectiveShareCreate,
    CollectiveShareResponse,
    CollectiveDashboardResponse,
    CollectiveGroupDetailResponse,
    CollectiveMatchingRequest,
    CollectiveMatchResponse,
    MemberWithUser,
    ScheduleWithUser,
    ShareWithDetails,
    CollectiveActivityResponse
)
from ..services.collective_service import CollectiveService
from ..utils.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/collectives", tags=["Creator Collectives"])


# ==================== GROUP ENDPOINTS ====================

@router.post("/groups", response_model=CollectiveGroupResponse)
def create_collective_group(
    group_data: CollectiveGroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new Creator Collective group with tier limits."""
    # Check tier limits
    user_tier = current_user.subscription_tier
    limits = get_tier_limits(user_tier)

    # Check if user can create groups
    max_create = limits['max_groups_create']
    if max_create == 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                'error': 'Cannot create groups',
                'tier': user_tier,
                'upgrade_message': 'Upgrade to Pro to create collectives'
            }
        )

    if max_create > 0:  # Not unlimited
        created_groups = db.query(CollectiveMembership).filter(
            CollectiveMembership.user_id == current_user.id,
            CollectiveMembership.is_admin == True
        ).count()

        if created_groups >= max_create:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    'error': 'Maximum groups created',
                    'current': created_groups,
                    'limit': max_create,
                    'upgrade_message': 'Upgrade to Pro for unlimited group creation'
                }
            )

    try:
        group = CollectiveService.create_group(
            db=db,
            creator_user_id=current_user.id,
            group_data=group_data.dict()
        )

        member_count = db.query(CollectiveMembership).filter(
            CollectiveMembership.group_id == group.id
        ).count()

        return CollectiveGroupResponse(
            id=group.id,
            name=group.name,
            description=group.description,
            niche=group.niche,
            status=group.status,
            min_members=group.min_members,
            max_members=group.max_members,
            current_member_count=member_count,
            follower_range_min=group.follower_range_min,
            follower_range_max=group.follower_range_max,
            shares_per_week=group.shares_per_week,
            created_at=group.created_at,
            last_active=group.last_active
        )
    except Exception as e:
        logger.error(f"Error creating collective: {e}")
        raise HTTPException(500, f"Failed to create collective: {str(e)}")


@router.get("/groups", response_model=List[CollectiveGroupResponse])
def list_collective_groups(
    niche: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List available collective groups."""
    query = db.query(CollectiveGroup)

    if niche:
        query = query.filter(CollectiveGroup.niche == niche)
    if status:
        query = query.filter(CollectiveGroup.status == status)

    groups = query.order_by(CollectiveGroup.created_at.desc()).limit(50).all()

    results = []
    for group in groups:
        member_count = db.query(CollectiveMembership).filter(
            CollectiveMembership.group_id == group.id
        ).count()

        results.append(CollectiveGroupResponse(
            id=group.id,
            name=group.name,
            description=group.description,
            niche=group.niche,
            status=group.status,
            min_members=group.min_members,
            max_members=group.max_members,
            current_member_count=member_count,
            follower_range_min=group.follower_range_min,
            follower_range_max=group.follower_range_max,
            shares_per_week=group.shares_per_week,
            created_at=group.created_at,
            last_active=group.last_active
        ))

    return results


@router.get("/groups/{group_id}", response_model=CollectiveGroupDetailResponse)
def get_collective_group_details(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about a specific collective group."""
    group = db.query(CollectiveGroup).filter(CollectiveGroup.id == group_id).first()
    if not group:
        raise HTTPException(404, "Group not found")

    # Get members
    memberships = db.query(CollectiveMembership, User, Profile).join(
        User, CollectiveMembership.user_id == User.id
    ).outerjoin(
        Profile, User.id == Profile.user_id
    ).filter(
        CollectiveMembership.group_id == group_id
    ).all()

    members = [
        MemberWithUser(
            id=m.id,
            user_id=m.user_id,
            group_id=m.group_id,
            status=m.status,
            strike_count=m.strike_count,
            shares_completed=m.shares_completed,
            shares_missed=m.shares_missed,
            total_clicks_generated=m.total_clicks_generated,
            average_engagement_rate=m.average_engagement_rate,
            quality_score=m.quality_score,
            reliability_score=m.reliability_score,
            is_admin=m.is_admin,
            joined_at=m.joined_at,
            last_share_date=m.last_share_date,
            username=u.username,
            email=u.email,
            profile_name=p.name if p else None
        )
        for m, u, p in memberships
    ]

    # Get schedule
    today = date.today()
    schedules = db.query(CollectiveSchedule, User, Profile).join(
        User, CollectiveSchedule.user_id == User.id
    ).outerjoin(
        Profile, User.id == Profile.user_id
    ).filter(
        CollectiveSchedule.group_id == group_id,
        CollectiveSchedule.scheduled_date >= today
    ).order_by(CollectiveSchedule.scheduled_date).limit(7).all()

    schedule = [
        ScheduleWithUser(
            id=s.id,
            group_id=s.group_id,
            user_id=s.user_id,
            share_date=s.scheduled_date,
            day_of_week=s.day_of_week,
            is_completed=s.is_completed,
            completion_rate=s.completion_rate,
            reminder_sent=s.reminder_sent,
            username=u.username,
            profile_name=p.name if p else None
        )
        for s, u, p in schedules
    ]

    # Get recent shares
    from ..models.content import Content
    recent_shares_query = db.query(
        CollectiveShare,
        User.username.label("sharer_username"),
        User.username.label("recipient_username"),
        Content.title.label("content_title"),
        Content.url.label("content_url")
    ).join(
        CollectiveMembership,
        CollectiveShare.sharer_id == CollectiveMembership.id
    ).join(
        User,
        CollectiveMembership.user_id == User.id
    ).outerjoin(
        Content,
        CollectiveShare.content_id == Content.id
    ).filter(
        CollectiveShare.group_id == group_id
    ).order_by(
        CollectiveShare.shared_at.desc()
    ).limit(10).all()

    recent_shares = [
        ShareWithDetails(
            id=s.id,
            group_id=s.group_id,
            sharer_id=s.sharer_id,
            recipient_id=s.recipient_id,
            content_id=s.content_id,
            tracking_code=s.tracking_code,
            status=s.status,
            click_count=s.click_count,
            engagement_rate=s.engagement_rate,
            quality_score=s.quality_score,
            due_date=s.due_date,
            shared_at=s.shared_at,
            verified_at=s.verified_at,
            sharer_username=sharer_username,
            recipient_username=recipient_username,
            content_title=content_title,
            content_url=content_url
        )
        for s, sharer_username, recipient_username, content_title, content_url in recent_shares_query
    ]

    # Get stats
    stats = CollectiveService.get_group_stats(db, group_id)

    return CollectiveGroupDetailResponse(
        group=CollectiveGroupResponse(
            id=group.id,
            name=group.name,
            description=group.description,
            niche=group.niche,
            status=group.status,
            min_members=group.min_members,
            max_members=group.max_members,
            current_member_count=len(members),
            follower_range_min=group.follower_range_min,
            follower_range_max=group.follower_range_max,
            shares_per_week=group.shares_per_week,
            created_at=group.created_at,
            last_active=group.last_active
        ),
        members=members,
        schedule=schedule,
        recent_shares=recent_shares,
        group_stats=stats
    )


# ==================== SCHEDULE ENDPOINTS ====================

@router.post("/groups/{group_id}/schedule", response_model=List[ScheduleWithUser])
def create_group_schedule(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a weekly schedule for a group."""
    try:
        schedules = CollectiveService.create_weekly_schedule(db, group_id)

        result = []
        for schedule in schedules:
            user = db.query(User).filter(User.id == schedule.user_id).first()
            profile = db.query(Profile).filter(Profile.user_id == schedule.user_id).first()

            result.append(ScheduleWithUser(
                id=schedule.id,
                group_id=schedule.group_id,
                user_id=schedule.user_id,
                share_date=schedule.scheduled_date,
                day_of_week=schedule.day_of_week,
                is_completed=schedule.is_completed,
                completion_rate=schedule.completion_rate,
                reminder_sent=schedule.reminder_sent,
                username=user.username if user else None,
                profile_name=profile.name if profile else None
            ))

        return result
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.error(f"Error creating schedule: {e}")
        raise HTTPException(500, f"Failed to create schedule: {str(e)}")


# ==================== MEMBERSHIP ENDPOINTS ====================

@router.post("/groups/{group_id}/join", response_model=CollectiveMembershipResponse)
def join_collective_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Join an existing collective group."""
    user_tier = current_user.subscription_tier
    limits = get_tier_limits(user_tier)

    if limits['max_groups_join'] > 0:
        joined_groups = db.query(CollectiveMembership).filter(
            CollectiveMembership.user_id == current_user.id
        ).count()

        if joined_groups >= limits['max_groups_join']:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    'error': 'Maximum groups joined',
                    'current': joined_groups,
                    'limit': limits['max_groups_join'],
                    'upgrade_message': 'Upgrade to Pro to join unlimited groups'
                }
            )

    try:
        membership = CollectiveService.join_group(db, current_user.id, group_id)
        return CollectiveMembershipResponse(
            id=membership.id,
            user_id=membership.user_id,
            group_id=membership.group_id,
            status=membership.status,
            strike_count=membership.strike_count,
            shares_completed=membership.shares_completed,
            shares_missed=membership.shares_missed,
            total_clicks_generated=membership.total_clicks_generated,
            average_engagement_rate=membership.average_engagement_rate,
            quality_score=membership.quality_score,
            reliability_score=membership.reliability_score,
            is_admin=membership.is_admin,
            joined_at=membership.joined_at,
            last_share_date=membership.last_share_date
        )
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.post("/groups/{group_id}/leave")
def leave_collective_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Leave a collective group."""
    try:
        CollectiveService.leave_group(db, current_user.id, group_id)
        return {"success": True, "message": "Left group successfully"}
    except ValueError as e:
        raise HTTPException(400, str(e))


# ==================== SHARE ENDPOINTS ====================

@router.post("/groups/{group_id}/shares", response_model=CollectiveShareResponse)
def record_group_share(
    group_id: int,
    share_data: CollectiveShareCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a share in a specific group."""
    try:
        share = CollectiveService.record_share(
            db,
            current_user.id,
            group_id,
            share_data.recipient_user_id,
            share_data.content_id,
            share_data.share_url
        )

        return CollectiveShareResponse(
            id=share.id,
            group_id=share.group_id,
            sharer_id=share.sharer_id,
            recipient_id=share.recipient_id,
            content_id=share.content_id,
            tracking_code=share.tracking_code,
            status=share.status,
            click_count=share.click_count,
            engagement_rate=share.engagement_rate,
            quality_score=share.quality_score,
            due_date=share.due_date,
            shared_at=share.shared_at,
            verified_at=share.verified_at
        )
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.post("/shares", response_model=CollectiveShareResponse)
def record_collective_share(
    share_data: CollectiveShareCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record that you shared another member's content."""
    try:
        share = CollectiveService.record_share(
            db,
            current_user.id,
            share_data.group_id,
            share_data.recipient_user_id,
            share_data.content_id,
            share_data.share_url
        )

        return CollectiveShareResponse(
            id=share.id,
            group_id=share.group_id,
            sharer_id=share.sharer_id,
            recipient_id=share.recipient_id,
            content_id=share.content_id,
            tracking_code=share.tracking_code,
            status=share.status,
            click_count=share.click_count,
            engagement_rate=share.engagement_rate,
            quality_score=share.quality_score,
            due_date=share.due_date,
            shared_at=share.shared_at,
            verified_at=share.verified_at
        )
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.get("/shares/track/{tracking_code}")
def track_collective_share(
    tracking_code: str,
    db: Session = Depends(get_db)
):
    """Track a click on a collective share."""
    try:
        share = CollectiveService.verify_share(db, tracking_code)

        if share.content_id:
            from ..models.content import Content
            content = db.query(Content).filter(Content.id == share.content_id).first()
            if content:
                return {"redirect_url": content.url}

        return {"success": True, "click_recorded": True}
    except ValueError as e:
        raise HTTPException(404, str(e))


# ==================== ACTIVITY ENDPOINTS ====================

@router.get("/groups/{group_id}/activity", response_model=List[CollectiveActivityResponse])
def get_group_activity(
    group_id: int,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recent activity for a group."""
    try:
        activities = CollectiveService.get_recent_activity(db, group_id, limit)

        return [
            CollectiveActivityResponse(
                id=activity.id,
                group_id=activity.group_id,
                user_id=activity.user_id,
                action=activity.action,
                description=activity.description,
                timestamp=activity.timestamp,
                metadata=activity.activity_metadata
            )
            for activity in activities
        ]
    except Exception as e:
        logger.error(f"Error getting activity: {e}")
        raise HTTPException(500, f"Failed to get activity: {str(e)}")


# ==================== DASHBOARD ENDPOINT ====================

@router.get("/dashboard", response_model=CollectiveDashboardResponse)
def get_collective_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's collective dashboard."""
    memberships = db.query(CollectiveMembership).filter(
        CollectiveMembership.user_id == current_user.id
    ).all()

    my_groups = []
    for membership in memberships:
        group = db.query(CollectiveGroup).filter(
            CollectiveGroup.id == membership.group_id
        ).first()

        if group:
            member_count = db.query(CollectiveMembership).filter(
                CollectiveMembership.group_id == group.id
            ).count()

            my_groups.append(CollectiveGroupResponse(
                id=group.id,
                name=group.name,
                description=group.description,
                niche=group.niche,
                status=group.status,
                min_members=group.min_members,
                max_members=group.max_members,
                current_member_count=member_count,
                follower_range_min=group.follower_range_min,
                follower_range_max=group.follower_range_max,
                shares_per_week=group.shares_per_week,
                created_at=group.created_at,
                last_active=group.last_active
            ))

    # Get upcoming shares
    upcoming_shares = CollectiveService.get_upcoming_schedule(db, current_user.id, 7)
    upcoming_schedule = []
    for schedule in upcoming_shares:
        user = db.query(User).filter(User.id == schedule.user_id).first()
        profile = db.query(Profile).filter(Profile.user_id == schedule.user_id).first()

        upcoming_schedule.append(ScheduleWithUser(
            id=schedule.id,
            group_id=schedule.group_id,
            user_id=schedule.user_id,
            share_date=schedule.scheduled_date,
            day_of_week=schedule.day_of_week,
            is_completed=schedule.is_completed,
            completion_rate=schedule.completion_rate,
            reminder_sent=schedule.reminder_sent,
            username=user.username if user else None,
            profile_name=profile.name if profile else None
        ))

    # Calculate stats
    total_shares_completed = sum(m.shares_completed for m in memberships)
    total_shares_missed = sum(m.shares_missed for m in memberships)
    avg_reliability = sum(m.reliability_score for m in memberships) / len(memberships) if memberships else 0

    overall_stats = {
        "total_groups": len(my_groups),
        "total_shares_completed": total_shares_completed,
        "total_shares_missed": total_shares_missed,
        "average_reliability": round(avg_reliability, 2),
        "upcoming_shares_count": len(upcoming_schedule)
    }

    # Get recent activity
    recent_activity_query = db.query(CollectiveActivityLog).filter(
        CollectiveActivityLog.user_id == current_user.id
    ).order_by(CollectiveActivityLog.timestamp.desc()).limit(10).all()

    recent_activity = [
        {
            "id": log.id,
            "action": log.action,
            "description": log.description,
            "timestamp": log.timestamp.isoformat()
        }
        for log in recent_activity_query
    ]

    return CollectiveDashboardResponse(
        my_groups=my_groups,
        upcoming_shares=upcoming_schedule,
        pending_shares=[],
        recent_activity=recent_activity,
        overall_stats=overall_stats
    )


# ==================== MATCHING ENDPOINT ====================

@router.post("/matching", response_model=CollectiveMatchResponse)
def find_matching_collectives(
    matching_request: CollectiveMatchingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Find collectives that match your criteria."""
    try:
        result = CollectiveService.find_matching_groups(db, current_user.id, matching_request)

        recommended_groups = []
        for group in result["recommended_groups"]:
            member_count = db.query(CollectiveMembership).filter(
                CollectiveMembership.group_id == group.id
            ).count()

            recommended_groups.append(CollectiveGroupResponse(
                id=group.id,
                name=group.name,
                description=group.description,
                niche=group.niche,
                status=group.status,
                min_members=group.min_members,
                max_members=group.max_members,
                current_member_count=member_count,
                follower_range_min=group.follower_range_min,
                follower_range_max=group.follower_range_max,
                shares_per_week=group.shares_per_week,
                created_at=group.created_at,
                last_active=group.last_active
            ))

        return CollectiveMatchResponse(
            recommended_groups=recommended_groups,
            create_new_group=result["create_new_group"],
            match_scores=result["match_scores"]
        )
    except Exception as e:
        logger.error(f"Error matching collectives: {e}")
        raise HTTPException(500, f"Failed to find matches: {str(e)}")


# ==================== ANALYTICS ENDPOINTS ====================

@router.get("/groups/{group_id}/stats")
def get_group_statistics(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed statistics for a group."""
    try:
        stats = CollectiveService.get_group_stats(db, group_id)
        return stats
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.get("/my-performance/{group_id}")
def get_my_performance(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get your performance metrics in a specific group."""
    try:
        performance = CollectiveService.get_member_performance(db, current_user.id, group_id)
        return performance
    except ValueError as e:
        raise HTTPException(404, str(e))
