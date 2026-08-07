# backend/app/models/collective.py

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, JSON, Text, Date, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, date
from .base import Base
from .enums import (
    ScheduleStatus,
    MembershipStatus,
    CollectiveGroupStatus,
    ShareStatus
)

# Remove all the enum class definitions - they're now imported from enums.py

# ==================== COLLECTIVE GROUP ====================
class CollectiveGroup(Base):
    __tablename__ = "collective_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    # Group settings
    min_members = Column(Integer, default=4)
    max_members = Column(Integer, default=8)
    niche = Column(String(100), nullable=False)
    status = Column(SQLEnum(CollectiveGroupStatus), default=CollectiveGroupStatus.FORMING)

    # Matching criteria
    follower_range_min = Column(Integer, default=0)
    follower_range_max = Column(Integer, default=10000)
    target_audience = Column(JSON, nullable=True)
    content_types = Column(JSON, nullable=True)

    # Group rules
    shares_per_week = Column(Integer, default=5)
    quality_threshold = Column(Float, default=0.5)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)

    # Relationships
    memberships = relationship("CollectiveMembership", back_populates="group", cascade="all, delete-orphan")
    schedules = relationship("CollectiveSchedule", back_populates="group", cascade="all, delete-orphan")
    shares = relationship("CollectiveShare", back_populates="group", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<CollectiveGroup(id={self.id}, name={self.name}, status={self.status})>"


# ==================== COLLECTIVE MEMBERSHIP ====================
class CollectiveMembership(Base):
    __tablename__ = "collective_memberships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    group_id = Column(Integer, ForeignKey("collective_groups.id", ondelete="CASCADE"), nullable=False)

    # Status tracking
    status = Column(SQLEnum(MembershipStatus), default=MembershipStatus.ACTIVE)
    strike_count = Column(Integer, default=0)

    # Performance metrics
    shares_completed = Column(Integer, default=0)
    shares_missed = Column(Integer, default=0)
    total_clicks_generated = Column(Integer, default=0)
    average_engagement_rate = Column(Float, default=0.0)

    # Reputation
    quality_score = Column(Float, default=5.0)
    reliability_score = Column(Float, default=100.0)

    # Role in group
    is_admin = Column(Boolean, default=False)

    # Timestamps
    joined_at = Column(DateTime, default=datetime.utcnow)
    last_share_date = Column(Date, nullable=True)
    strike_dates = Column(JSON, nullable=True)

    # Relationships
    user = relationship("User", backref="collective_memberships")
    group = relationship("CollectiveGroup", back_populates="memberships")
    shares_given = relationship("CollectiveShare", foreign_keys="CollectiveShare.sharer_id", back_populates="sharer")
    shares_received = relationship("CollectiveShare", foreign_keys="CollectiveShare.recipient_id", back_populates="recipient")

    def __repr__(self):
        return f"<CollectiveMembership(user_id={self.user_id}, group_id={self.group_id}, status={self.status})>"


# ==================== COLLECTIVE SCHEDULE ====================
class CollectiveSchedule(Base):
    __tablename__ = "collective_schedules"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("collective_groups.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Schedule details
    scheduled_date = Column(Date, nullable=False)
    day_of_week = Column(String(10), nullable=False)

    # Share execution
    content_id = Column(Integer, ForeignKey("contents.id", ondelete="SET NULL"), nullable=True)
    shared_at = Column(DateTime, nullable=True)
    status = Column(SQLEnum(ScheduleStatus), default=ScheduleStatus.PENDING)

    # Notifications
    reminder_sent = Column(Boolean, default=False)
    reminder_sent_at = Column(DateTime, nullable=True)

    # Legacy/compatibility
    is_completed = Column(Boolean, default=False)
    completion_rate = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    group = relationship("CollectiveGroup", back_populates="schedules")
    user = relationship("User", foreign_keys=[user_id], backref="collective_schedules")
    target_user = relationship("User", foreign_keys=[target_user_id], backref="target_schedules")
    content = relationship("Content", backref="scheduled_shares")

    def __repr__(self):
        return f"<CollectiveSchedule(user_id={self.user_id}, scheduled_date={self.scheduled_date}, status={self.status})>"


# ==================== COLLECTIVE SHARE ====================
class CollectiveShare(Base):
    __tablename__ = "collective_shares"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("collective_groups.id", ondelete="CASCADE"), nullable=False)
    schedule_id = Column(Integer, ForeignKey("collective_schedules.id", ondelete="CASCADE"), nullable=False)

    # Who's sharing whose content
    sharer_id = Column(Integer, ForeignKey("collective_memberships.id", ondelete="CASCADE"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("collective_memberships.id", ondelete="CASCADE"), nullable=False)
    content_id = Column(Integer, ForeignKey("contents.id", ondelete="SET NULL"), nullable=True)

    # Tracking details
    tracking_code = Column(String(100), unique=True, index=True)
    share_url = Column(Text, nullable=True)

    # Status & verification
    status = Column(SQLEnum(ShareStatus), default=ShareStatus.PENDING)
    verified_at = Column(DateTime, nullable=True)

    # Engagement metrics
    click_count = Column(Integer, default=0)
    engagement_rate = Column(Float, default=0.0)
    conversion_count = Column(Integer, default=0)

    # Quality scoring
    quality_score = Column(Float, nullable=True)

    # Timestamps
    due_date = Column(Date, nullable=False)
    shared_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    group = relationship("CollectiveGroup", back_populates="shares")
    schedule = relationship("CollectiveSchedule", backref="shares")
    sharer = relationship("CollectiveMembership", foreign_keys=[sharer_id], back_populates="shares_given")
    recipient = relationship("CollectiveMembership", foreign_keys=[recipient_id], back_populates="shares_received")
    content = relationship("Content", backref="collective_shares")

    def __repr__(self):
        return f"<CollectiveShare(sharer_id={self.sharer_id}, recipient_id={self.recipient_id}, status={self.status})>"


# ==================== COLLECTIVE ACTIVITY LOG ====================
class CollectiveActivityLog(Base):
    __tablename__ = "collective_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("collective_groups.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)

    # Activity details
    action = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    activity_metadata = Column("metadata", JSON, nullable=True)

    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    group = relationship("CollectiveGroup", backref="activity_logs")
    user = relationship("User", backref="collective_activity_logs")

    def __repr__(self):
        return f"<CollectiveActivityLog(action={self.action}, timestamp={self.timestamp})>"
