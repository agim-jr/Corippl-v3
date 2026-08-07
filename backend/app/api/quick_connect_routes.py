# backend/app/api/quick_connect_routes.py

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime, timedelta, date
from enum import Enum
import logging

from ..database import get_db
from ..models.user import User
from ..models.quick_connect import QuickConnectRequest, QuickConnectHelp, QuickConnectToken
from ..models.message import Message
from ..utils.tier_limits import get_tier_limits
from ..models.profile import Profile
from ..utils.dependencies import get_current_user
from app.services.ml_quick_connect_service import ml_quick_connect_service


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/quick-connects", tags=["Quick Connects"])

# ==================== ENUMS ====================
class RequestCategory(str, Enum):
    """Valid request categories matching database constraint"""
    BETA_TESTERS = "beta_testers"
    GUEST_POSTS = "guest_posts"
    ADVICE = "advice"
    FEEDBACK = "feedback"
    COLLABORATION = "collaboration"
    PROMOTION = "promotion"
    TECHNICAL = "technical"
    DESIGN = "design"
    MARKETING = "marketing"
    OTHER = "other"


class RequestUrgency(str, Enum):
    """Request urgency levels"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


# ==================== PYDANTIC MODELS ====================
class RequestCreate(BaseModel):
    title: str
    description: str
    category: str
    tags: Optional[List[str]] = []
    token_reward: int = 50
    urgency: str = "normal"
    target_audience: Optional[str] = None


class HelpCreate(BaseModel):
    request_id: int
    message: str


class RatingCreate(BaseModel):
    help_id: int
    rating: int  # 1-5
    feedback: Optional[str] = None


# ML-specific models
class EnhanceRequestInput(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None


class HelpResponseDraftRequest(BaseModel):
    request_id: int


# ==================== HELPER FUNCTIONS ====================
def calculate_match_score(request: QuickConnectRequest, user_profile: Optional[Profile], db: Session) -> int:
    """Calculate 0-100 match score based on skills, interests, and past help"""
    score = 50  # Base score

    if not user_profile:
        return score

    # Category/interest match (+30 points)
    if user_profile.categories and request.category in user_profile.categories:
        score += 30

    # Tags/skills overlap (+20 points)
    if user_profile.interests and request.tags:
        request_tags = set(request.tags if isinstance(request.tags, list) else [])
        user_interests = set(user_profile.interests)
        overlap = len(request_tags & user_interests)
        score += min(20, overlap * 5)

    # Helper reputation boost (+10 points)
    helper_tokens = db.query(QuickConnectToken).filter(
        QuickConnectToken.user_id == user_profile.user_id
    ).first()

    if helper_tokens and helper_tokens.reputation_score >= 7.0:
        score += 10

    return min(100, score)


def initialize_user_tokens(db: Session, user_id: int) -> QuickConnectToken:
    """Initialize token balance for new user"""
    existing = db.query(QuickConnectToken).filter(
        QuickConnectToken.user_id == user_id
    ).first()

    if existing:
        return existing

    token_record = QuickConnectToken(
        user_id=user_id,
        balance=100,  # Starting balance
        reputation_score=5.0
    )
    db.add(token_record)
    db.commit()
    db.refresh(token_record)
    return token_record


def check_messaging_limit(db: Session, user_id: int, user_tier: str) -> dict:
    """Check if user has reached messaging limit for today"""
    limits = get_tier_limits(user_tier)

    if limits['messages_unlimited']:
        return {'can_message': True, 'unlimited': True}

    # Count new conversations started today
    today = date.today()
    new_chats_today = db.query(func.count(func.distinct(Message.thread_id))).filter(
        Message.sender_id == user_id,
        func.date(Message.created_at) == today
    ).scalar()

    limit = limits['max_new_chats_per_day']
    remaining = limit - new_chats_today

    return {
        'can_message': remaining > 0,
        'unlimited': False,
        'used': new_chats_today,
        'limit': limit,
        'remaining': remaining
    }


# ==================== GET REQUEST BOARD ====================
# ==================== GET REQUEST BOARD ====================
@router.get("/board")
def get_request_board(
    category: Optional[str] = None,
    urgency: Optional[str] = None,
    min_tokens: Optional[int] = None,
    preview: bool = Query(False, description="Preview mode for non-premium users"),  # ✅ ADD THIS
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the board of open requests, sorted by match score and urgency.
    Respects tier limits for result count.
    """
    # Get tier limits
    user_tier = current_user.subscription_tier
    limits = get_tier_limits(user_tier)

    # ✅ MODIFIED: Allow preview mode for non-premium users
    if 'quick_connects' not in limits['routes_available']:
        if preview:
            # Return limited preview data with upgrade message
            query = db.query(QuickConnectRequest).filter(
                QuickConnectRequest.status == "open",
                QuickConnectRequest.requester_id != current_user.id
            )

            # Apply filters if provided
            if category:
                query = query.filter(QuickConnectRequest.category == category)
            if urgency:
                query = query.filter(QuickConnectRequest.urgency == urgency)
            if min_tokens:
                query = query.filter(QuickConnectRequest.token_reward >= min_tokens)

            # Limit to 3 results for preview
            requests = query.order_by(QuickConnectRequest.created_at.desc()).limit(3).all()

            results = []
            for req in requests:
                requester = db.query(User).filter(User.id == req.requester_id).first()
                requester_profile = db.query(Profile).filter(Profile.user_id == req.requester_id).first()

                results.append({
                    "id": req.id,
                    "title": req.title,
                    "description": req.description,
                    "category": req.category,
                    "tags": req.tags if isinstance(req.tags, list) else [],
                    "token_reward": req.token_reward,
                    "urgency": req.urgency,
                    "status": req.status,
                    "view_count": req.view_count,
                    "help_count": req.help_count,
                    "match_score": 50,  # Default match score in preview
                    "created_at": req.created_at.isoformat(),
                    "requester": {
                        "id": requester.id,
                        "username": requester.username,
                        "name": requester_profile.name if requester_profile else requester.username,
                        "categories": requester_profile.categories if requester_profile else []
                    }
                })

            return {
                'results': results,
                'preview_mode': True,
                'tier_info': {
                    'tier': user_tier,
                    'results_shown': len(results),
                    'max_results': 3,
                    'is_premium': False,
                    'message': 'Upgrade to Pro to see all requests and unlock full Quick Connects features',
                    'upgrade_required': True
                }
            }
        else:
            raise HTTPException(
                status_code=402,
                detail={
                    'error': 'Quick Connects not available',
                    'tier': user_tier,
                    'upgrade_message': 'Upgrade to Pro to unlock Quick Connects',
                    'available_routes': limits['routes_available']
                }
            )

    # ✅ FULL ACCESS FOR PREMIUM USERS (existing code)
    user_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()

    # Get open requests (exclude user's own)
    query = db.query(QuickConnectRequest).filter(
        QuickConnectRequest.status == "open",
        QuickConnectRequest.requester_id != current_user.id
    )

    # Apply filters
    if category:
        query = query.filter(QuickConnectRequest.category == category)
    if urgency:
        query = query.filter(QuickConnectRequest.urgency == urgency)
    if min_tokens:
        query = query.filter(QuickConnectRequest.token_reward >= min_tokens)

    # Apply tier-based result limits
    result_limit = 50 if user_tier == 'pro' else 20
    requests = query.order_by(QuickConnectRequest.created_at.desc()).limit(result_limit).all()

    # Add match scoring
    results = []
    for req in requests:
        match_score = calculate_match_score(req, user_profile, db)

        # Get requester info
        requester = db.query(User).filter(User.id == req.requester_id).first()
        requester_profile = db.query(Profile).filter(Profile.user_id == req.requester_id).first()

        results.append({
            "id": req.id,
            "title": req.title,
            "description": req.description,
            "category": req.category,
            "tags": req.tags if isinstance(req.tags, list) else [],
            "token_reward": req.token_reward,
            "urgency": req.urgency,
            "status": req.status,
            "view_count": req.view_count,
            "help_count": req.help_count,
            "match_score": match_score,
            "created_at": req.created_at.isoformat(),
            "requester": {
                "id": requester.id,
                "username": requester.username,
                "name": requester_profile.name if requester_profile else requester.username,
                "categories": requester_profile.categories if requester_profile else []
            }
        })

    # Sort by match score (highest first)
    results.sort(key=lambda x: x["match_score"], reverse=True)

    return {
        'results': results,
        'preview_mode': False,
        'tier_info': {
            'tier': user_tier,
            'results_shown': len(results),
            'max_results': result_limit,
            'is_premium': user_tier == 'pro'
        }
    }


