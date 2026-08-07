# backend/app/services/shuffle_service.py

from datetime import datetime, timedelta, timezone  # ✅ Added timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from ..models.user import User
from ..database import SessionLocal
import logging
from sqlalchemy import text


logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)


def check_and_reset_shuffles(user: User, db: Session) -> None:
    """
    Check if 12 hours have passed since last reset and reset shuffles if needed.
    This runs automatically before any shuffle operation.
    """
    if user.is_premium:
        return  # Premium users have unlimited shuffles

    now = datetime.now(timezone.utc)  # ✅ Timezone-aware UTC time

    # Initialize for brand new users
    if user.last_shuffle_reset is None:
        user.remaining_shuffles = 5
        user.last_shuffle_reset = now
        db.commit()
        db.refresh(user)
        logger.info(f"Initialized shuffles for new user {user.id}")
        return

    # Make last_shuffle_reset timezone-aware if it isn't
    last_reset = user.last_shuffle_reset
    if last_reset.tzinfo is None:
        last_reset = last_reset.replace(tzinfo=timezone.utc)

    # Calculate time since last reset
    time_since_reset = now - last_reset

    # Reset if 12 hours have passed
    if time_since_reset >= timedelta(hours=12):
        user.remaining_shuffles = 5
        user.last_shuffle_reset = now
        db.commit()
        db.refresh(user)
        logger.info(f"✅ Auto-reset shuffles for user {user.id} after {time_since_reset}")

        # 🎯 ADD NOTIFICATION HERE
        try:
            from .notification_service import create_shuffle_reset_notification
            create_shuffle_reset_notification(db, user, 5)
            logger.info(f"📧 Shuffle reset notification sent to user {user.id}")
        except Exception as e:
            logger.error(f"Failed to create shuffle reset notification: {e}")


def reset_all_shuffles():
    """
    Resets the remaining_shuffles for all non-premium users.
    This runs on a schedule (every 12 hours).
    """
    db = SessionLocal()
    try:
        logger.info("Starting scheduled reset of remaining_shuffles for all non-premium users.")

        non_premium_users = db.query(User).filter(User.is_premium == False).all()
        logger.debug(f"Found {len(non_premium_users)} non-premium users to reset shuffles.")

        now = datetime.now(timezone.utc)  # ✅ Timezone-aware UTC time

        for user in non_premium_users:
            # Make last_shuffle_reset timezone-aware if needed
            last_reset = user.last_shuffle_reset
            if last_reset and last_reset.tzinfo is None:
                last_reset = last_reset.replace(tzinfo=timezone.utc)

            # Only reset if 12 hours have passed
            if last_reset is None or (now - last_reset) >= timedelta(hours=12):
                user.remaining_shuffles = 5
                user.last_shuffle_reset = now
                db.add(user)
                logger.debug(f"Reset shuffles for user ID {user.id} to 5.")

        db.commit()
        logger.info("Successfully completed scheduled shuffle reset.")

    except Exception as e:
        db.rollback()
        logger.error(f"Error resetting shuffles: {e}")
        raise
    finally:
        db.close()


def get_remaining_shuffles(db: Session, user: User) -> dict:
    """
    Retrieves the number of remaining shuffles for a user.
    Auto-resets if 12 hours have passed.
    Returns dict with regular, bonus, and total shuffles.
    """
    # Auto-check and reset if needed
    check_and_reset_shuffles(user, db)

    if user.is_premium:
        return {
            "remaining_shuffles": "Unlimited",
            "bonus_shuffles": 0,
            "total_shuffles": "Unlimited"
        }

    regular = user.remaining_shuffles if user.remaining_shuffles is not None else 0
    bonus = user.bonus_shuffles if user.bonus_shuffles is not None else 0
    total = regular + bonus

    logger.info(f"🎲 Shuffle count for user {user.id}: {regular} regular + {bonus} bonus = {total} total")

    return {
        "remaining_shuffles": regular,
        "bonus_shuffles": bonus,
        "total_shuffles": total
    }


def upgrade_to_premium(db: Session, user: User) -> User:
    """
    Upgrades a user to premium status.
    """
    try:
        if user.is_premium:
            logger.warning(f"User '{user.username}' is already a premium subscriber.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a premium subscriber."
            )
        user.is_premium = True
        user.remaining_shuffles = -1  # -1 signifies unlimited
        db.commit()
        db.refresh(user)
        logger.info(f"User '{user.username}' upgraded to premium.")
        return user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error upgrading user '{user.username}' to premium: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upgrade to premium"
        )


