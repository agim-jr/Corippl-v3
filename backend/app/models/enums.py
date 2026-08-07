# backend/app/models/enums.py

"""
Enums for the application.

This module defines all enum types used across the application models.
"""

from enum import Enum


class ScheduleStatus(str, Enum):
    """Status of a collective schedule."""
    PENDING = "pending"
    COMPLETED = "completed"
    MISSED = "missed"
    EXCUSED = "excused"  # Changed from CANCELLED to EXCUSED


class MembershipStatus(str, Enum):
    """Status of a collective membership."""
    ACTIVE = "active"
    WARNING = "warning"      # Changed from INACTIVE
    PROBATION = "probation"  # Changed from SUSPENDED
    REMOVED = "removed"      # Changed from PENDING


class CollectiveGroupStatus(str, Enum):
    """Status of a collective group."""
    FORMING = "forming"      # New
    ACTIVE = "active"
    PAUSED = "paused"        # Changed from INACTIVE
    DISBANDED = "disbanded"  # Changed from ARCHIVED


class ShareStatus(str, Enum):
    """Status of a collective share."""
    PENDING = "pending"
    COMPLETED = "completed"
    MISSED = "missed"
    EXCUSED = "excused"


class ShareFrequency(str, Enum):
    """How often shares should occur in a collective."""
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"


class NotificationType(str, Enum):
    """Types of notifications."""
    SHARE_REMINDER = "share_reminder"
    SHARE_COMPLETED = "share_completed"
    SHARE_MISSED = "share_missed"
    GROUP_INVITATION = "group_invitation"
    GROUP_REMOVED = "group_removed"
    STRIKE_WARNING = "strike_warning"
    STRIKE_ADDED = "strike_added"
    AUTOPILOT_STATUS = "autopilot_status"
    SYSTEM = "system"


class ContentStatus(str, Enum):
    """Status of content."""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    DELETED = "deleted"


class UserRole(str, Enum):
    """User roles in the application."""
    USER = "user"
    ADMIN = "admin"
    MODERATOR = "moderator"


class PlatformType(str, Enum):
    """Social media platform types."""
    TWITTER = "twitter"
    LINKEDIN = "linkedin"
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    MEDIUM = "medium"
    SUBSTACK = "substack"