# ==================== CREATE REQUEST ====================
@router.post("/requests")
def create_request(
    request_data: RequestCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new help request. Costs tokens to post.
    Quick Connects must be unlocked via tier.
    """
    # Check tier access
    user_tier = current_user.subscription_tier
    limits = get_tier_limits(user_tier)

    if 'quick_connects' not in limits['routes_available']:
        raise HTTPException(
            status_code=402,
            detail={
                'error': 'Quick Connects not available',
                'tier': user_tier,
                'upgrade_message': 'Upgrade to Pro to unlock Quick Connects'
            }
        )

    # Initialize tokens if needed
    user_tokens = initialize_user_tokens(db, current_user.id)

    # Check if user has enough tokens
    posting_cost = 10  # Cost to create a request
    if user_tokens.balance < posting_cost:
        raise HTTPException(400, f"Insufficient tokens. Need {posting_cost}, have {user_tokens.balance}")

    # Deduct posting cost
    user_tokens.balance -= posting_cost
    user_tokens.lifetime_spent += posting_cost

    # Create request
    new_request = QuickConnectRequest(
        requester_id=current_user.id,
        title=request_data.title.strip(),
        description=request_data.description.strip(),
        category=request_data.category,
        tags=request_data.tags if request_data.tags else [],
        token_reward=request_data.token_reward,
        urgency=request_data.urgency,
        target_audience=request_data.target_audience,
        status="open",
        expires_at=datetime.utcnow() + timedelta(days=30)  # 30-day expiry
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    # ML-based notifications (background task)
    background_tasks.add_task(
        ml_quick_connect_service.notify_relevant_helpers,
        new_request.id,
        db
    )

    return {
        "success": True,
        "request": {
            "id": new_request.id,
            "title": new_request.title,
            "token_reward": new_request.token_reward,
            "status": new_request.status
        },
        "tokens_spent": posting_cost,
        "new_balance": user_tokens.balance
    }


# ==================== OFFER HELP ====================
@router.post("/help")
def offer_help(
    help_data: HelpCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Offer to help with a request.
    Respects messaging tier limits.
    """
    # Check tier access
    user_tier = current_user.subscription_tier
    limits = get_tier_limits(user_tier)

    if 'quick_connects' not in limits['routes_available']:
        raise HTTPException(
            status_code=402,
            detail={
                'error': 'Quick Connects not available',
                'tier': user_tier,
                'upgrade_message': 'Upgrade to Pro to unlock Quick Connects'
            }
        )

    # Check messaging limits
    messaging_status = check_messaging_limit(db, current_user.id, user_tier)
    if not messaging_status['can_message']:
        raise HTTPException(
            status_code=429,
            detail={
                'error': 'Daily new chat limit reached',
                'used': messaging_status['used'],
                'limit': messaging_status['limit'],
                'upgrade_message': 'Upgrade to Pro for unlimited messaging'
            }
        )

    # Verify request exists and is open
    request = db.query(QuickConnectRequest).filter(
        QuickConnectRequest.id == help_data.request_id
    ).first()

    if not request:
        raise HTTPException(404, "Request not found")

    if request.status != "open":
        raise HTTPException(400, f"Request is {request.status}, not accepting help")

    if request.requester_id == current_user.id:
        raise HTTPException(400, "Cannot help your own request")

    # Check if already helped
    existing_help = db.query(QuickConnectHelp).filter(
        QuickConnectHelp.request_id == help_data.request_id,
        QuickConnectHelp.helper_id == current_user.id
    ).first()

    if existing_help:
        raise HTTPException(400, "You've already offered help for this request")

    # Create help offer
    help_offer = QuickConnectHelp(
        request_id=help_data.request_id,
        helper_id=current_user.id,
        message=help_data.message.strip(),
        status="pending"
    )
    db.add(help_offer)

    # Update request metrics
    request.help_count = (request.help_count or 0) + 1

    db.commit()
    db.refresh(help_offer)

    return {
        "success": True,
        "help_id": help_offer.id,
        "message": "Help offer submitted! Awaiting requester's response.",
        "tier_info": {
            'tier': user_tier,
            'messaging_status': messaging_status
        }
    }


# ==================== ACCEPT HELP ====================
@router.post("/help/{help_id}/accept")
def accept_help(
    help_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Accept a help offer (requester only).
    """
    help_offer = db.query(QuickConnectHelp).filter(
        QuickConnectHelp.id == help_id
    ).first()

    if not help_offer:
        raise HTTPException(404, "Help offer not found")

    request = help_offer.request
    if request.requester_id != current_user.id:
        raise HTTPException(403, "Only the requester can accept help")

    if help_offer.status != "pending":
        raise HTTPException(400, f"Help offer is already {help_offer.status}")

    # Accept the help
    help_offer.status = "accepted"
    request.status = "in_progress"

    db.commit()

    return {
        "success": True,
        "message": "Help accepted! You can now connect with the helper."
    }


# ==================== COMPLETE & RATE HELP ====================
@router.post("/help/rate")
def rate_help(
    rating_data: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Rate completed help and award tokens to helper.
    """
    help_offer = db.query(QuickConnectHelp).filter(
        QuickConnectHelp.id == rating_data.help_id
    ).first()

    if not help_offer:
        raise HTTPException(404, "Help offer not found")

    request = help_offer.request
    if request.requester_id != current_user.id:
        raise HTTPException(403, "Only the requester can rate help")

    if help_offer.rating is not None:
        raise HTTPException(400, "Help already rated")

    # Validate rating
    if rating_data.rating < 1 or rating_data.rating > 5:
        raise HTTPException(400, "Rating must be between 1 and 5")

    # Award tokens to helper
    helper_tokens = initialize_user_tokens(db, help_offer.helper_id)
    tokens_to_award = request.token_reward

    helper_tokens.balance += tokens_to_award
    helper_tokens.lifetime_earned += tokens_to_award
    helper_tokens.help_given_count += 1

    # Update helper's reputation
    helper_tokens.total_ratings += 1
    helper_tokens.average_rating = (
        (helper_tokens.average_rating * (helper_tokens.total_ratings - 1) + rating_data.rating) /
        helper_tokens.total_ratings
    )
    helper_tokens.reputation_score = min(10.0, helper_tokens.average_rating * 2)

    # Update help offer
    help_offer.rating = rating_data.rating
    help_offer.feedback = rating_data.feedback
    help_offer.status = "completed"
    help_offer.tokens_awarded = tokens_to_award
    help_offer.completed_at = datetime.utcnow()

    # Update request
    request.status = "completed"
    request.completed_at = datetime.utcnow()

    db.commit()

    return {
        "success": True,
        "tokens_awarded": tokens_to_award,
        "helper_new_balance": helper_tokens.balance,
        "helper_reputation": round(helper_tokens.reputation_score, 1)
    }


# ==================== GET MY REQUESTS ====================
@router.get("/my-requests")
def get_my_requests(
    preview: bool = Query(False, description="Preview mode for non-premium users"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's posted requests with help offers."""
    # Check tier access
    user_tier = current_user.subscription_tier
    limits = get_tier_limits(user_tier)

    # Allow preview mode for non-premium users
    if 'quick_connects' not in limits['routes_available']:
        if preview:
            # Return empty data with upgrade message for preview
            return {
                "requests": [],
                "preview_mode": True,
                "tier": user_tier,
                "message": "Upgrade to Pro to create and manage help requests",
                "upgrade_required": True
            }
        else:
            raise HTTPException(
                status_code=402,
                detail={
                    'error': 'Quick Connects not available',
                    'tier': user_tier,
                    'upgrade_message': 'Upgrade to Pro to unlock Quick Connects'
                }
            )

    requests = db.query(QuickConnectRequest).filter(
        QuickConnectRequest.requester_id == current_user.id
    ).order_by(QuickConnectRequest.created_at.desc()).all()

    results = []
    for req in requests:
        # Get help offers for this request
        help_offers = db.query(QuickConnectHelp).filter(
            QuickConnectHelp.request_id == req.id
        ).order_by(QuickConnectHelp.created_at.desc()).all()

        results.append({
            "id": req.id,
            "title": req.title,
            "description": req.description,
            "category": req.category,
            "token_reward": req.token_reward,
            "status": req.status,
            "urgency": req.urgency,
            "help_count": req.help_count,
            "view_count": req.view_count,
            "created_at": req.created_at.isoformat(),
            "help_offers": [
                {
                    "id": help.id,
                    "helper_id": help.helper_id,
                    "message": help.message,
                    "status": help.status,
                    "rating": help.rating,
                    "created_at": help.created_at.isoformat()
                }
                for help in help_offers
            ]
        })

    return {
        "requests": results,
        "preview_mode": False,
        "tier": user_tier,
        "total_count": len(results)
    }


# ==================== GET MY HELP GIVEN ====================
@router.get("/my-help-given")
def get_my_help_given(
    preview: bool = Query(False, description="Preview mode for non-premium users"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get help offers I've given."""
    # Check tier access
    user_tier = current_user.subscription_tier
    limits = get_tier_limits(user_tier)

    # Allow preview mode for non-premium users
    if 'quick_connects' not in limits['routes_available']:
        if preview:
            # Return empty data with upgrade message for preview
            return {
                "help_given": [],
                "preview_mode": True,
                "tier": user_tier,
                "message": "Upgrade to Pro to offer help and earn tokens",
                "upgrade_required": True
            }
        else:
            raise HTTPException(
                status_code=402,
                detail={
                    'error': 'Quick Connects not available',
                    'tier': user_tier,
                    'upgrade_message': 'Upgrade to Pro to unlock Quick Connects'
                }
            )

    help_given = db.query(QuickConnectHelp).filter(
        QuickConnectHelp.helper_id == current_user.id
    ).order_by(QuickConnectHelp.created_at.desc()).all()

    results = []
    for help in help_given:
        request = help.request
        requester = db.query(User).filter(User.id == request.requester_id).first()

        results.append({
            "id": help.id,
            "request": {
                "id": request.id,
                "title": request.title,
                "category": request.category,
                "token_reward": request.token_reward
            },
            "requester": {
                "id": requester.id,
                "username": requester.username
            },
            "message": help.message,
            "status": help.status,
            "rating": help.rating,
            "feedback": help.feedback,
            "tokens_awarded": help.tokens_awarded,
            "created_at": help.created_at.isoformat()
        })

    return {
        "help_given": results,
        "preview_mode": False,
        "tier": user_tier,
        "total_count": len(results)
    }


# ==================== GET TOKEN BALANCE ====================
@router.get("/tokens")
def get_token_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's token balance and stats."""
    tokens = initialize_user_tokens(db, current_user.id)

    return {
        "balance": tokens.balance,
        "lifetime_earned": tokens.lifetime_earned,
        "lifetime_spent": tokens.lifetime_spent,
        "reputation_score": round(tokens.reputation_score, 1),
        "help_given_count": tokens.help_given_count,
        "help_received_count": tokens.help_received_count,
        "average_rating": round(tokens.average_rating, 1)
    }


# ==================== GET LEADERBOARD ====================
@router.get("/leaderboard")
def get_leaderboard(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get top helpers by reputation."""
    top_helpers = db.query(QuickConnectToken).order_by(
        QuickConnectToken.reputation_score.desc()
    ).limit(limit).all()

    results = []
    for token_record in top_helpers:
        user = db.query(User).filter(User.id == token_record.user_id).first()
        profile = db.query(Profile).filter(Profile.user_id == token_record.user_id).first()

        results.append({
            "user_id": user.id,
            "username": user.username,
            "name": profile.name if profile else user.username,
            "reputation_score": round(token_record.reputation_score, 1),
            "help_given_count": token_record.help_given_count,
            "average_rating": round(token_record.average_rating, 1)
        })

    return results


# ==================== ML ENDPOINTS ====================

@router.post("/ml/suggest-helpers/{request_id}")
async def ml_suggest_helpers(
    request_id: int,
    max_suggestions: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Pure ML suggests best helpers based on:
    - TF-IDF text similarity
    - Category experience & success rate
    - Reputation scoring
    - Response time analysis

    AI features limited by tier.
    """
    # Check AI feature access
    user_tier = current_user.subscription_tier
    limits = get_tier_limits(user_tier)

    if not limits['ai_predictions']:
        raise HTTPException(
            status_code=402,
            detail={
                'error': 'AI helper suggestions not available',
                'tier': user_tier,
                'upgrade_message': 'Upgrade to Pro for AI-powered helper suggestions'
            }
        )

    try:
        suggestions = ml_quick_connect_service.suggest_helpers(
            request_id=request_id,
            db=db,
            max_suggestions=max_suggestions
        )

        return {
            "success": True,
            "request_id": request_id,
            "suggestions": suggestions,
            "count": len(suggestions)
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error suggesting helpers: {str(e)}")


@router.post("/ml/enhance-request")
async def ml_enhance_request(
    data: EnhanceRequestInput,
    current_user: User = Depends(get_current_user)
):
    """ML enhances request with rules and pattern matching"""
    # Check AI feature access
    user_tier = current_user.subscription_tier
    limits = get_tier_limits(user_tier)

    if not limits['ai_profile_analysis']:
        raise HTTPException(
            status_code=402,
            detail={
                'error': 'AI request enhancement not available',
                'tier': user_tier,
                'upgrade_message': 'Upgrade to Pro for AI-enhanced requests'
            }
        )

    try:
        enhanced = ml_quick_connect_service.enhance_request(
            title=data.title,
            description=data.description,
            category=data.category
        )

        return {
            "success": True,
            "enhanced": enhanced
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error enhancing request: {str(e)}")


@router.post("/ml/draft-help-response")
async def ml_draft_help_response(
    data: HelpResponseDraftRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ML generates template for help response"""
    # Check AI feature access
    user_tier = current_user.subscription_tier
    limits = get_tier_limits(user_tier)

    if not limits['ai_icebreakers']:
        raise HTTPException(
            status_code=402,
            detail={
                'error': 'AI response drafts not available',
                'tier': user_tier,
                'upgrade_message': 'Upgrade to Pro for AI-generated response templates'
            }
        )

    try:
        draft = ml_quick_connect_service.generate_help_response_draft(
            request_id=data.request_id,
            helper_id=current_user.id,
            db=db
        )

        return {
            "success": True,
            "draft": draft
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error drafting response: {str(e)}")
