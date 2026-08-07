# backend/app/models/follow.py

from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class Follow(Base):
    __tablename__ = "follows"

    __table_args__ = (
        UniqueConstraint('follower_id', 'following_id', name='unique_follow'),
    )

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    following_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships - must match User model's back_populates
    follower = relationship("User", foreign_keys=[follower_id], back_populates="following_relations")
    following = relationship("User", foreign_keys=[following_id], back_populates="follower_relations")
