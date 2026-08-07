from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base


class PoolSubmission(Base):
    __tablename__ = "pool_submissions"
    __table_args__ = (
        UniqueConstraint('user_id', 'original_url', name='unique_user_url'),
        {'extend_existing': True}  # ✅ FIX: Allow table redefinition
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content_id = Column(Integer, ForeignKey("contents.id", ondelete="SET NULL"), nullable=True)

    title = Column(String(500), nullable=False)
    original_url = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    pitch = Column(Text, nullable=True)

    status = Column(String(20), default="pending")  # pending, approved, rejected
    review_count = Column(Integer, default=0)
    average_rating = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)

    ai_embedding = Column(JSON, nullable=True)
    ai_topics = Column(JSON, nullable=True)
    ai_quality_score = Column(Integer, default=0)
    ai_last_analyzed = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="pool_submissions")
    content = relationship("Content", back_populates="pool_submission")

    def __repr__(self):
        return f"<PoolSubmission(id={self.id}, title={self.title[:50]}, status={self.status})>"
