from sqlalchemy import Column, Integer, Text, ForeignKey, Boolean, DateTime, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base


class PoolReview(Base):
    __tablename__ = "pool_reviews"
    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='rating_range'),
        UniqueConstraint('user_id', 'content_id', name='unique_user_content_review'),
        {'extend_existing': True}  # ✅ FIX: Allow table redefinition
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content_id = Column(Integer, ForeignKey("contents.id", ondelete="CASCADE"), nullable=False)

    rating = Column(Integer, nullable=False)
    feedback = Column(Text, nullable=True)
    categories_match = Column(Boolean, default=True)
    is_spam = Column(Boolean, default=False)
    is_quality = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="pool_reviews")
    content = relationship("Content", back_populates="pool_reviews")

    def __repr__(self):
        return f"<PoolReview(id={self.id}, rating={self.rating}, user_id={self.user_id})>"
