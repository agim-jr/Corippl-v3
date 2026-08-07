# backend/app/api/subscription_routes.py

import logging
import stripe
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import date
from sqlalchemy import func

from app.services.payment_service import create_checkout_session, handle_successful_checkout, cancel_subscription
from app.services.subscription_service import upgrade_to_premium
from ..utils.dependencies import get_current_user
from ..utils.tier_limits import get_tier_limits
from app.models.user import User
from app.models.pool_submission import PoolSubmission
from app.models.collective import CollectiveMembership
from app.models.message import Message
from app.database import SessionLocal, get_db
from app.config import settings

# Set up logger
logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter(prefix="/api/subscription", tags=["Subscriptions"])




# ==================== REQUEST MODELS ====================

class CheckoutRequest(BaseModel):
    billing_cycle: str = "monthly"  # "monthly" or "annual"


# ==================== CHECKOUT ENDPOINTS ====================

@router.post("/create-checkout-session", status_code=200)
def create_checkout(
    request: CheckoutRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a Stripe Checkout Session for Pro plan with free trial."""
    logger.info(f"Creating checkout session for user: {current_user.email} (ID: {current_user.id})")
    logger.info(f"Billing cycle: {request.billing_cycle}")

    # Check if user already has premium
    if current_user.is_premium:
        logger.warning(f"User {current_user.email} already has Pro subscription")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active Pro subscription"
        )

    # Validate billing cycle
    if request.billing_cycle not in ["monthly", "annual"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid billing cycle. Must be 'monthly' or 'annual'."
        )

    try:
        checkout_session_id = create_checkout_session(
            current_user.id,
            request.billing_cycle
        )
        logger.info(f"Checkout session created successfully: {checkout_session_id}")

        # Check if trial is available
        trial_available = not current_user.trial_used

        return {
            "checkout_session_id": checkout_session_id,
            "plan": "pro",
            "billing_cycle": request.billing_cycle,
            "trial_available": trial_available,
            "trial_days": settings.FREE_TRIAL_DAYS if trial_available else 0
        }
    except HTTPException as e:
        logger.error(f"HTTP exception creating checkout session: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error creating checkout session: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing your request"
        )


@router.get("/verify-session/{session_id}", status_code=200)
def verify_session(session_id: str, current_user: User = Depends(get_current_user)):
    """Manually verify a checkout session and upgrade the user if needed."""
    logger.info(f"Manually verifying session {session_id} for user {current_user.email}")

    try:
        result = handle_successful_checkout(session_id)
        return result
    except Exception as e:
        logger.error(f"Error verifying session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== WEBHOOK ENDPOINT ====================

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhooks for subscription events."""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = int(session['metadata']['user_id'])

        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.is_premium = True
            user.remaining_shuffles = -1

            # Mark trial as used if it was offered
            if session['metadata'].get('trial_offered') == 'True' and not user.trial_used:
                user.trial_used = True

            db.commit()
            logger.info(f"User {user_id} upgraded to Pro via webhook")

    elif event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        user_email = subscription.get('customer_email')

        if user_email:
            user = db.query(User).filter(User.email == user_email).first()
            if user:
                # Check subscription status
                if subscription['status'] in ['active', 'trialing']:
                    user.is_premium = True
                    user.remaining_shuffles = -1
                else:
                    user.is_premium = False
                    user.remaining_shuffles = 3
                db.commit()
                logger.info(f"User {user.id} subscription updated via webhook")

    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        customer_email = subscription.get('customer_email')

        if customer_email:
            user = db.query(User).filter(User.email == customer_email).first()
            if user:
                user.is_premium = False
                user.remaining_shuffles = 3
                db.commit()
                logger.info(f"User {user.id} subscription cancelled via webhook")

    return {"status": "success"}


# ==================== SUBSCRIPTION STATUS ====================

@router.get("/status", status_code=200)
def get_subscription_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get current user's subscription status with tier limits and usage."""
    logger.info(f"Checking subscription status for user: {current_user.email} (ID: {current_user.id})")

    tier = current_user.subscription_tier
    limits = get_tier_limits(tier)

    # Calculate current usage
    active_submissions = db.query(PoolSubmission).filter(
        PoolSubmission.user_id == current_user.id,
        PoolSubmission.status.in_(['pending', 'approved'])
    ).count()

    groups_joined = db.query(CollectiveMembership).filter(
        CollectiveMembership.user_id == current_user.id
    ).count()

    groups_created = db.query(CollectiveMembership).filter(
        CollectiveMembership.user_id == current_user.id,
        CollectiveMembership.is_admin == True
    ).count()

    # Calculate daily messaging usage
    today = date.today()
    new_chats_today = db.query(func.count(func.distinct(Message.thread_id))).filter(
        Message.sender_id == current_user.id,
        func.date(Message.created_at) == today
    ).scalar() or 0

    # Calculate quota remaining
    def get_remaining(current: int, limit: int) -> str:
        if limit == -1:
            return "unlimited"
        remaining = max(0, limit - current)
        return f"{remaining}/{limit} remaining"

    # Check trial status
    from datetime import datetime
    trial_active = False
    trial_days_remaining = None
    if hasattr(current_user, 'trial_end_date') and current_user.trial_end_date and current_user.is_premium:
        trial_active = datetime.utcnow() < current_user.trial_end_date
        if trial_active:
            trial_days_remaining = (current_user.trial_end_date - datetime.utcnow()).days

    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "tier": {
            "name": tier,
            "display_name": "Pro" if tier == "pro" else "Explorer",
            "is_premium": current_user.is_premium
        },
        "trial": {
            "available": not getattr(current_user, 'trial_used', False),
            "active": trial_active,
            "days_remaining": trial_days_remaining,
            "trial_days": settings.FREE_TRIAL_DAYS
        },
        "limits": limits,
        "usage": {
            "active_submissions": {
                "current": active_submissions,
                "limit": limits['max_active_submissions'],
                "remaining": get_remaining(active_submissions, limits['max_active_submissions'])
            },
            "groups_joined": {
                "current": groups_joined,
                "limit": limits['max_groups_join'],
                "remaining": get_remaining(groups_joined, limits['max_groups_join'])
            },
            "groups_created": {
                "current": groups_created,
                "limit": limits['max_groups_create'],
                "remaining": get_remaining(groups_created, limits['max_groups_create'])
            },
            "new_chats_today": {
                "current": new_chats_today,
                "limit": limits['max_new_chats_per_day'],
                "remaining": get_remaining(new_chats_today, limits['max_new_chats_per_day'])
            }
        },
        "features": {
            "routes_unlocked": {
                "count": limits['max_routes'],
                "available": limits['routes_available']
            },
            "queue_access": "unlimited" if limits['queue_unlimited'] else f"{limits['queue_daily_limit']}/day",
            "submissions": "unlimited" if limits['submissions_unlimited'] else f"{limits['max_active_submissions']} active",
            "messaging": "unlimited" if limits['messages_unlimited'] else f"{limits['max_new_chats_per_day']} new chats/day",
            "ai_features": "full" if limits['ai_profile_analysis'] else "basic",
            "ai_icebreakers": limits['ai_icebreakers'],
            "ai_predictions": limits['ai_predictions'],
            "analytics": "advanced" if limits['advanced_analytics'] else "basic",
            "collectives": "unlimited" if limits['max_groups_join'] == -1 else f"{limits['max_groups_join']} groups",
            "priority_boost": f"{int(limits['queue_priority_boost'] * 100)}%" if limits['queue_priority_boost'] > 0 else "none"
        },
        "tokens": {
            "starting": limits['starting_tokens'],
            "monthly_bonus": limits['monthly_bonus_tokens']
        }
    }


