from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
import logging

from ..models.quick_connect import QuickConnectRequest, QuickConnectHelp, QuickConnectToken
from ..models.profile import Profile
from ..models.user import User

logger = logging.getLogger(__name__)


class QuickConnectService:
    """Business logic for Quick Connects matching algorithm"""

    @staticmethod
    def calculate_smart_matches(
        db: Session,
        user_id: int,
        limit: int = 20
    ) -> List[Dict]:
        """
        Smart matching algorithm for Quick Connects.
        Matches requests based on:
        1. Skills/interests overlap
        2. Past help quality
        3. Token rewards
        4. Urgency
        """
        user_profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        user_tokens = db.query(QuickConnectToken).filter(
            QuickConnectToken.user_id == user_id
        ).first()

        # Get all open requests (exclude user's own)
        open_requests = db.query(QuickConnectRequest).filter(
            QuickConnectRequest.status == "open",
            QuickConnectRequest.user_id != user_id
        ).all()

        matches = []
        for request in open_requests:
            score = QuickConnectService._calculate_match_score(
                request, user_profile, user_tokens, db
            )

            matches.append({
                "request": request,
                "match_score": score
            })

        # Sort by match score
        matches.sort(key=lambda x: x["match_score"], reverse=True)

        return matches[:limit]

    @staticmethod
    def _calculate_match_score(
        request: QuickConnectRequest,
        user_profile: Optional[Profile],
        user_tokens: Optional[QuickConnectToken],
        db: Session
    ) -> float:
        """
        Calculate match score (0-100) based on multiple factors.
        """
        score = 50.0  # Base score

        if not user_profile:
            return score

        # 1. Skills/interests match (30 points)
        if user_profile.categories and request.category:
            if request.category in user_profile.categories:
                score += 30

        # 2. Tags overlap (20 points)
        if user_profile.interests and request.tags:
            request_tags = set(request.tags.split(',') if isinstance(request.tags, str) else [])
            user_interests = set(user_profile.interests)
            overlap = len(request_tags & user_interests)
            score += min(20, overlap * 5)

        # 3. Token reward attractiveness (15 points)
        if user_tokens:
            if request.token_reward >= 100:
                score += 15
            elif request.token_reward >= 50:
                score += 10
            else:
                score += 5

        # 4. Urgency boost (10 points)
        if request.urgency == "high":
            score += 10
        elif request.urgency == "normal":
            score += 5

        # 5. User reputation bonus (10 points)
        if user_tokens and user_tokens.reputation_score >= 7.0:
            score += 10

        # 6. Freshness (5 points for requests < 24 hours old)
        time_since_creation = datetime.utcnow() - request.created_at
        if time_since_creation < timedelta(hours=24):
            score += 5

        return min(100, score)

    @staticmethod
    def get_recommended_requests(
        db: Session,
        user_id: int,
        category: Optional[str] = None,
        min_tokens: Optional[int] = None
    ) -> List[Dict]:
        """
        Get personalized request recommendations.
        """
        matches = QuickConnectService.calculate_smart_matches(db, user_id)

        # Apply filters
        if category:
            matches = [m for m in matches if m["request"].category == category]

        if min_tokens:
            matches = [m for m in matches if m["request"].token_reward >= min_tokens]

        return matches

    @staticmethod
    def get_user_stats(db: Session, user_id: int) -> Dict:
        """
        Get comprehensive stats for a user's Quick Connects activity.
        """
        user_tokens = db.query(QuickConnectToken).filter(
            QuickConnectToken.user_id == user_id
        ).first()

        if not user_tokens:
            return {
                "balance": 0,
                "reputation_score": 0,
                "help_given": 0,
                "help_received": 0
            }

        return {
            "balance": user_tokens.balance,
            "lifetime_earned": user_tokens.lifetime_earned,
            "lifetime_spent": user_tokens.lifetime_spent,
            "reputation_score": user_tokens.reputation_score,
            "help_given_count": user_tokens.help_given_count,
            "help_received_count": user_tokens.help_received_count,
            "average_rating": user_tokens.average_rating
        }
