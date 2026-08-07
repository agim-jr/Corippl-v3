# backend/app/services/autopilot_service.py

"""
Autopilot Service - Automated content sharing for collective groups.

This service handles automatic sharing of content when users enable autopilot mode.
It selects appropriate content and executes shares on behalf of users.

Enhanced Features:
- Smart content selection with scoring algorithm
- Rate limiting to prevent over-sharing
- Quiet hours enforcement for user preferences
"""

from sqlalchemy.orm import Session
from sqlalchemy.exc import StatementError
from datetime import date, datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple
import logging

from ..models.collective import CollectiveSchedule, CollectiveGroup, CollectiveMembership
from ..models.content import Content
from ..models.user import User
from ..models.enums import ScheduleStatus

logger = logging.getLogger(__name__)


class AutopilotService:
    """
    Service for automated content sharing.

    Key Features:
    - Smart content selection with scoring
    - Automatic rate limiting
    - Quiet hours enforcement
    - Respects user preferences
    - Tracks autopilot performance
    """

    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db
        # Default settings
        self.DEFAULT_MAX_DAILY_SHARES = 5
        self.DEFAULT_MAX_HOURLY_SHARES = 2
        self.DEFAULT_QUIET_HOURS = {"enabled": False, "start": 22, "end": 6}

    def execute_autopilot_shares(
        self,
        user_id: int,
        max_shares: int = 10
    ) -> Dict:
        """
        Execute all pending autopilot shares for a user.

        Args:
            user_id: User ID
            max_shares: Maximum shares to execute (safety limit)

        Returns:
            Dict with execution results
        """
        try:
            # Get user
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                return {"success": False, "error": "User not found"}

            if not user.autopilot_enabled:
                return {"success": False, "error": "Autopilot not enabled"}

            # Check quiet hours
            if self._is_quiet_hours(user):
                return {
                    "success": True,
                    "shares_completed": 0,
                    "message": "Currently in quiet hours - shares postponed",
                    "quiet_hours": True
                }

            # Check rate limits
            can_share, rate_limit_msg = self._check_rate_limits(user_id, user)
            if not can_share:
                return {
                    "success": True,
                    "shares_completed": 0,
                    "message": rate_limit_msg,
                    "rate_limited": True
                }

            # Get today's pending shares
            today = date.today()
            pending_schedules = self.db.query(CollectiveSchedule).filter(
                CollectiveSchedule.user_id == user_id,
                CollectiveSchedule.scheduled_date == today,
                CollectiveSchedule.status == ScheduleStatus.PENDING.value
            ).limit(max_shares).all()

            if not pending_schedules:
                return {
                    "success": True,
                    "shares_completed": 0,
                    "message": "No pending shares for today"
                }

            completed = []
            failed = []

            for schedule in pending_schedules:
                # Re-check rate limits for each share
                can_share, rate_limit_msg = self._check_rate_limits(user_id, user)
                if not can_share:
                    logger.info(f"Rate limit reached during batch: {rate_limit_msg}")
                    break

                try:
                    # Get target user's content
                    target_user_id = schedule.target_user_id

                    # Select best content using smart algorithm
                    content = self._smart_select_content(
                        target_user_id,
                        user_id,
                        user
                    )

                    if not content:
                        failed.append({
                            "schedule_id": schedule.id,
                            "error": "No suitable content found"
                        })
                        continue

                    # Execute the share
                    success = self._execute_share(
                        schedule,
                        content,
                        user
                    )

                    if success:
                        completed.append({
                            "schedule_id": schedule.id,
                            "content_id": content.id,
                            "target_user_id": target_user_id,
                            "content_score": getattr(content, '_autopilot_score', 0)
                        })
                    else:
                        failed.append({
                            "schedule_id": schedule.id,
                            "error": "Share execution failed"
                        })

                except Exception as e:
                    logger.error(f"Error executing autopilot share {schedule.id}: {e}")
                    failed.append({
                        "schedule_id": schedule.id,
                        "error": str(e)
                    })

            self.db.commit()

            return {
                "success": True,
                "shares_completed": len(completed),
                "shares_failed": len(failed),
                "completed": completed,
                "failed": failed
            }

        except Exception as e:
            self.db.rollback()
            logger.error(f"Autopilot execution failed for user {user_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def _smart_select_content(
        self,
        target_user_id: int,
        sharer_user_id: int,
        sharer_user: User
    ) -> Optional[Content]:
        """
        Smart content selection using scoring algorithm.

        Scoring Criteria:
        - Recency: Newer content scores higher (0-30 points)
        - Engagement: Higher engagement scores higher (0-40 points)
        - Topic Match: Matches user preferences (0-30 points)

        Args:
            target_user_id: User whose content to share
            sharer_user_id: User doing the sharing
            sharer_user: User object with preferences

        Returns:
            Content object with highest score or None
        """
        try:
            # Get target user's recent content (last 30 days)
            thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)

            # Base query - get recent content
            query = self.db.query(Content).filter(
                Content.user_id == target_user_id,
                Content.created_at >= thirty_days_ago
            )

            # Try to filter by published status if column exists
            try:
                query = query.filter(Content.is_published == True)
            except (AttributeError, StatementError):
                pass

            # Get all candidate content
            candidates = query.order_by(Content.created_at.desc()).limit(10).all()

            if not candidates:
                return None

            # Get user preferences
            user_preferences = self._get_user_preferences(sharer_user)

            # Score each content
            scored_content = []
            for content in candidates:
                score = self._calculate_content_score(content, user_preferences)
                content._autopilot_score = score  # Attach score to object
                scored_content.append((content, score))

            # Sort by score (highest first)
            scored_content.sort(key=lambda x: x[1], reverse=True)

            # Return highest scoring content
            best_content = scored_content[0][0]

            logger.info(
                f"Selected content {best_content.id} with score "
                f"{scored_content[0][1]:.1f} from {len(candidates)} candidates"
            )

            return best_content

        except Exception as e:
            logger.error(f"Error in smart content selection: {e}")
            # Fallback to simple selection
            return self._select_content_for_share(target_user_id, sharer_user_id)

    def _calculate_content_score(
        self,
        content: Content,
        user_preferences: Dict
    ) -> float:
        """
        Calculate content score based on multiple factors.

        Scoring Formula:
        - Recency Score: 30 points max (30 - days_old)
        - Engagement Score: 40 points max (engagement_rate * 400)
        - Topic Match Score: 30 points (30 if match, 15 if no preference)

        Args:
            content: Content object to score
            user_preferences: User's preference dictionary

        Returns:
            Total score (0-100)
        """
        score = 0.0

        # 1. Recency Score (0-30 points)
        # Newer content is better
        days_old = (datetime.now(timezone.utc) - content.created_at).days
        recency_score = max(0, 30 - days_old)
        score += recency_score

        # 2. Engagement Score (0-40 points)
        # Higher engagement is better
        if hasattr(content, 'engagement_rate') and content.engagement_rate:
            # Scale engagement rate (0.0-0.1) to 0-40 points
            engagement_score = min(40, content.engagement_rate * 400)
            score += engagement_score
        else:
            # No engagement data - give neutral score
            score += 20

        # 3. Topic Match Score (0-30 points)
        # Content matching user's preferred topics scores higher
        preferred_topics = user_preferences.get('preferred_topics', [])

        if preferred_topics and hasattr(content, 'category'):
            if content.category in preferred_topics:
                score += 30  # Perfect match
            else:
                score += 10  # No match but has preferences
        else:
            # No preferences set - give neutral score
            score += 15

        return round(score, 2)

    def _get_user_preferences(self, user: User) -> Dict:
        """
        Extract user preferences for content selection.

        Args:
            user: User object

        Returns:
            Dictionary with preferences
        """
        preferences = {
            'preferred_topics': [],
            'excluded_topics': []
        }

        # Try to get preferences from user settings
        if hasattr(user, 'autopilot_settings') and user.autopilot_settings:
            settings = user.autopilot_settings

            if isinstance(settings, dict):
                preferences['preferred_topics'] = settings.get('preferred_topics', [])
                preferences['excluded_topics'] = settings.get('excluded_topics', [])

        return preferences

    def _check_rate_limits(
        self,
        user_id: int,
        user: User
    ) -> Tuple[bool, str]:
        """
        Check if user has exceeded rate limits.

        Rate Limits:
        - Daily limit: User-configurable (default: 5 shares/day)
        - Hourly limit: Fixed (2 shares/hour)

        Args:
            user_id: User ID
            user: User object

        Returns:
            Tuple of (can_share: bool, message: str)
        """
        try:
            now = datetime.now(timezone.utc)
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            hour_start = now.replace(minute=0, second=0, microsecond=0)

            # Get user's max daily shares setting
            max_daily = self._get_max_daily_shares(user)

            # Count completed shares today using user_id
            shares_today = self.db.query(CollectiveSchedule).filter(
                CollectiveSchedule.user_id == user_id,
                CollectiveSchedule.shared_at >= today_start,
                CollectiveSchedule.status == ScheduleStatus.COMPLETED.value
            ).count()

            # Check daily limit
            if shares_today >= max_daily:
                return False, f"Daily limit reached ({shares_today}/{max_daily} shares)"

            # Count shares in last hour using user_id
            shares_last_hour = self.db.query(CollectiveSchedule).filter(
                CollectiveSchedule.user_id == user_id,
                CollectiveSchedule.shared_at >= hour_start,
                CollectiveSchedule.status == ScheduleStatus.COMPLETED.value
            ).count()

            # Check hourly limit
            max_hourly = self._get_max_hourly_shares(user)
            if shares_last_hour >= max_hourly:
                return False, f"Hourly limit reached ({shares_last_hour}/{max_hourly} shares in last hour)"

            # All checks passed
            return True, ""

        except Exception as e:
            logger.error(f"Error checking rate limits: {e}")
            # On error, allow sharing (fail open)
            return True, ""

    def _get_max_daily_shares(self, user: User) -> int:
        """Get user's max daily shares setting."""
        try:
            if hasattr(user, 'autopilot_settings') and user.autopilot_settings:
                settings = user.autopilot_settings
                if isinstance(settings, dict):
                    return settings.get('max_daily_shares', self.DEFAULT_MAX_DAILY_SHARES)
        except Exception:
            pass
        return self.DEFAULT_MAX_DAILY_SHARES

    def _get_max_hourly_shares(self, user: User) -> int:
        """Get user's max hourly shares setting."""
        try:
            if hasattr(user, 'autopilot_settings') and user.autopilot_settings:
                settings = user.autopilot_settings
                if isinstance(settings, dict):
                    return settings.get('max_hourly_shares', self.DEFAULT_MAX_HOURLY_SHARES)
        except Exception:
            pass
        return self.DEFAULT_MAX_HOURLY_SHARES

    def _is_quiet_hours(self, user: User) -> bool:
        """
        Check if current time is within user's quiet hours.

        Quiet hours prevent autopilot from sharing during specified times
        (e.g., nighttime, meetings, etc.)

        Args:
            user: User object

        Returns:
            True if currently in quiet hours, False otherwise
        """
        try:
            # Get quiet hours settings
            quiet_hours = self._get_quiet_hours_settings(user)

            # Check if quiet hours are enabled
            if not quiet_hours.get('enabled', False):
                return False

            # Get current hour (0-23)
            current_hour = datetime.now(timezone.utc).hour

            start_hour = quiet_hours.get('start', 22)
            end_hour = quiet_hours.get('end', 6)

            # Handle quiet hours that span midnight
            if start_hour < end_hour:
                # Normal case: e.g., 9am to 5pm
                in_quiet_hours = start_hour <= current_hour < end_hour
            else:
                # Wraps around midnight: e.g., 10pm to 6am
                in_quiet_hours = current_hour >= start_hour or current_hour < end_hour

            if in_quiet_hours:
                logger.info(
                    f"User {user.id} in quiet hours "
                    f"({start_hour}:00 - {end_hour}:00), current: {current_hour}:00"
                )

            return in_quiet_hours

        except Exception as e:
            logger.error(f"Error checking quiet hours: {e}")
            # On error, don't block sharing
            return False

    def _get_quiet_hours_settings(self, user: User) -> Dict:
        """Get user's quiet hours configuration."""
        try:
            if hasattr(user, 'autopilot_settings') and user.autopilot_settings:
                settings = user.autopilot_settings
                if isinstance(settings, dict):
                    return settings.get('quiet_hours', self.DEFAULT_QUIET_HOURS)
        except Exception:
            pass
        return self.DEFAULT_QUIET_HOURS.copy()

    def _select_content_for_share(
        self,
        target_user_id: int,
        sharer_user_id: int
    ) -> Optional[Content]:
        """
        Fallback simple content selection.

        Used when smart selection fails.

        Args:
            target_user_id: User whose content to share
            sharer_user_id: User doing the sharing

        Returns:
            Content object or None
        """
        try:
            # Get target user's recent content
            thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)

            # Base query - just get recent content
            query = self.db.query(Content).filter(
                Content.user_id == target_user_id,
                Content.created_at >= thirty_days_ago
            )

            # Try to check is_published if it exists
            try:
                query = query.filter(Content.is_published == True)
            except (AttributeError, StatementError):
                pass

            # Order by created_at descending (most recent first)
            content = query.order_by(Content.created_at.desc()).first()

            return content

        except Exception as e:
            logger.error(f"Error selecting content: {e}")
            return None

    def _execute_share(
        self,
        schedule: CollectiveSchedule,
        content: Content,
        user: User
    ) -> bool:
        """
        Execute the actual share.

        This method would:
        1. Post to social media platforms
        2. Record the share in database
        3. Update schedule status
        4. Update membership stats

        Args:
            schedule: Schedule object
            content: Content to share
            user: User doing the sharing

        Returns:
            True if successful, False otherwise
        """
        try:
            # TODO: Implement actual social media posting
            # For now, we'll just mark the schedule as completed

            # Mark schedule as completed with proper fields
            schedule.status = ScheduleStatus.COMPLETED.value
            schedule.is_completed = True
            schedule.shared_at = datetime.now(timezone.utc)
            schedule.content_id = content.id

            # Update membership stats
            membership = self.db.query(CollectiveMembership).filter(
                CollectiveMembership.group_id == schedule.group_id,
                CollectiveMembership.user_id == user.id
            ).first()

            if membership:
                membership.shares_completed += 1
                membership.last_share_date = date.today()

            logger.info(
                f"✅ Autopilot share completed: "
                f"User {user.id} shared content {content.id} "
                f"for schedule {schedule.id}"
            )

            return True

        except Exception as e:
            logger.error(f"Error executing share: {e}")
            return False

    def get_autopilot_stats(
        self,
        user_id: int,
        days: int = 30
    ) -> Dict:
        """
        Get autopilot performance stats for a user.

        Args:
            user_id: User ID
            days: Number of days to look back

        Returns:
            Dict with autopilot statistics
        """
        try:
            start_date = date.today() - timedelta(days=days)

            # Get all schedules in date range with user_id
            schedules = self.db.query(CollectiveSchedule).filter(
                CollectiveSchedule.user_id == user_id,
                CollectiveSchedule.scheduled_date >= start_date
            ).all()

            total = len(schedules)
            completed = 0
            pending = 0
            missed = 0

            for schedule in schedules:
                # Handle both string and enum values
                status = schedule.status
                if isinstance(status, str):
                    status = status.upper()
                else:
                    status = status.value if hasattr(status, 'value') else str(status).upper()

                if status == 'COMPLETED' or schedule.is_completed:
                    completed += 1
                elif status == 'PENDING' and schedule.scheduled_date >= date.today():
                    pending += 1
                elif status == 'MISSED':
                    missed += 1

            completion_rate = (completed / total * 100) if total > 0 else 0

            return {
                "total_scheduled": total,
                "completed": completed,
                "pending": pending,
                "missed": missed,
                "completion_rate": round(completion_rate, 1),
                "date_range": {
                    "start": start_date.isoformat(),
                    "end": date.today().isoformat()
                }
            }

        except Exception as e:
            logger.error(f"Error getting autopilot stats: {e}", exc_info=True)
            return {
                "error": str(e),
                "total_scheduled": 0,
                "completed": 0,
                "pending": 0,
                "missed": 0,
                "completion_rate": 0
            }

    def validate_autopilot_eligibility(
        self,
        user_id: int
    ) -> Dict:
        """
        Check if user is eligible to enable autopilot.

        Requirements:
        - Member of at least one collective group
        - Has published content to share
        - No active strikes (optional)

        Args:
            user_id: User ID

        Returns:
            Dict with eligibility status and reasons
        """
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                return {
                    "eligible": False,
                    "reasons": ["User not found"]
                }

            reasons = []

            # Check group membership
            memberships = self.db.query(CollectiveMembership).filter(
                CollectiveMembership.user_id == user_id,
                CollectiveMembership.status == "active"
            ).all()

            if not memberships:
                reasons.append("Not a member of any active collective groups")

            # Check for published content
            try:
                content_count = self.db.query(Content).filter(
                    Content.user_id == user_id,
                    Content.is_published == True
                ).count()
            except (AttributeError, StatementError):
                # Column doesn't exist, just count all content
                content_count = self.db.query(Content).filter(
                    Content.user_id == user_id
                ).count()

            if content_count == 0:
                reasons.append("No published content available")

            # Check strikes (optional - can be removed if too strict)
            active_strikes = sum(
                1 for m in memberships
                if m.strike_count >= 3
            )

            if active_strikes > 0:
                reasons.append("Has active strikes in collective groups")

            eligible = len(reasons) == 0

            return {
                "eligible": eligible,
                "reasons": reasons if not eligible else [],
                "memberships_count": len(memberships),
                "content_count": content_count
            }

        except Exception as e:
            logger.error(f"Error validating autopilot eligibility: {e}")
            return {
                "eligible": False,
                "reasons": [f"Error: {str(e)}"]
            }

    def enable_autopilot(
        self,
        user_id: int
    ) -> Dict:
        """
        Enable autopilot for a user.

        Args:
            user_id: User ID

        Returns:
            Dict with success status
        """
        try:
            # Validate eligibility
            eligibility = self.validate_autopilot_eligibility(user_id)

            if not eligibility["eligible"]:
                return {
                    "success": False,
                    "error": "Not eligible for autopilot",
                    "reasons": eligibility["reasons"]
                }

            # Enable autopilot
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                return {
                    "success": False,
                    "error": "User not found"
                }

            user.autopilot_enabled = True

            # Initialize default settings if not present
            if not hasattr(user, 'autopilot_settings') or not user.autopilot_settings:
                user.autopilot_settings = {
                    'max_daily_shares': self.DEFAULT_MAX_DAILY_SHARES,
                    'max_hourly_shares': self.DEFAULT_MAX_HOURLY_SHARES,
                    'quiet_hours': self.DEFAULT_QUIET_HOURS.copy(),
                    'preferred_topics': [],
                    'excluded_topics': []
                }

            self.db.commit()

            logger.info(f"✅ Autopilot enabled for user {user_id}")

            return {
                "success": True,
                "message": "Autopilot enabled successfully",
                "settings": user.autopilot_settings
            }

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error enabling autopilot: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def disable_autopilot(
        self,
        user_id: int
    ) -> Dict:
        """
        Disable autopilot for a user.

        Args:
            user_id: User ID

        Returns:
            Dict with success status
        """
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                return {
                    "success": False,
                    "error": "User not found"
                }

            user.autopilot_enabled = False
            self.db.commit()

            logger.info(f"🔴 Autopilot disabled for user {user_id}")

            return {
                "success": True,
                "message": "Autopilot disabled successfully"
            }

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error disabling autopilot: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def update_autopilot_settings(
        self,
        user_id: int,
        settings: Dict
    ) -> Dict:
        """
        Update user's autopilot settings.

        Args:
            user_id: User ID
            settings: New settings dictionary

        Returns:
            Dict with success status
        """
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                return {
                    "success": False,
                    "error": "User not found"
                }

            # Initialize if not present
            if not hasattr(user, 'autopilot_settings') or not user.autopilot_settings:
                user.autopilot_settings = {}

            # Update settings
            current_settings = user.autopilot_settings.copy() if isinstance(user.autopilot_settings, dict) else {}

            # Update max daily shares
            if 'max_daily_shares' in settings:
                max_daily = int(settings['max_daily_shares'])
                if 1 <= max_daily <= 20:  # Reasonable limits
                    current_settings['max_daily_shares'] = max_daily

            # Update max hourly shares
            if 'max_hourly_shares' in settings:
                max_hourly = int(settings['max_hourly_shares'])
                if 1 <= max_hourly <= 5:  # Reasonable limits
                    current_settings['max_hourly_shares'] = max_hourly

            # Update quiet hours
            if 'quiet_hours' in settings:
                quiet_hours = settings['quiet_hours']
                if isinstance(quiet_hours, dict):
                    current_settings['quiet_hours'] = {
                        'enabled': quiet_hours.get('enabled', False),
                        'start': int(quiet_hours.get('start', 22)) % 24,
                        'end': int(quiet_hours.get('end', 6)) % 24
                    }

            # Update topic preferences
            if 'preferred_topics' in settings:
                if isinstance(settings['preferred_topics'], list):
                    current_settings['preferred_topics'] = settings['preferred_topics']

            if 'excluded_topics' in settings:
                if isinstance(settings['excluded_topics'], list):
                    current_settings['excluded_topics'] = settings['excluded_topics']

            user.autopilot_settings = current_settings
            self.db.commit()

            logger.info(f"✅ Updated autopilot settings for user {user_id}")

            return {
                "success": True,
                "message": "Settings updated successfully",
                "settings": current_settings
            }

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating autopilot settings: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def get_autopilot_status(
        self,
        user_id: int
    ) -> Dict:
        """
        Get comprehensive autopilot status for a user.

        Args:
            user_id: User ID

        Returns:
            Dict with autopilot status and info
        """
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                return {"error": "User not found"}

            # Get basic status
            enabled = user.autopilot_enabled if hasattr(user, 'autopilot_enabled') else False

            # Get eligibility
            eligibility = self.validate_autopilot_eligibility(user_id)

            # Get settings
            settings = self._get_user_settings(user)

            # Get current state
            in_quiet_hours = self._is_quiet_hours(user) if enabled else False
            can_share, rate_msg = self._check_rate_limits(user_id, user) if enabled else (True, "")

            # Get today's stats using user_id
            today_schedules = self.db.query(CollectiveSchedule).filter(
                CollectiveSchedule.user_id == user_id,
                CollectiveSchedule.scheduled_date == date.today()
            ).all()

            # Get 30-day performance
            performance_stats = self.get_autopilot_stats(user_id, 30)

            return {
                "enabled": enabled,
                "eligibility": eligibility,
                "settings": settings,
                "current_state": {
                    "in_quiet_hours": in_quiet_hours,
                    "can_share": can_share,
                    "rate_limit_message": rate_msg if not can_share else None
                },
                "today": {
                    "scheduled": len(today_schedules),
                    "shares_completed": sum(1 for s in today_schedules if s.status == ScheduleStatus.COMPLETED.value or s.is_completed),
                    "pending": sum(1 for s in today_schedules if s.status == ScheduleStatus.PENDING.value)
                },
                "performance_stats": performance_stats
            }

        except Exception as e:
            logger.error(f"Error getting autopilot status: {e}")
            return {"error": str(e)}

    def get_user_settings(self, user_id: int) -> Dict:
        """Get user's autopilot settings."""
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                return None
            return self._get_user_settings(user)
        except Exception as e:
            logger.error(f"Error getting user settings: {e}")
            return None

    def _get_user_settings(self, user: User) -> Dict:
        """Get user's complete autopilot settings."""
        default_settings = {
            'max_daily_shares': self.DEFAULT_MAX_DAILY_SHARES,
            'max_hourly_shares': self.DEFAULT_MAX_HOURLY_SHARES,
            'quiet_hours': self.DEFAULT_QUIET_HOURS.copy(),
            'preferred_topics': [],
            'excluded_topics': []
        }

        try:
            if hasattr(user, 'autopilot_settings') and user.autopilot_settings:
                settings = user.autopilot_settings
                if isinstance(settings, dict):
                    # Merge with defaults
                    for key, value in settings.items():
                        default_settings[key] = value
        except Exception as e:
            logger.error(f"Error getting user settings: {e}")

        return default_settings
