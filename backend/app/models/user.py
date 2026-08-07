# backend/app/models/user.py

from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, JSON, UniqueConstraint, Float
from sqlalchemy.orm import relationship
from .base import Base
from datetime import datetime, timedelta, date
from sqlalchemy.dialects.postgresql import ARRAY


class User(Base):
    __tablename__ = "users"

    __table_args__ = (
       UniqueConstraint('oauth_provider', 'oauth_id', name='uq_oauth_provider_id'),
    )

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    interests = Column(ARRAY(String), nullable=True)
    skills = Column(ARRAY(String), nullable=True)
    profile_picture = Column(String(255), nullable=True)
    share_count = Column(Integer, default=0)
    last_active = Column(DateTime, default=datetime.utcnow, nullable=True)
    has_profile_completed = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)
    daily_share_count = Column(Integer, default=0)
    last_share_date = Column(Date, default=date.today)
    outgoing_shares_count = Column(Integer, default=0)
    google_id = Column(String, unique=True, nullable=True, index=True)
    oauth_provider = Column(String, nullable=True)
    oauth_id = Column(String, nullable=True, index=True)
    remaining_shuffles = Column(Integer, default=5)
    last_shuffle_reset = Column(DateTime, default=datetime.utcnow)
    bonus_shuffles = Column(Integer, default=0)
    weekly_submission_count = Column(Integer, default=0)
    last_submission_date = Column(Date, default=date.today)
    reset_password_token = Column(String, nullable=True, unique=True, index=True)
    reset_password_expire = Column(DateTime, nullable=True)
    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String, nullable=True, unique=True, index=True)
    email_verification_expire = Column(DateTime, nullable=True)
    login_count = Column(Integer, default=0)
    unlock_credits = Column(Integer, default=0)
    has_seen_share_reward_modal = Column(Boolean, default=False, nullable=False)
    last_share_reward_time = Column(DateTime, nullable=True)
    share_rewards_claimed = Column(Integer, default=0, nullable=False)
    premium_until = Column(DateTime, nullable=True)
    has_shared_content = Column(Boolean, default=False, nullable=False)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    last_password_change = Column(DateTime, default=datetime.utcnow, nullable=True)

    # Trial and Stripe fields
    trial_used = Column(Boolean, default=False, nullable=False)
    trial_start_date = Column(DateTime, nullable=True)
    trial_end_date = Column(DateTime, nullable=True)
    stripe_subscription_id = Column(String, nullable=True, index=True)
    stripe_customer_id = Column(String, nullable=True, index=True)

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False)
    contents = relationship("Content", back_populates="user")
    shares = relationship("Share", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    contacts = relationship("Contact", back_populates="user", cascade="all, delete-orphan")
    analytics = relationship("UserAnalytics", back_populates="user", uselist=False)
    flags = relationship("Flag", back_populates="user", cascade="all, delete-orphan")
    audience = relationship("Audience", back_populates="user", uselist=False)
    conversions = relationship("Conversion", back_populates="user")
    preferences = relationship("Preference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    share_mappings = relationship("ShareMapping", back_populates="user", cascade="all, delete-orphan")

    # Pool relationships
    pool_reviews = relationship("PoolReview", back_populates="user", cascade="all, delete-orphan", lazy="dynamic")
    pool_submissions = relationship("PoolSubmission", back_populates="user", cascade="all, delete-orphan", lazy="dynamic")

    # Quick Connect relationships
    quick_connect_requests = relationship("QuickConnectRequest", foreign_keys="[QuickConnectRequest.requester_id]", back_populates="requester", cascade="all, delete-orphan")
    quick_connect_tokens = relationship("QuickConnectToken", back_populates="user", uselist=False, cascade="all, delete-orphan")

    # Message relationships
    sent_messages = relationship("Message", foreign_keys="[Message.sender_id]", back_populates="sender", cascade="all, delete-orphan")
    received_messages = relationship("Message", foreign_keys="[Message.recipient_id]", back_populates="recipient", cascade="all, delete-orphan")

    # Follow relationships
    following_relations = relationship("Follow", foreign_keys="[Follow.follower_id]", back_populates="follower", cascade="all, delete-orphan")
    follower_relations = relationship("Follow", foreign_keys="[Follow.following_id]", back_populates="following", cascade="all, delete-orphan")

    # Properties for premium access checking
    @property
    def has_premium_access(self) -> bool:
        """Check if user has premium access (active subscription or trial)"""
        return self.is_premium

    @property
    def subscription_tier(self) -> str:
        """Get user's subscription tier as a string"""
        return 'pro' if self.is_premium else 'free'

    @property
    def tier_limits(self) -> dict:
        """Get tier-specific limits for this user"""
        from ..utils.tier_limits import get_tier_limits
        return get_tier_limits(self.subscription_tier)

    @property
    def is_on_trial(self) -> bool:
        """Check if user is currently on a free trial"""
        if not self.trial_end_date or not self.is_premium:
            return False
        return datetime.utcnow() < self.trial_end_date

    @property
    def trial_days_remaining(self) -> int:
        """Get number of days remaining in trial"""
        if not self.is_on_trial:
            return 0
        delta = self.trial_end_date - datetime.utcnow()
        return max(0, delta.days)

    @property
    def can_start_trial(self) -> bool:
        """Check if user is eligible to start a free trial"""
        return not self.trial_used and not self.is_premium

    @property
    def subscription_status(self) -> str:
        """
        Get detailed subscription status
        Returns: 'trial', 'active', 'expired', or 'free'
        """
        if self.is_on_trial:
            return 'trial'
        elif self.is_premium:
            # Check if premium_until is set and still valid
            if self.premium_until and datetime.utcnow() < self.premium_until:
                return 'active'
            return 'expired'
        return 'free'
