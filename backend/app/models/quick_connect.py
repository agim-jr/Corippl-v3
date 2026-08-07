from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime, Float, CheckConstraint, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from .base import Base


class QuickConnectRequest(Base):
    """User requests for help (e.g., 'Need beta testers', 'Looking for guest bloggers')"""
    __tablename__ = "quick_connect_requests"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)  # CHANGED FROM user_id
    content_id = Column(Integer, ForeignKey("contents.id", ondelete="SET NULL"), nullable=True)  # ✅ ADD THIS

    # Request details
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)  # CHANGED from 100 to 50 to match DB
    tags = Column(ARRAY(String), default=list)  # CHANGED to match DB's text[] type

    # Token economics
    token_reward = Column(Integer, default=50, nullable=False)
    tokens_earned = Column(Integer, default=0)

    # Status tracking
    status = Column(String(20), default="open")
    urgency = Column(String(20), default="normal")

    # Engagement metrics
    view_count = Column(Integer, default=0)
    help_count = Column(Integer, default=0)

    # Matching algorithm fields
    match_score = Column(Float, default=0.0)
    target_audience = Column(Text, nullable=True)

    # Timestamps - UPDATED to match DB
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())  # ADDED
    expires_at = Column(DateTime(timezone=True), nullable=True)  # ✅ ADDED timezone=True
    completed_at = Column(DateTime(timezone=True), nullable=True)  # ✅ ADDED timezone=True

    # Relationships - UPDATED
    requester = relationship("User", foreign_keys=[requester_id], back_populates="quick_connect_requests")
    help_responses = relationship("QuickConnectHelp", back_populates="request", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<QuickConnectRequest(id={self.id}, title={self.title[:30]}, status={self.status})>"


class QuickConnectHelp(Base):
    """Responses/help provided for requests"""
    __tablename__ = "quick_connect_help"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("quick_connect_requests.id", ondelete="CASCADE"), nullable=False)
    helper_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Help details
    message = Column(Text, nullable=False)
    status = Column(String(20), default="pending")  # pending, accepted, completed

    # Quality/feedback
    rating = Column(Integer, nullable=True)  # 1-5 stars from requester
    feedback = Column(Text, nullable=True)

    # Token tracking
    tokens_awarded = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())  # UPDATED
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())  # ✅ ADDED
    accepted_at = Column(DateTime(timezone=True), nullable=True)  # ✅ ADDED timezone=True
    completed_at = Column(DateTime(timezone=True), nullable=True)  # ✅ ADDED timezone=True

    # Relationships
    request = relationship("QuickConnectRequest", back_populates="help_responses")
    helper = relationship("User", foreign_keys=[helper_id])

    def __repr__(self):
        return f"<QuickConnectHelp(id={self.id}, request_id={self.request_id}, status={self.status})>"


class QuickConnectToken(Base):
    """Token balance and transaction history"""
    __tablename__ = "quick_connect_tokens"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Token balance
    balance = Column(Integer, default=100)  # Starting tokens for new users
    lifetime_earned = Column(Integer, default=0)
    lifetime_spent = Column(Integer, default=0)

    # Reputation/trust score
    reputation_score = Column(Float, default=5.0)  # 0-10 scale
    help_given_count = Column(Integer, default=0)
    help_received_count = Column(Integer, default=0)

    # Quality metrics
    average_rating = Column(Float, default=0.0)
    total_ratings = Column(Integer, default=0)

    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())  # UPDATED

    # Relationship
    user = relationship("User", back_populates="quick_connect_tokens")

    def __repr__(self):
        return f"<QuickConnectToken(user_id={self.user_id}, balance={self.balance}, reputation={self.reputation_score})>"

        # ✅ ADD THESE LINES:
    @property
    def tokens(self):
        """Alias for balance to maintain backward compatibility"""
        return self.balance

    @tokens.setter
    def tokens(self, value):
        self.balance = value
