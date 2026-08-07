import logging
from sqlalchemy.orm import Session
from ..models.user import User
from fastapi import HTTPException, status
from datetime import date, datetime
from app.database import SessionLocal

# Set up logger
logger = logging.getLogger(__name__)


def handle_subscription_created(session):
    """Handle subscription creation event."""
    logger.info("Handling subscription created event")
    user_id = session["metadata"].get("user_id")
    logger.info(f"User ID from metadata: {user_id}")

    if not user_id:
        logger.error("No user_id found in metadata")
        return

    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.id == int(user_id)).first()
        if user:
            logger.info(f"Found user: {user.email}, current premium status: {user.is_premium}")
            user.is_premium = True
            user.remaining_shuffles = -1  # Unlimited
            db.commit()
            db.refresh(user)
            logger.info(f"Updated user premium status to: {user.is_premium}")
        else:
            logger.error(f"User with ID {user_id} not found in database")
    except Exception as e:
        logger.error(f"Error updating user premium status: {str(e)}")
        db.rollback()
    finally:
        db.close()


def handle_subscription_updated(subscription):
    """Handle subscription update event."""
    logger.info("Handling subscription updated event")
    user_id = subscription["metadata"].get("user_id")
    logger.info(f"User ID from metadata: {user_id}")
    status_value = subscription.get("status", "unknown")
    logger.info(f"Subscription status: {status_value}")

    if not user_id:
        logger.error("No user_id found in metadata")
        return

    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.id == int(user_id)).first()
        if user:
            logger.info(f"Found user: {user.email}, current premium status: {user.is_premium}")
            if status_value in ["active", "trialing"]:
                user.is_premium = True
                user.remaining_shuffles = -1
                logger.info("Setting user to premium (active/trialing subscription)")
            else:
                user.is_premium = False
                user.remaining_shuffles = 3  # Free tier default
                user.last_shuffle_reset = date.today()
                logger.info("Setting user to free tier (inactive subscription)")
            db.commit()
            db.refresh(user)
            logger.info(f"Updated user premium status to: {user.is_premium}")
        else:
            logger.error(f"User with ID {user_id} not found in database")
    except Exception as e:
        logger.error(f"Error updating user premium status: {str(e)}")
        db.rollback()
    finally:
        db.close()


def handle_subscription_deleted(subscription):
    """Handle subscription deletion event."""
    logger.info("Handling subscription deleted event")
    user_id = subscription["metadata"].get("user_id")
    logger.info(f"User ID from metadata: {user_id}")

    if not user_id:
        logger.error("No user_id found in metadata")
        return

    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.id == int(user_id)).first()
        if user:
            logger.info(f"Found user: {user.email}, current premium status: {user.is_premium}")
            user.is_premium = False
            user.remaining_shuffles = 3  # Free tier default
            user.last_shuffle_reset = date.today()
            db.commit()
            db.refresh(user)
            logger.info(f"Updated user premium status to: {user.is_premium}")
        else:
            logger.error(f"User with ID {user_id} not found in database")
    except Exception as e:
        logger.error(f"Error updating user premium status: {str(e)}")
        db.rollback()
    finally:
        db.close()


def upgrade_to_premium(db: Session, user: User) -> User:
    """Manually upgrade a user to premium (for testing or admin use)."""
    try:
        logger.info(f"Manually upgrading user {user.email} to premium")
        if user.is_premium:
            logger.warning(f"User {user.email} is already a premium subscriber")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a premium subscriber."
            )
        user.is_premium = True
        user.remaining_shuffles = -1
        db.commit()
        db.refresh(user)
        logger.info(f"Successfully upgraded user {user.email} to premium")
        return user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error upgrading user {user.email} to premium: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upgrade to premium"
        )


def downgrade_to_free(db: Session, user: User) -> User:
    """Manually downgrade a user to free tier."""
    try:
        logger.info(f"Manually downgrading user {user.email} to free")
        if not user.is_premium:
            logger.warning(f"User {user.email} is not a premium subscriber")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not a premium subscriber."
            )
        user.is_premium = False
        user.remaining_shuffles = 3  # Free tier default
        user.last_shuffle_reset = date.today()
        db.commit()
        db.refresh(user)
        logger.info(f"Successfully downgraded user {user.email} to free")
        return user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error downgrading user {user.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to downgrade to free tier"
        )


def check_premium_status(db: Session, user: User) -> bool:
    """Check if user has premium access."""
    return user.is_premium
