# backend/app/services/collective_service.py

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional, Any
import secrets
import logging

from ..models.collective import (
    CollectiveGroup,
    CollectiveMembership,
    CollectiveSchedule,
    CollectiveShare,
    CollectiveActivityLog
)
from ..models.enums import (
    CollectiveGroupStatus,
    MembershipStatus,
    ScheduleStatus,
    ShareStatus
)
from ..models.content import Content
from ..models.user import User

logger = logging.getLogger(__name__)


class CollectiveService:
    """Service for managing collective groups and shares"""

    # ==================== GROUP MANAGEMENT ====================

    @staticmethod
    def create_group(
        db: Session,
        creator_user_id: int,
        group_data: Dict[str, Any],
        **kwargs
    ) -> CollectiveGroup:
        """Create a new collective group"""

        # Extract data from dict
        name = group_data.get('name')
        niche = group_data.get('niche')
        min_members = group_data.get('min_members', 4)
        max_members = group_data.get('max_members', 8)
        description = group_data.get('description')
        follower_range_min = group_data.get('follower_range_min', 0)
        follower_range_max = group_data.get('follower_range_max', 10000)
        shares_per_week = group_data.get('shares_per_week', 5)
        is_private = group_data.get('is_private', False)

        group = CollectiveGroup(
            name=name,
            niche=niche,
            description=description,
            min_members=min_members,
            max_members=max_members,
            follower_range_min=follower_range_min,
            follower_range_max=follower_range_max,
            shares_per_week=shares_per_week,
            status=CollectiveGroupStatus.FORMING,
            **kwargs
        )
        db.add(group)
        db.commit()
        db.refresh(group)

        # Automatically add creator as admin member
        CollectiveService.add_member(db, group.id, creator_user_id, is_admin=True)

        CollectiveService._log_activity(
            db, group.id, creator_user_id,
            "group_created",
            f"Collective group '{name}' created by user {creator_user_id}"
        )

        return group

    @staticmethod
    def get_user_groups(db: Session, user_id: int) -> List[CollectiveGroup]:
        """Get all groups a user is a member of"""
        memberships = db.query(CollectiveMembership).filter(
            CollectiveMembership.user_id == user_id,
            CollectiveMembership.status.in_([
                MembershipStatus.ACTIVE,
                MembershipStatus.WARNING,
                MembershipStatus.PROBATION
            ])
        ).all()

        return [m.group for m in memberships]

    @staticmethod
    def get_group_details(db: Session, group_id: int) -> Optional[CollectiveGroup]:
        """Get detailed group information"""
        return db.query(CollectiveGroup).filter(
            CollectiveGroup.id == group_id
        ).first()

    # ==================== MEMBERSHIP MANAGEMENT ====================

    @staticmethod
    def add_member(
        db: Session,
        group_id: int,
        user_id: int,
        is_admin: bool = False
    ) -> CollectiveMembership:
        """Add a member to a group"""
        group = db.query(CollectiveGroup).filter(
            CollectiveGroup.id == group_id
        ).first()

        if not group:
            raise ValueError("Group not found")

        # Check if group is full
        current_members = db.query(CollectiveMembership).filter(
            CollectiveMembership.group_id == group_id,
            CollectiveMembership.status == MembershipStatus.ACTIVE
        ).count()

        if current_members >= group.max_members:
            raise ValueError("Group is full")

        # Check if user is already a member
        existing = db.query(CollectiveMembership).filter(
            CollectiveMembership.group_id == group_id,
            CollectiveMembership.user_id == user_id
        ).first()

        if existing:
            raise ValueError("User is already a member")

        membership = CollectiveMembership(
            user_id=user_id,
            group_id=group_id,
            is_admin=is_admin,
            status=MembershipStatus.ACTIVE
        )

        db.add(membership)
        db.commit()
        db.refresh(membership)

        # Update group status if minimum members reached
        if current_members + 1 >= group.min_members and group.status == CollectiveGroupStatus.FORMING:
            group.status = CollectiveGroupStatus.ACTIVE
            db.commit()

        CollectiveService._log_activity(
            db, group_id, user_id,
            "member_joined",
            f"User {user_id} joined the group"
        )

        return membership

    @staticmethod
    def join_group(db: Session, user_id: int, group_id: int) -> CollectiveMembership:
        """Join a group (wrapper around add_member)"""
        return CollectiveService.add_member(db, group_id, user_id, is_admin=False)

    @staticmethod
    def remove_member(db: Session, group_id: int, user_id: int, reason: str = "left") -> bool:
        """Remove a member from a group"""
        membership = db.query(CollectiveMembership).filter(
            CollectiveMembership.group_id == group_id,
            CollectiveMembership.user_id == user_id
        ).first()

        if not membership:
            return False

        membership.status = MembershipStatus.REMOVED
        db.commit()

        CollectiveService._log_activity(
            db, group_id, user_id,
            "member_removed",
            f"User {user_id} {reason}"
        )

        return True

    @staticmethod
    def leave_group(db: Session, user_id: int, group_id: int) -> bool:
        """Leave a group (wrapper around remove_member)"""
        success = CollectiveService.remove_member(db, group_id, user_id, reason="voluntarily left")
        if not success:
            raise ValueError("User is not a member of this group")
        return True

    @staticmethod
    def update_member_status(
        db: Session,
        membership_id: int,
        new_status: MembershipStatus,
        reason: Optional[str] = None
    ) -> CollectiveMembership:
        """Update a member's status"""
        membership = db.query(CollectiveMembership).filter(
            CollectiveMembership.id == membership_id
        ).first()

        if not membership:
            raise ValueError("Membership not found")

        old_status = membership.status
        membership.status = new_status
        db.commit()
        db.refresh(membership)

        CollectiveService._log_activity(
            db, membership.group_id, membership.user_id,
            "status_changed",
            f"Status changed from {old_status} to {new_status}: {reason or 'No reason provided'}"
        )

        return membership

    # ==================== SCHEDULE MANAGEMENT ====================

    @staticmethod
    def create_weekly_schedule(db: Session, group_id: int) -> List[CollectiveSchedule]:
        """Create a weekly rotation schedule for a group"""
        group = db.query(CollectiveGroup).filter(
            CollectiveGroup.id == group_id
        ).first()

        if not group:
            raise ValueError("Group not found")

        # Get active members
        members = db.query(CollectiveMembership).filter(
            CollectiveMembership.group_id == group_id,
            CollectiveMembership.status == MembershipStatus.ACTIVE
        ).all()

        if len(members) < group.min_members:
            raise ValueError("Not enough active members to create schedule")

        schedules = []
        today = date.today()
        days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

        # Create round-robin schedule
        for i in range(group.shares_per_week):
            schedule_date = today + timedelta(days=i)
            day_of_week = days_of_week[schedule_date.weekday()]

            # Assign member based on rotation
            member = members[i % len(members)]

            schedule = CollectiveSchedule(
                group_id=group_id,
                user_id=member.user_id,
                scheduled_date=schedule_date,
                day_of_week=day_of_week,
                status=ScheduleStatus.PENDING
            )

            db.add(schedule)
            schedules.append(schedule)

        db.commit()

        CollectiveService._log_activity(
            db, group_id, None,
            "schedule_created",
            f"Weekly schedule created with {len(schedules)} shares"
        )

        return schedules

    @staticmethod
    def get_upcoming_schedule(
        db: Session,
        user_id: int,
        days: int = 7
    ) -> List[CollectiveSchedule]:
        """Get upcoming scheduled shares for a user"""
        today = date.today()
        future_date = today + timedelta(days=days)

        return db.query(CollectiveSchedule).filter(
            CollectiveSchedule.user_id == user_id,
            CollectiveSchedule.scheduled_date >= today,
            CollectiveSchedule.scheduled_date <= future_date,
            CollectiveSchedule.status == ScheduleStatus.PENDING
        ).order_by(CollectiveSchedule.scheduled_date).all()

    # ==================== SHARE TRACKING ====================

    @staticmethod
    def create_share(
        db: Session,
        group_id: int,
        sharer_id: int,
        recipient_id: int,
        content_id: int,
        schedule_id: int,
        share_url: Optional[str] = None
    ) -> CollectiveShare:
        """Create a new share record"""
        tracking_code = secrets.token_urlsafe(16)

        share = CollectiveShare(
            group_id=group_id,
            schedule_id=schedule_id,
            sharer_id=sharer_id,
            recipient_id=recipient_id,
            content_id=content_id,
            tracking_code=tracking_code,
            share_url=share_url,
            status=ShareStatus.PENDING,
            due_date=date.today() + timedelta(days=1)
        )

        db.add(share)
        db.commit()
        db.refresh(share)

        return share

    @staticmethod
    def record_share(
        db: Session,
        user_id: int,
        group_id: int,
        recipient_user_id: int,
        content_id: int,
        share_url: Optional[str] = None
    ) -> CollectiveShare:
        """Record a share from user to recipient"""
        # Get sharer membership
        sharer_membership = db.query(CollectiveMembership).filter(
            CollectiveMembership.user_id == user_id,
            CollectiveMembership.group_id == group_id,
            CollectiveMembership.status == MembershipStatus.ACTIVE
        ).first()

        if not sharer_membership:
            raise ValueError("User is not an active member of this group")

        # Get recipient membership
        recipient_membership = db.query(CollectiveMembership).filter(
            CollectiveMembership.user_id == recipient_user_id,
            CollectiveMembership.group_id == group_id,
            CollectiveMembership.status == MembershipStatus.ACTIVE
        ).first()

        if not recipient_membership:
            raise ValueError("Recipient is not an active member of this group")

        # Get today's schedule for the user
        schedule = db.query(CollectiveSchedule).filter(
            CollectiveSchedule.user_id == user_id,
            CollectiveSchedule.group_id == group_id,
            CollectiveSchedule.scheduled_date == date.today(),
            CollectiveSchedule.status == ScheduleStatus.PENDING
        ).first()

        if not schedule:
            # If no schedule for today, create a flexible one
            schedule = CollectiveSchedule(
                group_id=group_id,
                user_id=user_id,
                scheduled_date=date.today(),
                day_of_week=date.today().strftime("%A"),
                status=ScheduleStatus.PENDING
            )
            db.add(schedule)
            db.commit()
            db.refresh(schedule)

        # Create the share
        share = CollectiveService.create_share(
            db=db,
            group_id=group_id,
            sharer_id=sharer_membership.id,
            recipient_id=recipient_membership.id,
            content_id=content_id,
            schedule_id=schedule.id,
            share_url=share_url
        )

        # Mark schedule as completed
        schedule.status = ScheduleStatus.COMPLETED
        schedule.is_completed = True
        db.commit()

        return share

    @staticmethod
    def verify_share(
        db: Session,
        tracking_code: str,
        user_id: Optional[int] = None
    ) -> CollectiveShare:
        """Verify a share and update metrics"""
        share = db.query(CollectiveShare).filter(
            CollectiveShare.tracking_code == tracking_code
        ).first()

        if not share:
            raise ValueError("Invalid tracking code")

        # Update share status
        share.status = ShareStatus.COMPLETED
        share.verified_at = datetime.utcnow()
        share.click_count += 1

        # Update sharer metrics
        sharer = db.query(CollectiveMembership).filter(
            CollectiveMembership.id == share.sharer_id
        ).first()

        if sharer:
            sharer.shares_completed += 1
            sharer.total_clicks_generated += 1
            sharer.last_share_date = date.today()

            # Update quality score
            sharer.quality_score = min(10.0, sharer.quality_score + 0.1)

        # Update schedule
        schedule = db.query(CollectiveSchedule).filter(
            CollectiveSchedule.id == share.schedule_id
        ).first()

        if schedule:
            schedule.status = ScheduleStatus.COMPLETED
            schedule.is_completed = True
            schedule.completion_rate = 100.0

        db.commit()
        db.refresh(share)

        CollectiveService._log_activity(
            db, share.group_id, user_id,
            "share_completed",
            f"Share verified: {tracking_code}"
        )

        return share

    @staticmethod
    def track_click(db: Session, tracking_code: str) -> bool:
        """Track a click on a shared link"""
        share = db.query(CollectiveShare).filter(
            CollectiveShare.tracking_code == tracking_code
        ).first()

        if not share:
            return False

        share.click_count += 1

        # Update engagement rate
        if share.click_count > 0:
            share.engagement_rate = (share.conversion_count / share.click_count) * 100

        db.commit()

        return True

    # ==================== STRIKE SYSTEM ====================

    @staticmethod
    def add_strike(
        db: Session,
        membership_id: int,
        reason: str
    ) -> CollectiveMembership:
        """Add a strike to a member"""
        membership = db.query(CollectiveMembership).filter(
            CollectiveMembership.id == membership_id
        ).first()

        if not membership:
            raise ValueError("Membership not found")

        membership.strike_count += 1

        # Update strike dates
        if not membership.strike_dates:
            membership.strike_dates = []
        membership.strike_dates.append(datetime.utcnow().isoformat())

        # Update status based on strikes
        if membership.strike_count >= 3:
            membership.status = MembershipStatus.REMOVED
        elif membership.strike_count == 2:
            membership.status = MembershipStatus.PROBATION
        elif membership.strike_count == 1:
            membership.status = MembershipStatus.WARNING

        # Update reliability score
        membership.reliability_score = max(0, membership.reliability_score - 20)

        db.commit()
        db.refresh(membership)

        CollectiveService._log_activity(
            db, membership.group_id, membership.user_id,
            "strike_added",
            f"Strike added: {reason}. Total strikes: {membership.strike_count}"
        )

        return membership

    @staticmethod
    def check_missed_shares(db: Session) -> List[Dict]:
        """Check for missed shares and add strikes"""
        today = date.today()
        yesterday = today - timedelta(days=1)

        # Find pending schedules from yesterday
        missed_schedules = db.query(CollectiveSchedule).filter(
            CollectiveSchedule.scheduled_date == yesterday,
            CollectiveSchedule.status == ScheduleStatus.PENDING
        ).all()

        results = []

        for schedule in missed_schedules:
            # Update schedule status
            schedule.status = ScheduleStatus.MISSED

            # Find membership
            membership = db.query(CollectiveMembership).filter(
                CollectiveMembership.group_id == schedule.group_id,
                CollectiveMembership.user_id == schedule.user_id
            ).first()

            if membership:
                membership.shares_missed += 1
                CollectiveService.add_strike(
                    db, membership.id,
                    f"Missed scheduled share on {yesterday}"
                )

                results.append({
                    "user_id": schedule.user_id,
                    "group_id": schedule.group_id,
                    "date": yesterday,
                    "strike_added": True
                })

        db.commit()

        return results

    # ==================== ANALYTICS ====================

    @staticmethod
    def get_member_stats(db: Session, membership_id: int) -> Dict[str, Any]:
        """Get detailed stats for a member"""
        membership = db.query(CollectiveMembership).filter(
            CollectiveMembership.id == membership_id
        ).first()

        if not membership:
            raise ValueError("Membership not found")

        total_shares = membership.shares_completed + membership.shares_missed
        completion_rate = (membership.shares_completed / total_shares * 100) if total_shares > 0 else 0

        return {
            "user_id": membership.user_id,
            "group_id": membership.group_id,
            "status": membership.status,
            "strike_count": membership.strike_count,
            "shares_completed": membership.shares_completed,
            "shares_missed": membership.shares_missed,
            "completion_rate": completion_rate,
            "total_clicks_generated": membership.total_clicks_generated,
            "average_engagement_rate": membership.average_engagement_rate,
            "quality_score": membership.quality_score,
            "reliability_score": membership.reliability_score
        }

    @staticmethod
    def get_member_performance(db: Session, user_id: int, group_id: int) -> Dict[str, Any]:
        """Get performance metrics for a user in a specific group"""
        membership = db.query(CollectiveMembership).filter(
            CollectiveMembership.user_id == user_id,
            CollectiveMembership.group_id == group_id
        ).first()

        if not membership:
            raise ValueError("User is not a member of this group")

        return CollectiveService.get_member_stats(db, membership.id)

    @staticmethod
    def get_group_stats(db: Session, group_id: int) -> Dict[str, Any]:
        """Get overall group statistics"""
        group = db.query(CollectiveGroup).filter(
            CollectiveGroup.id == group_id
        ).first()

        if not group:
            raise ValueError("Group not found")

        members = db.query(CollectiveMembership).filter(
            CollectiveMembership.group_id == group_id
        ).all()

        total_shares = sum(m.shares_completed for m in members)
        total_clicks = sum(m.total_clicks_generated for m in members)
        avg_quality = sum(m.quality_score for m in members) / len(members) if members else 0

        return {
            "group_id": group_id,
            "name": group.name,
            "status": group.status,
            "member_count": len(members),
            "total_shares_completed": total_shares,
            "total_clicks_generated": total_clicks,
            "average_quality_score": avg_quality,
            "last_active": group.last_active
        }

    # ==================== MATCHING SYSTEM ====================

    @staticmethod
    def find_matching_groups(
        db: Session,
        user_id: int,
        matching_request: Any
    ) -> Dict[str, Any]:
        """Find groups that match user criteria"""
        from ..models.profile import Profile

        # Get user's profile
        user_profile = db.query(Profile).filter(Profile.user_id == user_id).first()

        # Build query for matching groups
        query = db.query(CollectiveGroup).filter(
            CollectiveGroup.status.in_([
                CollectiveGroupStatus.FORMING,
                CollectiveGroupStatus.ACTIVE
            ])
        )

        # Filter by niche if provided
        if hasattr(matching_request, 'niche') and matching_request.niche:
            query = query.filter(CollectiveGroup.niche == matching_request.niche)

        # Filter by follower range if user has profile
        if user_profile and user_profile.follower_count:
            query = query.filter(
                CollectiveGroup.follower_range_min <= user_profile.follower_count,
                CollectiveGroup.follower_range_max >= user_profile.follower_count
            )

        # Get groups that aren't full and user isn't already in
        user_group_ids = [
            m.group_id for m in db.query(CollectiveMembership).filter(
                CollectiveMembership.user_id == user_id
            ).all()
        ]

        if user_group_ids:
            query = query.filter(~CollectiveGroup.id.in_(user_group_ids))

        groups = query.all()

        # Filter out full groups
        available_groups = []
        for group in groups:
            member_count = db.query(CollectiveMembership).filter(
                CollectiveMembership.group_id == group.id,
                CollectiveMembership.status == MembershipStatus.ACTIVE
            ).count()

            if member_count < group.max_members:
                available_groups.append(group)

        # Calculate match scores (simple version)
        match_scores = {}
        for group in available_groups:
            score = 50  # Base score

            # Bonus for same niche
            if user_profile and user_profile.niche == group.niche:
                score += 30

            # Bonus for similar follower count
            if user_profile and user_profile.follower_count:
                mid_range = (group.follower_range_min + group.follower_range_max) / 2
                diff_ratio = abs(user_profile.follower_count - mid_range) / mid_range
                if diff_ratio < 0.2:  # Within 20%
                    score += 20

            match_scores[group.id] = score

        # Sort by match score
        available_groups.sort(key=lambda g: match_scores.get(g.id, 0), reverse=True)

        # Determine if user should create new group
        create_new = len(available_groups) == 0

        return {
            "recommended_groups": available_groups[:5],  # Top 5 matches
            "create_new_group": create_new,
            "match_scores": match_scores
        }

    # ==================== UTILITY METHODS ====================

    @staticmethod
    def _log_activity(
        db: Session,
        group_id: int,
        user_id: Optional[int],
        action: str,
        description: str,
        metadata: Optional[Dict] = None
    ):
        """Log an activity in the group"""
        log = CollectiveActivityLog(
            group_id=group_id,
            user_id=user_id,
            action=action,
            description=description,
            activity_metadata=metadata
        )
        db.add(log)
        db.commit()

    @staticmethod
    def get_recent_activity(
        db: Session,
        group_id: int,
        limit: int = 20
    ) -> List[CollectiveActivityLog]:
        """Get recent activity for a group"""
        return db.query(CollectiveActivityLog).filter(
            CollectiveActivityLog.group_id == group_id
        ).order_by(desc(CollectiveActivityLog.timestamp)).limit(limit).all()
