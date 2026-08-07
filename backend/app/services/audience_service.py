# backend/app/services/audience_service.py

from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from app.models.audience import Audience
from app.models.schemas import AudienceCreate, AudienceUpdate
from ..models.user import User
from ..models.content import Content
from ..models.conversion import Conversion
import logging
from sqlalchemy import func
from datetime import datetime, timedelta
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

def compute_audience_score(db: Session, audience: Audience) -> float:
    """
    Compute the audience score based on size, growth, engagement, and authenticity.
    """
    try:
        # Audience Size: Number of interests
        audience_size = len(audience.interests) if audience.interests else 0

        # Growth: Number of new followers or interests in the past month
        one_month_ago = datetime.utcnow() - timedelta(days=30)
        # Placeholder: Count of new content pieces in the past month
        new_contents = db.query(Content).filter(
            Content.user_id == audience.user_id,
            Content.created_at >= one_month_ago
        ).count()

        # Engagement Rates: Average likes, comments, shares
        avg_likes = db.query(func.avg(Content.likes)).filter(Content.user_id == audience.user_id).scalar() or 0
        avg_comments = db.query(func.avg(Content.comments)).filter(Content.user_id == audience.user_id).scalar() or 0
        avg_shares = db.query(func.avg(Content.shares)).filter(Content.user_id == audience.user_id).scalar() or 0
        engagement = (avg_likes + avg_comments + avg_shares) / 3

        # Authenticity: Ratio of real followers vs. bots
        total_followers = db.query(User).filter(User.id == audience.user_id).count()
        bot_followers = db.query(User).filter(User.id == audience.user_id, User.is_bot == True).count()
        authenticity = (total_followers - bot_followers) / total_followers if total_followers > 0 else 0

        # Audience Overlap with Platform Interests (Optional)
        platform_interests = ["Technology", "Health", "Art", "Education"]  # Example platform interests
        user_interests = audience.interests or []
        overlap = (
            len(set(platform_interests).intersection(set(user_interests))) / len(platform_interests)
            if platform_interests else 0
        )

        # Define weights for each factor
        weights = {
            "size": 0.3,
            "growth": 0.2,
            "engagement": 0.3,
            "authenticity": 0.1,
            "overlap": 0.1
        }

        # Normalize scores and apply weights
        size_score = min(audience_size / 50, 1) * weights["size"]  # Assuming max size=50
        growth_score = min(new_contents / 20, 1) * weights["growth"]  # Assuming max growth=20
        engagement_score = min(engagement / 100, 1) * weights["engagement"]  # Adjust based on expected max
        authenticity_score = authenticity * weights["authenticity"]
        overlap_score = min(overlap, 1) * weights["overlap"]

        # Calculate total score
        total_score = (size_score + growth_score + engagement_score + authenticity_score + overlap_score) * 100
        total_score = max(0, min(total_score, 100))  # Ensure score is within 0-100

        return total_score
    except Exception as e:
        logger.error(f"Error computing audience score for user ID {audience.user_id}: {e}")
        return 0.0

def update_audience_scores(db: Session):
    """
    Update the audience scores for all users.
    This function can be scheduled to run periodically (e.g., weekly).
    """
    try:
        audiences = db.query(Audience).all()
        for audience in audiences:
            score = compute_audience_score(db, audience)
            audience.score = score
        db.commit()
        logger.info("Successfully updated audience scores for all users.")
    except Exception as e:
        logger.error(f"Error updating audience scores: {e}")
        db.rollback()

class AudienceService:
    def __init__(self, db: Session):
        self.db = db

    def get_audience_by_user_id(self, user_id: int) -> Optional[Audience]:
        return self.db.query(Audience).filter(Audience.user_id == user_id).first()

    def create_audience(self, user_id: int, audience_data: AudienceCreate) -> Audience:
        try:
            audience = Audience(
                user_id=user_id,
                demographics=audience_data.demographics,
                interests=audience_data.interests,
                interaction_patterns=audience_data.interaction_patterns,
            )
            self.db.add(audience)
            self.db.commit()
            self.db.refresh(audience)
            return audience
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating audience for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create audience"
            )

    def update_audience(self, user_id: int, audience_update: AudienceUpdate) -> Optional[Audience]:
        try:
            audience = self.get_audience_by_user_id(user_id)
            if not audience:
                return None
            for key, value in audience_update.dict(exclude_unset=True).items():
                setattr(audience, key, value)
            self.db.commit()
            self.db.refresh(audience)
            return audience
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating audience for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update audience"
            )

    def delete_audience(self, user_id: int) -> bool:
        try:
            audience = self.get_audience_by_user_id(user_id)
            if not audience:
                return False
            self.db.delete(audience)
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting audience for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete audience"
            )

    def list_all_audiences(self) -> List[Audience]:
        return self.db.query(Audience).all()
