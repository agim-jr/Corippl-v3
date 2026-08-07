# backend/app/utils/scheduler.py

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
import logging

from ..database import SessionLocal

logger = logging.getLogger(__name__)


def execute_scheduled_autopilot():
    """
    Execute autopilot shares for all users with autopilot enabled.
    This runs on a schedule.
    """
    db: Session = SessionLocal()
    try:
        logger.info("🤖 Running scheduled autopilot execution...")

        # Import here to avoid circular imports
        from ..models.user import User
        from ..services.autopilot_service import AutopilotService

        # Create service with db session
        autopilot_service = AutopilotService(db)

        # Get all users with autopilot enabled
        autopilot_users = db.query(User).filter(
            User.autopilot_enabled == True
        ).all()

        total_shares = 0
        for user in autopilot_users:
            try:
                # Use the service instance (no db parameter)
                result = autopilot_service.execute_autopilot_shares(
                    user_id=user.id,
                    max_shares=10
                )

                if result.get("success"):
                    shares_completed = result.get("shares_completed", 0)
                    total_shares += shares_completed
                    if shares_completed > 0:
                        logger.info(f"✅ User {user.id}: {shares_completed} shares completed")

            except Exception as e:
                logger.error(f"❌ Error processing autopilot for user {user.id}: {e}")
                continue

        logger.info(f"🤖 Scheduled autopilot complete. Total shares: {total_shares}")

    except Exception as e:
        logger.error(f"❌ Scheduled autopilot execution failed: {e}")
    finally:
        db.close()


def start_scheduler():
    """
    Initialize and start the APScheduler.
    """
    scheduler = AsyncIOScheduler()

    # Schedule autopilot to run every hour
    scheduler.add_job(
        execute_scheduled_autopilot,
        trigger=CronTrigger(minute=0),  # Run at the top of every hour
        id="autopilot_hourly",
        name="Execute Autopilot Shares",
        replace_existing=True
    )

    scheduler.start()
    logger.info("✅ Scheduler started - Autopilot will run every hour")

    return scheduler
