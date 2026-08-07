# backend/app/api/pool_routes.py

from fastapi import APIRouter, Depends, HTTPException, Body, status
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime, date, timedelta
from sqlalchemy import func, or_, desc, distinct
import logging

from ..database import get_db
from ..models.user import User
from ..models.content import Content, ContentTypeEnum
from ..utils.tier_limits import get_tier_limits
from ..models.pool_submission import PoolSubmission
from ..models.pool_review import PoolReview
from ..models.profile import Profile
from ..models.contact import Contact
from ..models.notification import Notification
from ..services.ai_hybrid_service import get_ai_engine
from ..utils.dependencies import get_current_user
from ..models.message import Message
from ..models.follow import Follow

# Import the new schemas
from ..models.schemas import (
    MessageResponse,
    ConversationResponse,
    MessageThreadResponse,
    FollowResponse,
    FollowStatusResponse,
    FollowListResponse,
    FollowStatsResponse
)


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/pool", tags=["Pool"])


# ==================== PYDANTIC MODELS ====================
class PoolSubmissionCreate(BaseModel):
    title: str
    original_url: str
    category: str
    pitch: Optional[str] = None


class PoolReviewCreate(BaseModel):
    content_id: int
    rating: int
    feedback: Optional[str] = None
    categories_match: bool = True
    is_spam: bool = False
    is_quality: bool = True


# ==================== HELPER FUNCTIONS ====================
def calculate_alignment_score(submission: PoolSubmission, user_profile: Optional[Profile], db: Session) -> int:
    """Calculate 0-100 alignment score based on niche, audience size, content quality"""
    score = 50  # Base score

    if not user_profile:
        return score

    # Category match (+30 points)
    if user_profile.categories and submission.category in user_profile.categories:
        score += 30

    # Get submission creator's profile
    creator_profile = db.query(Profile).filter(Profile.user_id == submission.user_id).first()

    if creator_profile:
        # Interest overlap (+20 points)
        if user_profile.interests and creator_profile.interests:
            overlap = set(user_profile.interests) & set(creator_profile.interests)
            score += min(20, len(overlap) * 5)

        # Similar audience size estimation (+10 points)
        user_content_count = db.query(func.count(Content.id)).filter(
            Content.user_id == user_profile.user_id
        ).scalar() or 0

        creator_content_count = db.query(func.count(Content.id)).filter(
            Content.user_id == submission.user_id
        ).scalar() or 0

        if abs(user_content_count - creator_content_count) <= 5:
            score += 10

    # Content quality indicator
    if submission.review_count and submission.review_count > 2:
        if submission.average_rating and submission.average_rating >= 4.0:
            score += 10

    return min(100, score)


def generate_match_reason(submission: PoolSubmission, user_profile: Optional[Profile]) -> str:
    """Generate human-readable match reason"""
    if not user_profile:
        return "New creator in your niche"

    reasons = []

    if user_profile.categories and submission.category in user_profile.categories:
        reasons.append(f"Both create {submission.category} content")

    reasons.append("Similar growth stage")

    if not reasons:
        return "Algorithmically matched to your interests"

    return " • ".join(reasons)


def generate_collab_idea(category: str) -> str:
    """Generate collaboration suggestions based on category"""
    ideas = {
        "Technology": "Co-author a technical tutorial series",
        "Business": "Joint case study or interview exchange",
        "Productivity": "Cross-promote productivity tools/workflows",
        "Health": "Wellness challenge collaboration",
        "Entertainment": "Creative project partnership"
    }
    return ideas.get(category, "Guest post exchange series")


def calculate_streak(review_dates: list) -> int:
    """Calculate consecutive days with reviews"""
    if not review_dates:
        return 0

    streak = 1
    today = date.today()

    # Check if most recent is today or yesterday
    most_recent = review_dates[0][0]
    if (today - most_recent).days > 1:
        return 0

    for i in range(1, len(review_dates)):
        prev_date = review_dates[i-1][0]
        curr_date = review_dates[i][0]

        if (prev_date - curr_date).days == 1:
            streak += 1
        else:
            break

    return streak


