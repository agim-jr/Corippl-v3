from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime
import logging

from ..models.content import Content
from ..models.pool_submission import PoolSubmission as PoolSubmissionModel
from ..models.pool_review import PoolReview as PoolReviewModel
from ..models.schemas import (
    PoolContent,
    PoolReviewResponse,
    PoolSubmissionResponse,
    PoolContentList,
    PoolActivity,
    PoolReviewSubmitResponse,
    PoolSubmissionSubmitResponse
)

logger = logging.getLogger(__name__)


class PoolService:
    """Service for managing Pool content review and submissions"""

    @staticmethod
    def get_pool_content(
        db: Session,
        category: Optional[str] = None,
        min_rating: Optional[float] = None,
        limit: int = 50,
        offset: int = 0
    ) -> PoolContentList:
        """
        Get content available in the Pool
        Only returns content with status='active'
        """
        query = db.query(Content).filter(Content.status == "active")

        # Filter by category if provided
        if category:
            query = query.filter(Content.categories.contains([category]))

        # Filter by minimum rating if provided
        if min_rating:
            query = query.filter(Content.pool_average_rating >= min_rating)

        # Order by engagement score (highest first)
        query = query.order_by(Content.engagement_score.desc())

        # Get total count before pagination
        total_count = query.count()

        # Apply pagination
        contents = query.offset(offset).limit(limit).all()

        # Convert to Pydantic models
        pool_contents = [
            PoolContent(
                id=content.id,
                title=content.title,
                description=content.description,
                url=content.url,
                content_type=content.content_type,
                categories=content.categories or [],
                pool_review_count=content.pool_review_count or 0,
                pool_average_rating=content.pool_average_rating or 0.0,
                pool_claim_count=content.pool_claim_count or 0,
                engagement_score=content.engagement_score or 0.0,
                created_at=content.created_at
            )
            for content in contents
        ]

        return PoolContentList(
            success=True,
            contents=pool_contents,
            count=total_count
        )

    @staticmethod
    def submit_review(
        db: Session,
        user_id: int,
        content_id: int,
        rating: int,
        feedback: Optional[str] = None
    ) -> PoolReviewSubmitResponse:
        """
        Submit a review for Pool content
        Updates Content's pool_review_count and pool_average_rating
        """
        # Verify content exists and is active
        content = db.query(Content).filter(
            Content.id == content_id,
            Content.status == "active"
        ).first()

        if not content:
            raise ValueError("Content not found or not active")

        # Check if user already reviewed this content
        existing = db.query(PoolReviewModel).filter(
            and_(
                PoolReviewModel.user_id == user_id,
                PoolReviewModel.content_id == content_id
            )
        ).first()

        if existing:
            raise ValueError("You have already reviewed this content")

        # Create review
        review = PoolReviewModel(
            user_id=user_id,
            content_id=content_id,
            rating=rating,
            feedback=feedback
        )
        db.add(review)

        # Update content metrics
        # Calculate new review count
        total_reviews = db.query(func.count(PoolReviewModel.id)).filter(
            PoolReviewModel.content_id == content_id
        ).scalar() or 0

        # Calculate new average rating
        avg_rating = db.query(func.avg(PoolReviewModel.rating)).filter(
            PoolReviewModel.content_id == content_id
        ).scalar() or 0.0

        content.pool_review_count = total_reviews + 1
        content.pool_average_rating = float(avg_rating)

        # Calculate engagement score
        # Formula: (reviews * 2) + (avg_rating * 2) + (submissions * 3)
        content.engagement_score = (
            (content.pool_review_count * 2) +
            (content.pool_average_rating * 2) +
            ((content.pool_claim_count or 0) * 3)
        )

        db.commit()

        return PoolReviewSubmitResponse(
            success=True,
            content_id=content_id,
            total_reviews=content.pool_review_count,
            average_rating=content.pool_average_rating,
            engagement_score=content.engagement_score
        )

    @staticmethod
    def submit_content(
        db: Session,
        user_id: int,
        title: str,
        original_url: str,
        category: str,
        pitch: Optional[str] = None
    ) -> PoolSubmissionSubmitResponse:
        """
        Submit content to Pool for review
        """
        # Check if URL already submitted by this user
        existing = db.query(PoolSubmissionModel).filter(
            and_(
                PoolSubmissionModel.user_id == user_id,
                PoolSubmissionModel.original_url == original_url
            )
        ).first()

        if existing:
            raise ValueError("You have already submitted this URL")

        # Create submission
        submission = PoolSubmissionModel(
            user_id=user_id,
            title=title,
            original_url=original_url,
            category=category,
            pitch=pitch,
            status="pending"  # Requires approval
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)

        submission_response = PoolSubmissionResponse(
            id=submission.id,
            user_id=submission.user_id,
            content_id=submission.content_id,
            title=submission.title,
            original_url=submission.original_url,
            category=submission.category,
            pitch=submission.pitch,
            status=submission.status,
            review_count=submission.review_count or 0,
            average_rating=submission.average_rating or 0.0,
            created_at=submission.created_at,
            approved_at=submission.approved_at
        )

        return PoolSubmissionSubmitResponse(
            success=True,
            submission=submission_response
        )

    @staticmethod
    def auto_submit_from_regular_content(
        db: Session,
        content_id: int,
        user_id: int,
        original_url: str,
        title: str,
        categories: List[str],
        pitch: Optional[str] = None
    ) -> PoolSubmissionModel:
        """
        Auto-submits regular content to the Pool for community review.
        Called when users create content via POST /content/

        Key differences from manual submission:
        - Bypasses credit cost (no deduction)
        - Links immediately to content_id
        - Status starts as 'approved' (already in circulation)
        - Still earns review credits for reviewers
        """
        # Check if already submitted
        existing = db.query(PoolSubmissionModel).filter(
            PoolSubmissionModel.content_id == content_id
        ).first()

        if existing:
            logger.info(f"Content {content_id} already in pool")
            return existing

        # Get primary category
        primary_category = categories[0] if categories else "General"

        # Create pool submission
        submission = PoolSubmissionModel(
            user_id=user_id,
            content_id=content_id,  # ✅ LINKED IMMEDIATELY
            title=title,
            original_url=original_url,
            category=primary_category,
            pitch=pitch,
            status="approved",  # ✅ AUTO-APPROVED (already in circulation)
            review_count=0,
            average_rating=0.0,
            created_at=datetime.utcnow(),
            approved_at=datetime.utcnow()  # ✅ APPROVED NOW
        )

        db.add(submission)
        db.commit()
        db.refresh(submission)

        logger.info(f"✅ Content {content_id} auto-submitted to Pool as submission {submission.id}")
        return submission

    @staticmethod
    def get_user_activity(
        db: Session,
        user_id: int
    ) -> PoolActivity:
        """
        Get user's Pool activity (reviews and submissions)
        """
        # Get all reviews by user
        reviews = db.query(PoolReviewModel).filter(
            PoolReviewModel.user_id == user_id
        ).all()

        # Get all submissions by user
        submissions = db.query(PoolSubmissionModel).filter(
            PoolSubmissionModel.user_id == user_id
        ).all()

        # Convert to response models
        review_responses = [
            PoolReviewResponse(
                id=r.id,
                user_id=r.user_id,
                content_id=r.content_id,
                rating=r.rating,
                feedback=r.feedback,
                created_at=r.created_at
            )
            for r in reviews
        ]

        submission_responses = [
            PoolSubmissionResponse(
                id=s.id,
                user_id=s.user_id,
                content_id=s.content_id,
                title=s.title,
                original_url=s.original_url,
                category=s.category,
                pitch=s.pitch,
                status=s.status,
                review_count=s.review_count or 0,
                average_rating=s.average_rating or 0.0,
                created_at=s.created_at,
                approved_at=s.approved_at
            )
            for s in submissions
        ]

        return PoolActivity(
            success=True,
            reviews=review_responses,
            submissions=submission_responses,
            total_reviews=len(reviews),
            total_submissions=len(submissions)
        )
