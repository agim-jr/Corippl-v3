# backend/app/services/payment_service.py

import logging
import stripe
from fastapi import HTTPException, status
from app.config import settings
from sqlalchemy.orm import Session
from app.models.user import User
from app.database import SessionLocal
from datetime import datetime, timedelta

# Set up logger
logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY
logger.info(f"Stripe API configured with key: {settings.STRIPE_SECRET_KEY[:12]}...")


def get_price_id(billing_cycle: str) -> str:
    """Get the appropriate Stripe price ID based on billing cycle."""
    if billing_cycle == "monthly":
        return settings.STRIPE_PRO_MONTHLY_PRICE_ID
    elif billing_cycle == "annual":
        return settings.STRIPE_PRO_ANNUAL_PRICE_ID
    else:
        raise ValueError(f"Invalid billing cycle: {billing_cycle}")


def create_checkout_session(user_id: int, billing_cycle: str = "monthly") -> str:
    """
    Create a Stripe checkout session for Pro plan with free trial.

    Args:
        user_id: The ID of the user purchasing the subscription
        billing_cycle: Either "monthly" or "annual"

    Returns:
        str: The Stripe checkout session ID
    """
    logger.info(f"Creating checkout session for user ID: {user_id}, cycle: {billing_cycle}")

    # Validate Stripe configuration
    if not stripe.api_key or stripe.api_key == "":
        logger.error("Stripe API key is not configured")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment system not configured"
        )

    # Validate billing cycle
    if billing_cycle not in ["monthly", "annual"]:
        logger.error(f"Invalid billing cycle: {billing_cycle}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Billing cycle must be 'monthly' or 'annual'"
        )

    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.error(f"User with ID {user_id} not found")
            raise HTTPException(status_code=404, detail="User not found.")

        # Check if user already has premium
        if user.is_premium:
            logger.warning(f"User {user_id} already has an active Pro subscription")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have an active Pro subscription"
            )

        # Check if user already used free trial
        if user.trial_used:
            logger.info(f"User {user_id} already used their free trial")
            trial_period_days = None
        else:
            trial_period_days = settings.FREE_TRIAL_DAYS
            logger.info(f"User {user_id} eligible for {trial_period_days}-day free trial")

        # Get the appropriate price ID
        price_id = get_price_id(billing_cycle)

        logger.info(f"Creating Stripe checkout session for user: {user.email}")
        logger.info(f"Price ID: {price_id}")
        logger.info(f"Trial period: {trial_period_days} days" if trial_period_days else "No trial")

        # Create the checkout session
        session_params = {
            "payment_method_types": ["card"],
            "customer_email": user.email,
            "line_items": [
                {
                    "price": price_id,
                    "quantity": 1,
                },
            ],
            "mode": "subscription",
            "metadata": {
                "user_id": str(user_id),
                "plan_type": "pro",
                "billing_cycle": billing_cycle,
                "trial_offered": str(trial_period_days is not None)
            },
            "success_url": f"{settings.FRONTEND_URL}/success?session_id={{CHECKOUT_SESSION_ID}}",
            "cancel_url": f"{settings.FRONTEND_URL}/pricing",
            "allow_promotion_codes": True,
            "billing_address_collection": "required",
        }

        # Add trial period if eligible
        if trial_period_days:
            session_params["subscription_data"] = {
                "trial_period_days": trial_period_days,
                "metadata": {
                    "trial_days": str(trial_period_days)
                }
            }

        checkout_session = stripe.checkout.Session.create(**session_params)

        logger.info(f"Checkout session created successfully. Session ID: {checkout_session.id}")
        return checkout_session.id

    except stripe.error.InvalidRequestError as e:
        logger.error(f"Stripe Invalid Request Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid payment request: {str(e)}"
        )
    except stripe.error.AuthenticationError as e:
        logger.error(f"Stripe Authentication Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment system authentication failed"
        )
    except stripe.error.APIConnectionError as e:
        logger.error(f"Stripe API Connection Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment system connection failed"
        )
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment system error: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating checkout session: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing your request"
        )
    finally:
        db.close()