def downgrade_to_free(db: Session, user: User) -> User:
    """
    Downgrades a user to free (non-premium) status.
    """
    try:
        if not user.is_premium:
            logger.warning(f"User '{user.username}' is not a premium subscriber.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not a premium subscriber."
            )
        user.is_premium = False
        user.remaining_shuffles = 5
        user.last_shuffle_reset = datetime.now(timezone.utc)  # ✅ Timezone-aware
        db.commit()
        db.refresh(user)
        logger.info(f"User '{user.username}' downgraded to free.")
        return user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error downgrading user '{user.username}' to free: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to downgrade to free tier"
        )


def check_premium_status(db: Session, user: User) -> bool:
    """
    Checks whether a user is a premium subscriber.
    """
    status = user.is_premium
    logger.debug(f"User '{user.username}' premium status: {status}")
    return status


def shuffle_matches(db: Session, user: User) -> list:
    """
    Shuffles the user's matches including guest content.
    Auto-resets shuffles if 12 hours have passed.
    Uses regular shuffles first, then bonus shuffles.
    """
    import random
    from ..models.content import Content

    logger.info(f"🎯 SHUFFLE START: User {user.id} ({user.username}) requesting shuffle")

    # ✅ Auto-check and reset if 12 hours have passed
    check_and_reset_shuffles(user, db)

    logger.info(f"🎯 SHUFFLE: Current shuffles - regular: {user.remaining_shuffles}, bonus: {user.bonus_shuffles}")

    try:
        # ALWAYS ensure premium users have unlimited shuffles
        if user.is_premium and user.remaining_shuffles != -1:
            user.remaining_shuffles = -1
            db.commit()
            db.refresh(user)
            logger.info(f"Reset premium user {user.id} to unlimited shuffles")

        # Initialize for new non-premium users
        if not user.is_premium and user.remaining_shuffles is None:
            user.remaining_shuffles = 5
            user.last_shuffle_reset = datetime.now(timezone.utc)  # ✅ Timezone-aware
            db.commit()
            db.refresh(user)

        # Check limits for non-premium users
        if not user.is_premium:
            total_available = (user.remaining_shuffles or 0) + (user.bonus_shuffles or 0)
            logger.info(f"🎯 SHUFFLE: Total available shuffles: {total_available}")

            if total_available <= 0:
                logger.warning(f"User ID {user.id} has no remaining shuffles or bonus shuffles.")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No remaining shuffles available. Wait for your next reset or upgrade to premium!"
                )

        # Get mixed regular + guest content
        try:
            logger.info(f"🎯 SHUFFLE: Calling match_content for user {user.id}")
            from .content_service import match_content
            matches = match_content(db, user, ranked_content=False, top_performers=False)

            logger.info(f"🎯 SHUFFLE: match_content returned {len(matches)} total matches")

            # Mark all as regular content
            for match in matches:
                match.is_guest = False
        except Exception as e:
            logger.error(f"❌ Error getting mixed content for shuffle: {e}")
            import traceback
            logger.error(f"❌ Full traceback: {traceback.format_exc()}")
            # Fallback to regular content only
            matches = db.query(Content).filter(
                Content.user_id != user.id,
                Content.status == "active"
            ).all()
            logger.warning(f"Fallback to regular content only: {len(matches)} matches")

        if not matches:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No matches found to shuffle."
            )

        random.shuffle(matches)

        # Deduct shuffles for non-premium users
# Deduct shuffles for non-premium users
        if not user.is_premium:
            # ✅ SOLUTION: Database-level atomic update with row locking
            if user.remaining_shuffles > 0:
                # Lock the row and update in single atomic operation
                affected = db.execute(
                    text("""
                        UPDATE users
                        SET remaining_shuffles = remaining_shuffles - 1
                        WHERE id = :user_id AND remaining_shuffles > 0
                    """),
                    {"user_id": user.id}
                ).rowcount

                if affected == 0:
                    # Another request already used the last shuffle
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="No remaining shuffles available."
                    )
                logger.info(f"🎯 Used 1 regular shuffle for user {user.id}")

            elif user.bonus_shuffles > 0:
                # Same atomic operation for bonus shuffles
                affected = db.execute(
                    text("""
                        UPDATE users
                        SET bonus_shuffles = bonus_shuffles - 1
                        WHERE id = :user_id AND bonus_shuffles > 0
                    """),
                    {"user_id": user.id}
                ).rowcount

                if affected == 0:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="No bonus shuffles available."
                    )
                logger.info(f"🎯 Used 1 bonus shuffle for user {user.id}")

            db.commit()
            db.refresh(user)

        logger.info(f"🎯 SHUFFLE COMPLETE: Returning {len(matches)} matches to user {user.id}")
        return matches

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error during shuffle for user {user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to shuffle matches"
        )