# ==================== GET POOL QUEUE (SHOW APPROVED CONTENT ONLY) ====================
@router.get("/queue")
def get_pool_queue(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get content queue - shows APPROVED content only (status='approved')
    Pending content is not shown until it's unlocked by earning credits
    """
    # Get tier limits
    user_tier = current_user.subscription_tier
    limits = get_tier_limits(user_tier)

    # Apply tier-based result limits
    result_limit = 50 if limits['queue_unlimited'] else 20

    # Get user's profile for alignment matching
    user_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()

    # Get IDs of content user already reviewed
    reviewed_ids = db.query(PoolReview.content_id).filter(
        PoolReview.user_id == current_user.id
    ).subquery()

    # ✅ Show approved submissions only (user can't review pending ones)
    query = db.query(PoolSubmission).filter(
        PoolSubmission.status == "approved",  # ✅ Only approved content
        PoolSubmission.user_id != current_user.id,  # ✅ Can't review own content
        ~PoolSubmission.content_id.in_(reviewed_ids)
    )

    # Filter by category if user has preferences
    if user_profile and user_profile.categories:
        query = query.filter(PoolSubmission.category.in_(user_profile.categories))
    elif category:
        query = query.filter(PoolSubmission.category == category)

    submissions = query.order_by(PoolSubmission.created_at.asc()).limit(result_limit).all()

    # Add alignment scoring
    results = []
    for s in submissions:
        alignment_score = calculate_alignment_score(s, user_profile, db)
        match_reason = generate_match_reason(s, user_profile)

        results.append({
            "id": s.id,
            "content_id": s.content_id,
            "title": s.title,
            "original_url": s.original_url,
            "category": s.category,
            "pitch": s.pitch,
            "review_count": s.review_count,
            "average_rating": s.average_rating,
            "submitted_at": s.created_at.isoformat(),
            "alignment_score": alignment_score,
            "match_reason": match_reason
        })

    return {
        'results': results,
        'tier_info': {
            'tier': user_tier,
            'daily_limit': limits['queue_daily_limit'],
            'is_unlimited': limits['queue_unlimited'],
            'results_shown': len(results),
            'max_results': result_limit
        }
    }


# ==================== SUBMIT POOL REVIEW (AUTO-UNLOCK) ====================
@router.post("/review")
def submit_pool_review(
    review_data: PoolReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit review - EARNS 1 CREDIT and immediately unlocks pending content to 'active'
    """
    # Validate rating
    if review_data.rating < 1 or review_data.rating > 5:
        raise HTTPException(400, "Rating must be between 1 and 5")

    # Verify pool submission exists
    submission = db.query(PoolSubmission).filter(
        PoolSubmission.content_id == review_data.content_id
    ).first()

    if not submission:
        raise HTTPException(404, "Pool submission not found")

    # ✅ Allow reviewing both pending and approved content
    if submission.status not in ["pending", "approved"]:
        raise HTTPException(400, f"Cannot review content with status: {submission.status}")

    # Check if user already reviewed
    existing = db.query(PoolReview).filter(
        PoolReview.user_id == current_user.id,
        PoolReview.content_id == review_data.content_id
    ).first()

    if existing:
        raise HTTPException(400, "You've already reviewed this content")

    # ✅ Prevent reviewing own content
    if submission.user_id == current_user.id:
        raise HTTPException(400, "You cannot review your own content")

    # Create review
    review = PoolReview(
        user_id=current_user.id,
        content_id=review_data.content_id,
        rating=review_data.rating,
        feedback=review_data.feedback,
        categories_match=review_data.categories_match,
        is_spam=review_data.is_spam,
        is_quality=review_data.is_quality,
        created_at=datetime.utcnow()
    )
    db.add(review)

    # Update pool submission metrics
    submission.review_count = (submission.review_count or 0) + 1

    # Recalculate average rating
    avg_rating = db.query(func.avg(PoolReview.rating)).filter(
        PoolReview.content_id == review_data.content_id
    ).scalar() or 0.0

    submission.average_rating = float(avg_rating)

    # Update content service entry
    content = db.query(Content).filter(Content.id == review_data.content_id).first()
    if content:
        content.pool_review_count = submission.review_count
        content.pool_average_rating = submission.average_rating
        content.view_count = (content.view_count or 0) + 1

    # ✅ EARN CREDIT
# ✅ EARN CREDIT
    current_user.share_count += 1

    # ✅ IMMEDIATELY UNLOCK OLDEST PENDING CONTENT
    unlocked_content = None

    # Find reviewer's oldest pending submission
    pending_submission = db.query(PoolSubmission).filter(
        PoolSubmission.user_id == current_user.id,
        PoolSubmission.status == "pending"
    ).order_by(PoolSubmission.created_at).first()

    if pending_submission:
        # 🔥 FIX: Create content_id link if missing
        if not pending_submission.content_id:
            logger.warning(f"⚠️ Submission {pending_submission.id} missing content_id, creating now...")

            # Create the missing Content entry
            new_content = Content(
                user_id=current_user.id,
                title=pending_submission.title,
                description=pending_submission.pitch or "Content from pool submission",
                url=pending_submission.original_url,
                content_type=ContentTypeEnum.link,
                categories=[pending_submission.category],
                status="pending",  # Will be activated below
                created_at=pending_submission.created_at,
                share_count=0,
                required_shares=10,
                pool_review_count=0,
                pool_average_rating=0.0
            )
            db.add(new_content)
            db.flush()  # Get the ID

            # Link it
            pending_submission.content_id = new_content.id
            logger.info(f"✅ Created and linked content {new_content.id} to submission {pending_submission.id}")

        # Now get the content (either existing or just created)
        pending_content = db.query(Content).filter(
            Content.id == pending_submission.content_id
        ).first()

        if pending_content:
            # ✅ Activate the content
            pending_content.status = "active"

            # ✅ Approve the submission
            pending_submission.status = "approved"
            pending_submission.approved_at = datetime.utcnow()

            # Deduct the credit
            current_user.share_count -= 1

            unlocked_content = {
                "id": pending_content.id,
                "title": pending_content.title,
                "url": pending_content.url
            }
            logger.info(f"✅ Unlocked content {pending_content.id} for user {current_user.id}")
        else:
            logger.error(f"❌ Failed to find/create content for submission {pending_submission.id}")
    else:
        logger.info(f"No pending submissions to unlock for user {current_user.id}")

    db.commit()

    return {
        "success": True,
        "message": "🎉 Review submitted! Your content is now live in the queue!" if unlocked_content else "Review submitted! Keep reviewing to unlock your content.",
        "content_id": review_data.content_id,
        "total_reviews": submission.review_count,
        "average_rating": submission.average_rating,
        "unlocked_content": unlocked_content,
        "remaining_credits": current_user.share_count
    }


# ==================== SUBMIT TO POOL (AUTO-CREATE CONTENT) ====================
@router.post("/submit")
def submit_to_pool(
    submission_data: PoolSubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit content to pool - AUTOMATICALLY creates Content with status='pending'
    No admin approval needed. Content goes live after user earns review credits.
    """
    # Check submission limits
    user_tier = current_user.subscription_tier
    limits = get_tier_limits(user_tier)

    if not limits['submissions_unlimited']:
        # Count active submissions
        active_submissions = db.query(PoolSubmission).filter(
            PoolSubmission.user_id == current_user.id,
            PoolSubmission.status.in_(['pending', 'approved'])
        ).count()

        if active_submissions >= limits['max_active_submissions']:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    'error': 'Maximum active submissions reached',
                    'current': active_submissions,
                    'limit': limits['max_active_submissions'],
                    'upgrade_message': 'Upgrade to Pro for unlimited submissions'
                }
            )
    else:
        active_submissions = -1  # Unlimited

    # Validate URL
    if not submission_data.original_url.startswith(("http://", "https://")):
        raise HTTPException(400, "Invalid URL format")

    # Check for duplicate URL
    existing = db.query(PoolSubmission).filter(
        PoolSubmission.original_url == submission_data.original_url,
        PoolSubmission.user_id == current_user.id
    ).first()

    if existing:
        raise HTTPException(400, "You've already submitted this URL")

    # ✅ STEP 1: Create Content entry immediately with status='pending'
    content = Content(
        title=submission_data.title.strip(),
        description=submission_data.pitch or "Submitted via Pool",
        url=submission_data.original_url.strip(),
        content_type=ContentTypeEnum.link,
        categories=[submission_data.category],
        user_id=current_user.id,
        status="pending",  # ✅ Starts as pending
        share_count=0,
        required_shares=10,
        pool_review_count=0,
        pool_average_rating=0.0,
        created_at=datetime.utcnow()
    )
    db.add(content)
    db.flush()  # Get content.id

    # ✅ STEP 2: Create PoolSubmission linked to Content
    submission = PoolSubmission(
        user_id=current_user.id,
        content_id=content.id,  # ✅ Linked immediately
        title=submission_data.title.strip(),
        original_url=submission_data.original_url.strip(),
        category=submission_data.category,
        pitch=submission_data.pitch.strip() if submission_data.pitch else None,
        status="pending",  # ✅ Will be approved when user earns credits
        review_count=0,
        average_rating=0.0,
        created_at=datetime.utcnow()
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    db.refresh(content)

    logger.info(f"✅ User {current_user.id} submitted content {content.id} to pool (pending)")

    return {
        "success": True,
        "submission": {
            "id": submission.id,
            "content_id": content.id,  # ✅ Return content ID
            "title": submission.title,
            "status": submission.status,
            "created_at": submission.created_at.isoformat()
        },
        "message": "✅ Content submitted! Review other creators' work to unlock yours in the discovery queue.",
        "tier_info": {
            'tier': user_tier,
            'active_submissions': active_submissions + 1 if active_submissions != -1 else -1,
            'limit': limits['max_active_submissions']
        }
    }


# ==================== GET MY SUBMISSIONS ====================
@router.get("/my-submissions")
def get_my_pool_submissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's pool submissions with performance metrics + auto-fix missing links"""

    submissions = db.query(PoolSubmission).filter(
        PoolSubmission.user_id == current_user.id
    ).order_by(PoolSubmission.created_at.desc()).all()

    # ✅ AUTO-FIX MISSING CONTENT LINKS
    fixed_count = 0
    for s in submissions:
        if not s.content_id:
            content = Content(
                user_id=current_user.id,
                title=s.title,
                description=s.pitch or "Content from pool submission",
                url=s.original_url,
                content_type=ContentTypeEnum.link,
                categories=[s.category],
                status="pending",
                created_at=s.created_at
            )
            db.add(content)
            db.flush()
            s.content_id = content.id
            fixed_count += 1

    if fixed_count > 0:
        db.commit()
        logger.info(f"✅ Auto-fixed {fixed_count} submissions for user {current_user.id}")

    # Build response
    results = []
    for s in submissions:
        would_follow_count = db.query(func.count(PoolReview.id)).filter(
            PoolReview.content_id == s.content_id,
            PoolReview.is_quality == True
        ).scalar() or 0

        recent_feedback = db.query(PoolReview).filter(
            PoolReview.content_id == s.content_id,
            PoolReview.feedback.isnot(None)
        ).order_by(PoolReview.created_at.desc()).limit(3).all()

        results.append({
            "id": s.content_id,
            "submission_id": s.id,  # ✅ Real submission ID for unlocking
            "content_id": s.content_id,
            "title": s.title,
            "status": s.status,  # ✅ CHANGED: Return real status, not fake "unlocked"
            "genuineViews": s.review_count or 0,
            "potentialFollowers": would_follow_count,
            "created_at": s.created_at.isoformat(),
            "original_url": s.original_url,
            "description": s.pitch,
            "url": s.original_url,
            "feedback": [
                {
                    "creator": f"User {r.user_id}",
                    "sentiment": "would_follow" if r.is_quality else "interesting",
                    "note": r.feedback or "No feedback provided"
                }
                for r in recent_feedback
            ]
        })

    return results


# ==================== GET COLLABORATION MATCHES (✅ ENRICHED WITH USER DATA) ====================
@router.get("/collaboration-matches")
def get_collaboration_matches(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Find creators at similar growth stage for collaboration.
    Returns enriched data with user profiles and real metrics.
    """
    user_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()

    # Get user's content count as growth stage proxy
    user_content_count = db.query(func.count(Content.id)).filter(
        Content.user_id == current_user.id
    ).scalar() or 0

    # Find creators with similar content count (+/- 5)
    similar_stage_users = db.query(User.id).join(Content).group_by(User.id).having(
        func.count(Content.id).between(max(0, user_content_count - 5), user_content_count + 5)
    ).subquery()

    # Get their approved submissions
    potential_collabs = db.query(PoolSubmission).filter(
        PoolSubmission.status == "approved",
        PoolSubmission.user_id.in_(similar_stage_users),
        PoolSubmission.user_id != current_user.id
    )

    # Filter by category if user has preferences
    if user_profile and user_profile.categories:
        potential_collabs = potential_collabs.filter(
            PoolSubmission.category.in_(user_profile.categories)
        )

    collabs = potential_collabs.limit(limit).all()

    results = []
    for collab in collabs:
        # Get real user data
        creator = db.query(User).filter(User.id == collab.user_id).first()
        creator_profile = db.query(Profile).filter(Profile.user_id == collab.user_id).first()

        # Get real metrics
        creator_content_count = db.query(func.count(Content.id)).filter(
            Content.user_id == collab.user_id
        ).scalar() or 0

        creator_review_count = db.query(func.count(PoolReview.id)).filter(
            PoolReview.user_id == collab.user_id
        ).scalar() or 0

        # Count "would follow" for this creator
        would_follow_count = db.query(func.count(PoolReview.id)).join(
            PoolSubmission, PoolReview.content_id == PoolSubmission.content_id
        ).filter(
            PoolSubmission.user_id == collab.user_id,
            PoolReview.is_quality == True
        ).scalar() or 0

        results.append({
            "id": collab.id,
            "user_id": collab.user_id,
            "content_id": collab.content_id,

            # Real user data
            "username": creator.username if creator else "Anonymous",
            "bio": creator_profile.bio if creator_profile else None,
            "niche": ", ".join(creator_profile.categories) if creator_profile and creator_profile.categories else None,
            "interests": creator_profile.interests if creator_profile else [],
            "avatar_initials": creator.username[:2].upper() if creator else "AC",

            # Real content data
            "title": collab.title,
            "original_url": collab.original_url,
            "category": collab.category,
            "pitch": collab.pitch,

            # Real metrics
            "content_count": creator_content_count,
            "review_count": creator_review_count,
            "avg_rating": float(collab.average_rating) if collab.average_rating else 0.0,
            "would_follow_count": would_follow_count,

            # Real scoring
            "collab_score": calculate_alignment_score(collab, user_profile, db),
            "collab_idea": generate_collab_idea(collab.category),
            "match_reason": generate_match_reason(collab, user_profile)
        })

    return results


# ==================== GET GENESIS METRICS ====================
@router.get("/genesis-metrics")
def get_genesis_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get Audience Genesis metrics:
    - Would follow count
    - Conversion rate
    - Genuine connections
    - Active streak
    """
    # Reviews given
    reviews_given = db.query(PoolReview).filter(
        PoolReview.user_id == current_user.id
    ).all()

    # Submissions and their reviews
    submissions = db.query(PoolSubmission).filter(
        PoolSubmission.user_id == current_user.id
    ).all()

    total_reviews_received = sum(s.review_count or 0 for s in submissions)

    # Count "would follow" responses
    would_follow_count = db.query(func.count(PoolReview.id)).join(
        PoolSubmission, PoolReview.content_id == PoolSubmission.content_id
    ).filter(
        PoolSubmission.user_id == current_user.id,
        PoolReview.is_quality == True
    ).scalar() or 0

    # Conversion rate
    conversion_rate = (
        (would_follow_count / total_reviews_received * 100)
        if total_reviews_received > 0 else 0
    )

    # Genuine connections
    genuine_connections = db.query(func.count(PoolReview.id)).filter(
        PoolReview.user_id == current_user.id,
        PoolReview.feedback.isnot(None),
        func.length(PoolReview.feedback) > 10
    ).scalar() or 0

    # Calculate streak
    recent_reviews = db.query(
        func.date(PoolReview.created_at).label('review_date')
    ).filter(
        PoolReview.user_id == current_user.id
    ).distinct().order_by(
        func.date(PoolReview.created_at).desc()
    ).limit(30).all()

    streak_days = calculate_streak(recent_reviews)

    # Add quality score (average rating given by user)
    avg_rating_given = db.query(func.avg(PoolReview.rating)).filter(
        PoolReview.user_id == current_user.id
    ).scalar() or 0.0

    return {
        "success": True,
        "metrics": {
            # Corrected field names for frontend
            "connections": genuine_connections,
            "day_streak": streak_days,

            # Keep existing metrics for backward compatibility
            "would_follow_count": would_follow_count,
            "conversion_rate": round(conversion_rate, 1),
            "genuine_connections": genuine_connections,
            "active_collabs": 0,
            "streak_days": streak_days,
            "total_reviews_given": len(reviews_given),
            "total_reviews_received": total_reviews_received,
            "quality_score": round(float(avg_rating_given), 2)
        }
    }

# ==================== UNLOCK PENDING SUBMISSION ====================
@router.post("/submissions/{submission_id}/unlock")
def unlock_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Unlock a pending submission using review credits.
    Activates the content and approves the submission.
    """
    # Get submission
    submission = db.query(PoolSubmission).filter(
        PoolSubmission.id == submission_id
    ).first()

    if not submission:
        raise HTTPException(404, f"Submission {submission_id} not found")

    # Check ownership
    if submission.user_id != current_user.id:
        raise HTTPException(403, f"Not your submission")

    # Already approved?
    if submission.status != "pending":
        return {
            "success": True,
            "message": f"Already {submission.status}",
            "submission": {
                "id": submission.id,
                "content_id": submission.content_id,
                "status": submission.status
            }
        }

    # Check credits
    if current_user.share_count < 1:
        raise HTTPException(400, "Need review credits")

    # Get content
    if not submission.content_id:
        raise HTTPException(400, "No linked content")

    content = db.query(Content).filter(
        Content.id == submission.content_id
    ).first()

    if not content:
        raise HTTPException(404, "Content not found")

    # UNLOCK
    content.status = "active"
    submission.status = "approved"
    submission.approved_at = datetime.utcnow()
    current_user.share_count -= 1

    db.commit()
    db.refresh(submission)
    db.refresh(content)

    logger.info(f"✅ Unlocked submission {submission_id}")

    return {
        "success": True,
        "message": "Content unlocked!",
        "submission": {
            "id": submission.id,
            "content_id": content.id,
            "title": submission.title,
            "status": submission.status
        },
        "remaining_credits": current_user.share_count
    }

# ==================== FIX SUBMISSION LINKS (NEW) ====================
@router.post("/submissions/{submission_id}/fix-link")
def fix_submission_link(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Emergency fix: Link a submission to its content if missing.
    """
    submission = db.query(PoolSubmission).filter(
        PoolSubmission.id == submission_id,
        PoolSubmission.user_id == current_user.id
    ).first()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if submission.content_id:
        return {"message": "Already linked", "content_id": submission.content_id}

    # Create new content for this submission
    content = Content(
        user_id=current_user.id,
        title=submission.title,
        description=submission.description or "Content from pool submission",
        content_type="text",
        status="pending",
        created_at=datetime.utcnow()
    )
    db.add(content)
    db.flush()

    # Link submission to content
    submission.content_id = content.id
    db.commit()

    logger.info(f"✅ Linked submission {submission_id} to content {content.id}")

    return {
        "success": True,
        "message": "Submission linked to content",
        "submission_id": submission.id,
        "content_id": content.id
    }


@router.post("/submissions/fix-all-links")
def fix_all_submission_links(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fix all submissions missing content_id for current user.
    """
    submissions = db.query(PoolSubmission).filter(
        PoolSubmission.user_id == current_user.id,
        PoolSubmission.content_id == None
    ).all()

    if not submissions:
        return {"message": "No submissions need fixing", "fixed_count": 0}

    fixed_count = 0
    for submission in submissions:
        # Create content for each submission
        content = Content(
            user_id=current_user.id,
            title=submission.title,
            description=submission.description or "Content from pool submission",
            content_type="text",
            status="pending",
            created_at=datetime.utcnow()
        )
        db.add(content)
        db.flush()

        # Link them
        submission.content_id = content.id
        fixed_count += 1
        logger.info(f"✅ Linked submission {submission.id} to content {content.id}")

    db.commit()

    return {
        "success": True,
        "message": f"Fixed {fixed_count} submissions",
        "fixed_count": fixed_count
    }


# ==================== ADMIN: APPROVE SUBMISSION ====================
@router.post("/admin/approve/{submission_id}")
def approve_pool_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin approves a pool submission and creates Content entry."""
    if not current_user.is_admin:
        raise HTTPException(403, "Admin access required")

    submission = db.query(PoolSubmission).filter(
        PoolSubmission.id == submission_id
    ).first()

    if not submission:
        raise HTTPException(404, "Submission not found")

    if submission.status != "pending":
        raise HTTPException(400, f"Submission already {submission.status}")

    # Create content entry
    content = Content(
        title=submission.title,
        description=submission.pitch or "Submitted via Pool",
        url=submission.original_url,
        content_type=ContentTypeEnum.link,
        categories=[submission.category],
        user_id=submission.user_id,
        status="active",
        share_count=0,
        required_shares=10
    )
    db.add(content)
    db.commit()
    db.refresh(content)

    # Link submission to content
    submission.content_id = content.id
    submission.status = "approved"
    submission.approved_at = datetime.utcnow()

    db.commit()

    logger.info(f"✅ Admin approved pool submission {submission_id}, created content {content.id}")

    return {
        "success": True,
        "submission_id": submission.id,
        "content_id": content.id,
        "message": "Pool submission approved and content created"
    }


# ==================== ADMIN: REJECT SUBMISSION ====================
@router.post("/admin/reject/{submission_id}")
def reject_pool_submission(
    submission_id: int,
    reason: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin rejects a pool submission."""
    if not current_user.is_admin:
        raise HTTPException(403, "Admin access required")

    submission = db.query(PoolSubmission).filter(
        PoolSubmission.id == submission_id
    ).first()

    if not submission:
        raise HTTPException(404, "Submission not found")

    if submission.status != "pending":
        raise HTTPException(400, f"Submission already {submission.status}")

    submission.status = "rejected"
    db.commit()

    logger.info(f"❌ Admin rejected pool submission {submission_id}: {reason}")

    return {
        "success": True,
        "submission_id": submission.id,
        "status": "rejected",
        "reason": reason
    }


# ==================== GET POOL STATS ====================
@router.get("/stats")
def get_pool_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's pool statistics."""
    reviews_given = db.query(PoolReview).filter(
        PoolReview.user_id == current_user.id
    ).all()

    submissions = db.query(PoolSubmission).filter(
        PoolSubmission.user_id == current_user.id
    ).all()

    total_reviews_received = sum(s.review_count or 0 for s in submissions)

    avg_rating_given = (
        db.query(func.avg(PoolReview.rating))
        .filter(PoolReview.user_id == current_user.id)
        .scalar() or 0.0
    )

    return {
        "success": True,
        "reviews": {
            "total": len(reviews_given),
            "average_rating": float(avg_rating_given)
        },
        "submissions": {
            "total": len(submissions),
            "approved": sum(1 for s in submissions if s.status == "approved"),
            "total_reviews": total_reviews_received
        }
    }


# ==================== SEND MESSAGE ====================
@router.post("/message/{user_id}", response_model=MessageResponse)
def send_message_to_creator(
    user_id: int,
    message: str = Body(..., embed=True, min_length=1, max_length=2000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a message to another creator.
    Creates both a Message record and a Notification.
    """
    if user_id == current_user.id:
        raise HTTPException(400, "Cannot message yourself")

    # Verify recipient exists
    recipient = db.query(User).filter(User.id == user_id).first()
    if not recipient:
        raise HTTPException(404, "User not found")

    # Generate thread ID
    thread_id = Message.generate_thread_id(current_user.id, user_id)

    # Create message
    new_message = Message(
        sender_id=current_user.id,
        recipient_id=user_id,
        content=message,
        thread_id=thread_id,
        is_read=False
    )
    db.add(new_message)

    # Also create notification for backward compatibility
    notification = Notification(
        user_id=user_id,
        message=f"New message from {current_user.username}: {message[:100]}{'...' if len(message) > 100 else ''}",
        type="message",
        is_read=False,
        data={"message_id": new_message.id, "sender_id": current_user.id}
    )
    db.add(notification)

    db.commit()
    db.refresh(new_message)

    logger.info(f"✅ Message sent from user {current_user.id} to user {user_id}")

    return MessageResponse(
        id=new_message.id,
        sender_id=new_message.sender_id,
        recipient_id=new_message.recipient_id,
        content=new_message.content,
        is_read=new_message.is_read,
        created_at=new_message.created_at,
        thread_id=new_message.thread_id,
        sender_username=current_user.username
    )


@router.get("/messages/conversations", response_model=List[ConversationResponse])
def get_all_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all conversations for the current user with unread counts.
    Returns list of conversations sorted by most recent message.
    """
    # Get all messages involving current user
    messages = db.query(Message).filter(
        or_(
            Message.sender_id == current_user.id,
            Message.recipient_id == current_user.id
        )
    ).order_by(desc(Message.created_at)).all()

    # Group by thread_id
    conversations = {}
    for msg in messages:
        thread_id = msg.thread_id

        if thread_id not in conversations:
            # Determine other user
            other_user_id = msg.recipient_id if msg.sender_id == current_user.id else msg.sender_id
            other_user = db.query(User).filter(User.id == other_user_id).first()

            if not other_user:
                continue

            conversations[thread_id] = {
                "thread_id": thread_id,
                "other_user_id": other_user_id,
                "other_user_username": other_user.username,
                "other_user_avatar": None,  # Add if you have avatar field
                "last_message": None,
                "unread_count": 0,
                "total_messages": 0
            }

        conv = conversations[thread_id]
        conv["total_messages"] += 1

        # Track unread messages sent to current user
        if msg.recipient_id == current_user.id and not msg.is_read:
            conv["unread_count"] += 1

        # Store most recent message
        if conv["last_message"] is None:
            conv["last_message"] = MessageResponse(
                id=msg.id,
                sender_id=msg.sender_id,
                recipient_id=msg.recipient_id,
                content=msg.content,
                is_read=msg.is_read,
                created_at=msg.created_at,
                thread_id=msg.thread_id,
                sender_username=msg.sender.username
            )

    return list(conversations.values())


@router.get("/messages/{user_id}", response_model=MessageThreadResponse)
def get_conversation_with_user(
    user_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get message thread with a specific user.
    Marks unread messages as read automatically.
    """
    if user_id == current_user.id:
        raise HTTPException(400, "Cannot get conversation with yourself")

    # Verify user exists
    other_user = db.query(User).filter(User.id == user_id).first()
    if not other_user:
        raise HTTPException(404, "User not found")

    thread_id = Message.generate_thread_id(current_user.id, user_id)

    # Get messages in thread
    messages = db.query(Message).filter(
        Message.thread_id == thread_id
    ).order_by(desc(Message.created_at)).offset(offset).limit(limit).all()

    # Mark messages to current user as read
    unread_messages = db.query(Message).filter(
        Message.thread_id == thread_id,
        Message.recipient_id == current_user.id,
        Message.is_read == False
    ).all()

    for msg in unread_messages:
        msg.is_read = True

    if unread_messages:
        db.commit()

    # Get total count
    total_count = db.query(func.count(Message.id)).filter(
        Message.thread_id == thread_id
    ).scalar()

    # Format response
    message_responses = [
        MessageResponse(
            id=msg.id,
            sender_id=msg.sender_id,
            recipient_id=msg.recipient_id,
            content=msg.content,
            is_read=msg.is_read,
            created_at=msg.created_at,
            thread_id=msg.thread_id,
            sender_username=msg.sender.username
        )
        for msg in reversed(messages)  # Reverse to show oldest first
    ]

    return MessageThreadResponse(
        thread_id=thread_id,
        messages=message_responses,
        total_count=total_count
    )


@router.put("/messages/{message_id}/read")
def mark_message_as_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a specific message as read"""
    message = db.query(Message).filter(
        Message.id == message_id,
        Message.recipient_id == current_user.id
    ).first()

    if not message:
        raise HTTPException(404, "Message not found or not authorized")

    message.is_read = True
    db.commit()

    return {"success": True, "message_id": message_id}


# ==================== FOLLOWING ENDPOINTS ====================

@router.post("/follow/{user_id}", response_model=FollowResponse)
def follow_creator(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Follow a creator"""
    if user_id == current_user.id:
        raise HTTPException(400, "Cannot follow yourself")

    # Verify user exists
    user_to_follow = db.query(User).filter(User.id == user_id).first()
    if not user_to_follow:
        raise HTTPException(404, "User not found")

    # Check if already following
    existing_follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == user_id
    ).first()

    if existing_follow:
        raise HTTPException(400, "Already following this user")

    # Create follow relationship
    new_follow = Follow(
        follower_id=current_user.id,
        following_id=user_id
    )
    db.add(new_follow)

    # Create notification
    notification = Notification(
        user_id=user_id,
        message=f"{current_user.username} started following you!",
        type="follow",
        is_read=False,
        data={"follower_id": current_user.id}
    )
    db.add(notification)

    db.commit()
    db.refresh(new_follow)

    logger.info(f"✅ User {current_user.id} followed user {user_id}")

    return FollowResponse(
        id=new_follow.id,
        follower_id=new_follow.follower_id,
        following_id=new_follow.following_id,
        created_at=new_follow.created_at,
        username=user_to_follow.username
    )


@router.delete("/follow/{user_id}")
def unfollow_creator(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Unfollow a creator"""
    if user_id == current_user.id:
        raise HTTPException(400, "Cannot unfollow yourself")

    # Find follow relationship
    follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == user_id
    ).first()

    if not follow:
        raise HTTPException(404, "You are not following this user")

    db.delete(follow)
    db.commit()

    logger.info(f"✅ User {current_user.id} unfollowed user {user_id}")

    return {"success": True, "message": "Successfully unfollowed"}


@router.get("/follow/status/{user_id}", response_model=FollowStatusResponse)
def get_follow_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check follow status between current user and another user"""
    if user_id == current_user.id:
        return FollowStatusResponse(
            is_following=False,
            is_followed_by=False
        )

    # Check if current user follows them
    following = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == user_id
    ).first()

    # Check if they follow current user
    followed_by = db.query(Follow).filter(
        Follow.follower_id == user_id,
        Follow.following_id == current_user.id
    ).first()

    return FollowStatusResponse(
        is_following=following is not None,
        is_followed_by=followed_by is not None,
        follow_id=following.id if following else None,
        created_at=following.created_at if following else None
    )


@router.get("/following", response_model=FollowListResponse)
def get_following_list(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of users current user is following"""
    follows = db.query(Follow).filter(
        Follow.follower_id == current_user.id
    ).order_by(desc(Follow.created_at)).offset(offset).limit(limit).all()

    total_count = db.query(func.count(Follow.id)).filter(
        Follow.follower_id == current_user.id
    ).scalar()

    follow_responses = [
        FollowResponse(
            id=f.id,
            follower_id=f.follower_id,
            following_id=f.following_id,
            created_at=f.created_at,
            username=f.following.username
        )
        for f in follows
    ]

    return FollowListResponse(
        follows=follow_responses,
        total_count=total_count
    )


@router.get("/followers", response_model=FollowListResponse)
def get_followers_list(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of current user's followers"""
    follows = db.query(Follow).filter(
        Follow.following_id == current_user.id
    ).order_by(desc(Follow.created_at)).offset(offset).limit(limit).all()

    total_count = db.query(func.count(Follow.id)).filter(
        Follow.following_id == current_user.id
    ).scalar()

    follow_responses = [
        FollowResponse(
            id=f.id,
            follower_id=f.follower_id,
            following_id=f.following_id,
            created_at=f.created_at,
            username=f.follower.username
        )
        for f in follows
    ]

    return FollowListResponse(
        follows=follow_responses,
        total_count=total_count
    )


@router.get("/follow/stats", response_model=FollowStatsResponse)
def get_follow_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get follow statistics for current user"""
    following_count = db.query(func.count(Follow.id)).filter(
        Follow.follower_id == current_user.id
    ).scalar() or 0

    followers_count = db.query(func.count(Follow.id)).filter(
        Follow.following_id == current_user.id
    ).scalar() or 0

    # Fixed: Count mutual follows correctly
    # Get IDs of people current user follows
    following_ids_subquery = db.query(Follow.following_id).filter(
        Follow.follower_id == current_user.id
    )

    # Count how many of those also follow current user back
    mutual_count = db.query(func.count(Follow.id)).filter(
        Follow.follower_id.in_(following_ids_subquery),
        Follow.following_id == current_user.id
    ).scalar() or 0

    return FollowStatsResponse(
        following_count=following_count,
        followers_count=followers_count,
        mutual_count=mutual_count
    )

# ==================== GENERATE ICEBREAKER (✅ AI-POWERED) ====================
@router.get("/icebreaker/{user_id}")
def generate_icebreaker(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate AI-powered conversation starters for connecting with another creator"""

    if user_id == current_user.id:
        raise HTTPException(400, "Cannot generate icebreaker for yourself")

    # Get both profiles
    sender_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    recipient_profile = db.query(Profile).filter(Profile.user_id == user_id).first()

    if not recipient_profile:
        raise HTTPException(404, "User not found")

    ai_engine = get_ai_engine()

    # Get sender's content count
    sender_content_count = db.query(func.count(Content.id)).filter(
        Content.user_id == current_user.id
    ).scalar() or 0

    # Prepare sender data
    sender_data = {
        "username": current_user.username,
        "topics": sender_profile.ai_topics if sender_profile and sender_profile.ai_topics else [],
        "target_audience": sender_profile.ai_target_audience if sender_profile and sender_profile.ai_target_audience else [],
        "total_followers": 0,
        "content_count": sender_content_count
    }

    # Get recipient user
    recipient_user = db.query(User).filter(User.id == user_id).first()

    # Get recipient's latest submission for context
    latest_submission = db.query(PoolSubmission).filter(
        PoolSubmission.user_id == user_id,
        PoolSubmission.status == "approved"
    ).order_by(PoolSubmission.created_at.desc()).first()

    # Prepare recipient data
    recipient_data = {
        "username": recipient_user.username,
        "topics": recipient_profile.ai_topics or [],
        "target_audience": recipient_profile.ai_target_audience or [],
        "key_phrases": recipient_profile.ai_key_phrases or [],
        "total_followers": 0,
        "latest_work": latest_submission.title if latest_submission else None,
        "niche": ", ".join(recipient_profile.categories) if recipient_profile.categories else None
    }

    # Calculate match score
    recipient_content_count = db.query(func.count(Content.id)).filter(
        Content.user_id == user_id
    ).scalar() or 0

    score_breakdown = ai_engine.calculate_match_score(
        sender_data,
        recipient_data,
        {"total_followers": 0, "content_count": sender_content_count},
        {"total_followers": 0, "content_count": recipient_content_count}
    )

    match_score = score_breakdown["total"]

    # Generate icebreakers
    icebreaker = ai_engine.generate_icebreaker(
        sender_data,
        recipient_data,
        match_score
    )

    return {
        "success": True,
        "match_score": match_score,
        "match_quality": icebreaker["match_quality"],
        "templates": icebreaker["templates"],
        "recommended": icebreaker["recommended_template"],
        "common_topics": icebreaker["common_topics"],
        "collab_ideas": icebreaker["collab_ideas"]
    }


# ==================== SEND MESSAGE WITH ICEBREAKER ====================
@router.post("/send-message")
def send_icebreaker_message(
    recipient_user_id: int = Body(..., embed=True),
    message: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a message to another creator (with icebreaker text).
    Logs a contact attempt to prevent spam.
    """
    # Verify recipient exists
    recipient = db.query(User).filter(User.id == recipient_user_id).first()
    if not recipient:
        raise HTTPException(404, "User not found")

    if recipient_user_id == current_user.id:
        raise HTTPException(400, "Cannot message yourself")

    # Check for recent contact attempt (prevent spam)
    existing_contact = db.query(Contact).filter(
        Contact.user_id == current_user.id,
        Contact.email == recipient.email
    ).first()

    if existing_contact:
        # Update created_at as proxy for last_contacted (field doesn't exist yet)
        # This is a temporary solution until we add the migration
        pass
    else:
        # Create new contact entry
        new_contact = Contact(
            user_id=current_user.id,
            name=recipient.username,
            email=recipient.email
        )
        db.add(new_contact)

    # Create notification for recipient
    notification = Notification(
        user_id=recipient_user_id,
        message=f"New message from {current_user.username}: {message[:100]}{'...' if len(message) > 100 else ''}",
        type="message",
        is_read=False
    )
    db.add(notification)
    db.commit()

    logger.info(f"✅ Message sent from user {current_user.id} to user {recipient_user_id}")

    return {
        "success": True,
        "message": "Message sent successfully",
        "recipient": recipient.username
    }


# Add these to your pool_routes.py

# 1. GET /pool/notifications
@router.get("/notifications")
async def get_notifications(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 20
):
    """Get user's notifications"""
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user["user_id"]
    ).order_by(
        Notification.created_at.desc()
    ).offset(skip).limit(limit).all()

    return {
        "success": True,
        "notifications": [
            {
                "id": n.id,
                "type": n.type,
                "message": n.message,
                "is_read": n.is_read,
                "created_at": n.created_at,
                "related_user_id": n.related_user_id,
                "related_content_id": n.related_content_id
            }
            for n in notifications
        ],
        "total_count": db.query(Notification).filter(
            Notification.user_id == current_user["user_id"]
        ).count()
    }


# 2. PUT /pool/notifications/read
@router.put("/notifications/read")
async def mark_notifications_read(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    notification_ids: Optional[List[int]] = None
):
    """Mark notifications as read"""
    query = db.query(Notification).filter(
        Notification.user_id == current_user["user_id"],
        Notification.is_read == False
    )

    if notification_ids:
        query = query.filter(Notification.id.in_(notification_ids))

    count = query.update({"is_read": True})
    db.commit()

    return {
        "success": True,
        "marked_read": count
    }


# 3. GET /pool/notifications/unread-count
@router.get("/notifications/unread-count")
async def get_unread_notification_count(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications"""
    count = db.query(Notification).filter(
        Notification.user_id == current_user["user_id"],
        Notification.is_read == False
    ).count()

    return {
        "success": True,
        "unread_count": count
    }


# 4. GET /pool/icebreaker/{user_id}
@router.get("/icebreaker/{user_id}")
async def get_icebreaker(
    user_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate AI-powered conversation starter"""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    current_user_obj = db.query(User).filter(
        User.id == current_user["user_id"]
    ).first()

    # Get user's content for context
    target_content = db.query(Content).filter(
        Content.user_id == user_id
    ).order_by(Content.created_at.desc()).limit(3).all()

    # Generate contextual icebreaker
    if target_content:
        content_titles = [c.title for c in target_content]
        icebreaker = f"I noticed you shared '{content_titles[0]}' - what inspired you to create that?"
    else:
        icebreaker = f"Hey {target_user.username}! I'd love to connect and learn more about your work."

    # Add interests overlap if available
    if hasattr(target_user, 'interests') and hasattr(current_user_obj, 'interests'):
        common_interests = set(target_user.interests or []) & set(current_user_obj.interests or [])
        if common_interests:
            interest = list(common_interests)[0]
            icebreaker += f" I'm also interested in {interest}!"

    return {
        "success": True,
        "icebreaker": icebreaker,
        "user_id": user_id,
        "username": target_user.username
    }


# 5. GET /pool/trending
@router.get("/trending")
async def get_trending_users(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 10,
    timeframe: str = "week"
):
    """Get trending users based on engagement"""

    # Calculate date cutoff
    cutoffs = {
        "week": timedelta(days=7),
        "month": timedelta(days=30),
        "all": timedelta(days=36500)
    }
    cutoff_date = datetime.utcnow() - cutoffs.get(timeframe, cutoffs["week"])

    # Get users with recent activity
    trending_query = db.query(
        User.id,
        User.username,
        User.bio,
        User.niche,
        User.interests,
        func.count(distinct(Follow.id)).label('follower_count'),
        func.count(distinct(Content.id)).label('content_count'),
        func.avg(PoolReview.rating).label('avg_rating')  # ✅ CHANGED
    ).outerjoin(
        Follow, Follow.following_id == User.id
    ).outerjoin(
        Content, Content.user_id == User.id
    ).outerjoin(
        PoolReview, PoolReview.content_id == Content.id  # ✅ CHANGED
    ).filter(
        User.id != current_user["user_id"],
        or_(
            Content.created_at >= cutoff_date,
            Follow.created_at >= cutoff_date
        )
    ).group_by(User.id)

    # Calculate engagement score and sort
    users = trending_query.all()
    trending_users = []

    for user in users:
        engagement_score = (
            (user.follower_count * 10) +
            (user.content_count * 5) +
            ((user.avg_rating or 0) * 20)
        )

        trending_users.append({
            "id": user.id,
            "username": user.username,
            "bio": user.bio,
            "niche": user.niche,
            "interests": user.interests or [],
            "follower_count": user.follower_count,
            "content_count": user.content_count,
            "avg_rating": round(user.avg_rating or 0, 2),
            "engagement_score": round(engagement_score, 2)
        })

    # Sort by engagement score
    trending_users.sort(key=lambda x: x["engagement_score"], reverse=True)

    return {
        "success": True,
        "trending_users": trending_users[:limit],
        "timeframe": timeframe
    }


# 6. GET /pool/users (Search)
@router.get("/users")
async def search_users(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    limit: int = 20
):
    """Search for users by username"""

    # Handle both dict and User object
    current_user_id = current_user.get("user_id") if isinstance(current_user, dict) else current_user.id

    # Base query
    query = db.query(User).filter(User.id != current_user_id)

    # Search by username
    if search:
        search_filter = f"%{search.lower()}%"
        query = query.filter(func.lower(User.username).like(search_filter))

    users = query.limit(limit).all()

    # Format response
    user_list = []
    for user in users:
        # Get follower count
        follower_count = db.query(Follow).filter(
            Follow.following_id == user.id
        ).count()

        # Check if current user follows this user
        is_following = db.query(Follow).filter(
            Follow.follower_id == current_user_id,
            Follow.following_id == user.id
        ).first() is not None

        # Get profile if exists
        profile = db.query(Profile).filter(Profile.user_id == user.id).first()

        user_data = {
            "id": user.id,
            "username": user.username,
            "follower_count": follower_count,
            "is_following": is_following
        }

        # Add profile data if exists
        if profile:
            user_data.update({
                "name": profile.name,
                "bio": profile.bio,
                "content_type": profile.content_type,
                "interests": profile.interests or []
            })

        user_list.append(user_data)

    return {
        "success": True,
        "users": user_list,
        "count": len(user_list)
    }

# ==================== DEBUG ENDPOINT ====================
@router.get("/debug/submission-links")
def debug_submission_links(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Debug endpoint to check content_id links"""
    submissions = db.query(PoolSubmission).filter(
        PoolSubmission.user_id == current_user.id
    ).all()

    results = []
    for s in submissions:
        content = None
        if s.content_id:
            content = db.query(Content).filter(Content.id == s.content_id).first()

        results.append({
            "submission_id": s.id,
            "submission_title": s.title,
            "submission_status": s.status,
            "content_id": s.content_id,
            "content_exists": content is not None,
            "content_status": content.status if content else None,
            "has_link": s.content_id is not None,
            "created_at": s.created_at.isoformat()
        })

    broken_count = sum(1 for r in results if not r["has_link"])

    return {
        "total_submissions": len(results),
        "broken_links": broken_count,
        "working_links": len(results) - broken_count,
        "share_credits": current_user.share_count,
        "submissions": results
    }