@router.get("/compare-plans")
def compare_subscription_plans():
    """Get detailed comparison of Free vs Pro plans."""
    free_limits = get_tier_limits('free')
    pro_limits = get_tier_limits('pro')

    return {
        "plans": [
            {
                "tier": "free",
                "name": "Explorer",
                "price": 0,
                "price_display": "Free Forever",
                "billing": None,
                "description": "Perfect for getting started with creator connections",
                "limits": free_limits,
                "features": [
                    {
                        "category": "Growth Routes",
                        "items": [
                            {"text": "1 AI-matched route", "available": True},
                            {"text": "Audience Pool access", "available": True},
                            {"text": "Collectives & Quick Connects", "available": False}
                        ]
                    },
                    {
                        "category": "Discovery",
                        "items": [
                            {"text": "20 daily queue views", "available": True},
                            {"text": "3 active submissions", "available": True},
                            {"text": "Basic matching algorithm", "available": True}
                        ]
                    },
                    {
                        "category": "Messaging",
                        "items": [
                            {"text": "5 new chats per day", "available": True},
                            {"text": "Unlimited replies", "available": True}
                        ]
                    },
                    {
                        "category": "AI Features",
                        "items": [
                            {"text": "Basic profile analysis", "available": True},
                            {"text": "Generic icebreakers", "available": True},
                            {"text": "AI predictions & insights", "available": False}
                        ]
                    },
                    {
                        "category": "Community",
                        "items": [
                            {"text": "Join 2 collectives", "available": True},
                            {"text": "Create collectives", "available": False}
                        ]
                    }
                ],
                "cta": "Current Plan",
                "recommended": False
            },
            {
                "tier": "pro",
                "name": "Pro",
                "price": 29,
                "price_display": "$29/month",
                "billing": "monthly",
                "annual_price": 276,
                "annual_display": "$23/month (billed annually)",
                "description": "Unlock unlimited access and advanced AI features",
                "trial": {
                    "available": True,
                    "days": settings.FREE_TRIAL_DAYS,
                    "message": f"{settings.FREE_TRIAL_DAYS}-day free trial included"
                },
                "limits": pro_limits,
                "features": [
                    {
                        "category": "Growth Routes",
                        "items": [
                            {"text": "All 3 growth routes unlocked", "available": True, "highlight": True},
                            {"text": "Audience Pool + Collectives + Quick Connects", "available": True}
                        ]
                    },
                    {
                        "category": "Discovery",
                        "items": [
                            {"text": "Unlimited queue access", "available": True, "highlight": True},
                            {"text": "Unlimited submissions", "available": True, "highlight": True},
                            {"text": "25% priority boost", "available": True},
                            {"text": "Advanced AI matching", "available": True}
                        ]
                    },
                    {
                        "category": "Messaging",
                        "items": [
                            {"text": "Unlimited messaging", "available": True, "highlight": True},
                            {"text": "AI-powered icebreakers", "available": True}
                        ]
                    },
                    {
                        "category": "AI Features",
                        "items": [
                            {"text": "Deep profile analysis", "available": True, "highlight": True},
                            {"text": "AI collaboration predictions", "available": True},
                            {"text": "Personalized insights", "available": True},
                            {"text": "Advanced analytics dashboard", "available": True}
                        ]
                    },
                    {
                        "category": "Community",
                        "items": [
                            {"text": "Join unlimited collectives", "available": True, "highlight": True},
                            {"text": "Create unlimited collectives", "available": True, "highlight": True},
                            {"text": "AI-powered scheduling", "available": True}
                        ]
                    },
                    {
                        "category": "Bonuses",
                        "items": [
                            {"text": "200 bonus tokens monthly", "available": True},
                            {"text": "Priority support", "available": True},
                            {"text": f"{settings.FREE_TRIAL_DAYS}-day free trial", "available": True, "highlight": True}
                        ]
                    }
                ],
                "cta": "Start Free Trial",
                "recommended": True,
                "badge": "Most Popular",
                "savings": "Save $72/year with annual billing"
            }
        ]
    }