def handle_successful_checkout(session_id: str) -> dict:
    """
    Handle successful checkout by updating user's subscription status.

    Args:
        session_id: The Stripe checkout session ID

    Returns:
        dict: Information about the updated subscription
    """
    logger.info(f"Processing successful checkout for session: {session_id}")

    db: Session = SessionLocal()
    try:
        # Retrieve the session from Stripe
        session = stripe.checkout.Session.retrieve(session_id)

        if session.payment_status not in ["paid", "no_payment_required"]:
            logger.warning(f"Session {session_id} payment status: {session.payment_status}")
            # For trials, payment_status might be "no_payment_required"
            if session.mode == "subscription" and session.subscription:
                logger.info("Session is a subscription with trial - proceeding")
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Payment not completed"
                )

        # Get user ID from metadata
        user_id = int(session.metadata.get("user_id"))
        billing_cycle = session.metadata.get("billing_cycle")
        trial_offered = session.metadata.get("trial_offered") == "True"

        # Update user's subscription status
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.error(f"User {user_id} not found during checkout completion")
            raise HTTPException(status_code=404, detail="User not found")

        # Get subscription details from Stripe
        subscription = None
        trial_end = None
        if session.subscription:
            subscription = stripe.Subscription.retrieve(session.subscription)
            if subscription.trial_end:
                trial_end = datetime.fromtimestamp(subscription.trial_end)
                logger.info(f"Trial ends at: {trial_end}")

        # Activate Pro subscription
        user.is_premium = True
        user.stripe_subscription_id = str(session.subscription) if session.subscription else None
        user.stripe_customer_id = str(session.customer) if session.customer else None

        # Mark trial as used if it was offered
        if trial_offered and not user.trial_used:
            user.trial_used = True
            user.trial_start_date = datetime.utcnow()
            user.trial_end_date = trial_end
            logger.info(f"Marked trial as used for user {user_id}")

        db.commit()

        logger.info(f"Successfully upgraded user {user_id} to Pro ({billing_cycle})")

        return {
            "success": True,
            "user_id": user_id,
            "plan": "pro",
            "billing_cycle": billing_cycle,
            "trial_active": trial_offered,
            "trial_end": trial_end.isoformat() if trial_end else None,
            "message": f"Successfully upgraded to Pro! {'Enjoy your 14-day free trial.' if trial_offered else ''}"
        }

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error during checkout completion: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify payment"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during checkout completion: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete subscription"
        )
    finally:
        db.close()


def cancel_subscription(user_id: int) -> dict:
    """
    Cancel a user's subscription.

    Args:
        user_id: The ID of the user canceling their subscription

    Returns:
        dict: Information about the cancellation
    """
    logger.info(f"Processing subscription cancellation for user {user_id}")

    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if not user.is_premium:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active subscription to cancel"
            )

        # Cancel in Stripe if subscription ID exists
        if user.stripe_subscription_id:
            try:
                stripe.Subscription.modify(
                    user.stripe_subscription_id,
                    cancel_at_period_end=True
                )
                logger.info(f"Stripe subscription {user.stripe_subscription_id} set to cancel at period end")
            except stripe.error.StripeError as e:
                logger.error(f"Failed to cancel Stripe subscription: {str(e)}")
                # Continue with local cancellation even if Stripe fails

        # Update local status
        user.is_premium = False
        user.stripe_subscription_id = None
        db.commit()

        logger.info(f"Successfully cancelled subscription for user {user_id}")

        return {
            "success": True,
            "user_id": user_id,
            "message": "Subscription cancelled successfully. You'll retain access until the end of your billing period."
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling subscription: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel subscription"
        )
    finally:
        db.close()


def get_subscription_status(user_id: int) -> dict:
    """
    Get the current subscription status for a user.

    Args:
        user_id: The ID of the user

    Returns:
        dict: Subscription status information
    """
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check trial status
        trial_active = False
        trial_days_remaining = None
        if user.trial_end_date and user.is_premium:
            trial_active = datetime.utcnow() < user.trial_end_date
            if trial_active:
                trial_days_remaining = (user.trial_end_date - datetime.utcnow()).days

        return {
            "user_id": user_id,
            "tier": user.subscription_tier,
            "is_premium": user.is_premium,
            "has_premium_access": user.has_premium_access,
            "trial_active": trial_active,
            "trial_days_remaining": trial_days_remaining,
            "trial_used": user.trial_used,
            "stripe_subscription_id": user.stripe_subscription_id
        }

    finally:
        db.close()
