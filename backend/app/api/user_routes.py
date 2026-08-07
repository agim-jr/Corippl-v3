# backend/app/api/user_routes.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.schemas import UserResponse, UserSubmissionInfo
from ..utils.dependencies import get_current_user
from ..models.user import User
from datetime import date, timedelta  # Added imports

router = APIRouter(
    prefix="/api",
    tags=["User"]
)

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user

@router.get("/users/submission-info", response_model=UserSubmissionInfo)
def get_submission_info(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
     today = date.today()
     # Reset weekly_submission_count if last_submission_date is more than 7 days ago
     if current_user.last_submission_date < today - timedelta(days=7):
         current_user.weekly_submission_count = 0
         current_user.last_submission_date = today
         db.commit()

     can_submit = current_user.is_premium or current_user.weekly_submission_count < 3
     submissions_remaining = -1 if current_user.is_premium else 3 - current_user.weekly_submission_count

     return UserSubmissionInfo(
         weekly_submission_count=current_user.weekly_submission_count,
         last_submission_date=current_user.last_submission_date,
         can_submit=can_submit,
         submissions_remaining=submissions_remaining if not current_user.is_premium else None
     )

# ✅ ADD THIS NEW ENDPOINT
@router.get("/users/share-info")
def get_share_info(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get user's daily share count and remaining shares.
    Free users: 3 shares per day
    Premium users: Unlimited shares
    """
    today = date.today()

    # Reset daily_share_count if last_share_date is not today
    if current_user.last_share_date != today:
        current_user.daily_share_count = 0
        current_user.last_share_date = today
        db.commit()
        db.refresh(current_user)

    shares_remaining = "unlimited" if current_user.is_premium else max(0, 3 - current_user.daily_share_count)

    return {
        "daily_share_count": current_user.daily_share_count,
        "shares_remaining": shares_remaining,
        "is_premium": current_user.is_premium,
        "last_share_date": str(current_user.last_share_date)
    }

# ADD THIS NEW ENDPOINT at the bottom of user_routes.py

# backend/app/api/user_routes.py

@router.get("/users/progress")
def get_user_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user's progress metrics for the Progress Widget.
    Returns:
    - Content stats (active, pending, total)
    - Share stats (given, received, daily limit)
    - Queue status (share credits, pending items, next to unlock)
    - Milestones achieved
    """
    from sqlalchemy import func
    from ..models.content import Content, Share
    from ..services.queue_service import get_user_queue  # ✅ ADD THIS IMPORT

    # 1. Content Stats
    total_content = db.query(func.count(Content.id)).filter(
        Content.user_id == current_user.id
    ).scalar() or 0

    active_content = db.query(func.count(Content.id)).filter(
        Content.user_id == current_user.id,
        Content.status == "active"
    ).scalar() or 0

    pending_content = db.query(func.count(Content.id)).filter(
        Content.user_id == current_user.id,
        Content.status == "pending"
    ).scalar() or 0

    # 2. Share Stats
    shares_given = db.query(func.count(Share.id)).filter(
        Share.user_id == current_user.id
    ).scalar() or 0

    shares_received = current_user.share_count or 0

    # Daily share info
    today = date.today()
    if current_user.last_share_date != today:
        current_user.daily_share_count = 0
        current_user.last_share_date = today
        db.commit()

    daily_shares_used = current_user.daily_share_count
    daily_shares_limit = "unlimited" if current_user.is_premium else 3
    daily_shares_remaining = (
        "unlimited" if current_user.is_premium
        else max(0, 3 - daily_shares_used)
    )

    # 3. Reciprocal Balance
    reciprocal_balance = shares_given - shares_received
    reciprocal_ratio = (
        shares_given / shares_received if shares_received > 0
        else shares_given
    )

    # ✅ NEW: Get detailed queue status (same as ShareModal uses)
    queue_data = get_user_queue(db, current_user.id)

    # 4. Milestones
    milestones = {
        "first_content_added": total_content >= 1,
        "first_content_active": active_content >= 1,
        "first_share_given": shares_given >= 1,
        "ten_shares_given": shares_given >= 10,
        "balanced_reciprocity": abs(reciprocal_balance) <= 2,
        "power_user": shares_given >= 50,
    }

    # 5. Weekly Stats
    from datetime import timedelta
    week_ago = today - timedelta(days=7)

    shares_this_week = db.query(func.count(Share.id)).filter(
        Share.user_id == current_user.id,
        Share.created_at >= week_ago
    ).scalar() or 0

    return {
        "content": {
            "total": total_content,
            "active": active_content,
            "pending": pending_content,
        },
        "shares": {
            "given": shares_given,
            "received": shares_received,
            "balance": reciprocal_balance,
            "ratio": round(reciprocal_ratio, 2),
            "this_week": shares_this_week,
        },
        "daily_limit": {
            "used": daily_shares_used,
            "limit": daily_shares_limit,
            "remaining": daily_shares_remaining,
            "is_premium": current_user.is_premium,
        },
        # ✅ NEW: Include full queue details
        "queue": queue_data,
        "milestones": milestones,
    }

# ✅ ADD THIS NEW ENDPOINT HERE (after get_user_progress)
@router.get("/users/me")
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user's basic information"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "subscription_tier": current_user.subscription_tier
    }