# ==================== SUBSCRIPTION MANAGEMENT ====================

@router.post("/cancel")
def cancel_user_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel user's Pro subscription."""
    logger.info(f"Cancellation requested for user: {current_user.email} (ID: {current_user.id})")

    if not current_user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active subscription to cancel"
        )

    try:
        result = cancel_subscription(current_user.id)
        return result
    except HTTPException as e:
        logger.error(f"HTTP exception cancelling subscription: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error cancelling subscription: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel subscription"
        )


# ==================== TESTING ENDPOINTS (Remove in production) ====================

@router.post("/test-upgrade", status_code=200)
def manual_upgrade(current_user: User = Depends(get_current_user)):
    """Test endpoint to manually upgrade a user to Pro. **REMOVE IN PRODUCTION**"""
    logger.info(f"Manual upgrade requested for user: {current_user.email} (ID: {current_user.id})")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == current_user.id).first()
        if not user:
            logger.error(f"User not found in database: {current_user.id}")
            db.close()
            raise HTTPException(status_code=404, detail="User not found.")

        user.is_premium = True
        user.remaining_shuffles = -1
        db.commit()
        db.refresh(user)

        logger.info(f"Successfully upgraded user to Pro via test endpoint: {user.email}")

        return {
            "message": "User upgraded to Pro successfully",
            "user_id": user.id,
            "email": user.email,
            "is_premium": user.is_premium,
            "tier": "pro"
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error in manual upgrade: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.post("/test-downgrade", status_code=200)
def manual_downgrade(current_user: User = Depends(get_current_user)):
    """Test endpoint to manually downgrade a user from Pro. **REMOVE IN PRODUCTION**"""
    logger.info(f"Manual downgrade requested for user: {current_user.email} (ID: {current_user.id})")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == current_user.id).first()
        if not user:
            logger.error(f"User not found in database: {current_user.id}")
            db.close()
            raise HTTPException(status_code=404, detail="User not found.")

        user.is_premium = False
        user.remaining_shuffles = 3
        db.commit()
        db.refresh(user)

        logger.info(f"Successfully downgraded user from Pro via test endpoint: {user.email}")

        return {
            "message": "User downgraded from Pro successfully",
            "user_id": user.id,
            "email": user.email,
            "is_premium": user.is_premium,
            "tier": "free"
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error in manual downgrade: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
