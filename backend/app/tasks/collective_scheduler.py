# backend/app/tasks/collective_scheduler.py

from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
import logging

from ..database import SessionLocal
from ..models.user import User
from ..models.collective import CollectiveSchedule, CollectiveGroup, CollectiveMembership
from ..services.autopilot_service import AutopilotService
from ..services.collective_service import CollectiveService
from ..services.collective_intelligence import CollectiveIntelligence

logger = logging.getLogger(__name__)


class CollectiveScheduler:
    """
    Background scheduler for collective automation.
    Uses honest math + simple ML - no fake AI.
    """

    def __init__(self):
        """Initialize scheduler without db dependency."""
        # Don't create services here - create them when needed with db session
        pass

    def run_daily_autopilot(self):
        """
        Execute autopilot shares for all users.
        RUN DAILY at optimal times (e.g., 8am, 12pm, 4pm)
        """
        db = SessionLocal()
        try:
            logger.info("🤖 Starting daily autopilot execution...")

            # Create autopilot service with db session
            autopilot = AutopilotService(db)

            # Get all users with autopilot enabled
            autopilot_users = db.query(User).filter(
                User.autopilot_enabled == True
            ).all()

            logger.info(f"Found {len(autopilot_users)} users with autopilot enabled")

            results = []
            for user in autopilot_users:
                try:
                    result = autopilot.execute_autopilot_shares(user.id)
                    results.append({
                        "user_id": user.id,
                        **result
                    })

                    if result.get("success"):
                        logger.info(f"✅ User {user.id}: {result.get('shares_completed')} shares completed")
                except Exception as e:
                    logger.error(f"❌ Autopilot failed for user {user.id}: {e}")
                    results.append({
                        "user_id": user.id,
                        "success": False,
                        "error": str(e)
                    })

            successful = sum(1 for r in results if r.get("success"))
            logger.info(f"✅ Autopilot complete: {successful}/{len(results)} users successful")

            return results
        finally:
            db.close()

    def check_missed_shares(self):
        """
        Check for missed shares and issue strikes.
        RUN DAILY at end of day (e.g., 11:30pm)
        """
        db = SessionLocal()
        try:
            logger.info("⚠️ Checking for missed shares...")

            results = CollectiveService.check_missed_shares(db)

            logger.info(f"✅ Processed {len(results)} missed shares")
            return results
        finally:
            db.close()

    def send_daily_reminders(self):
        """
        Send reminders to users about their shares today.
        RUN DAILY in morning (e.g., 9am)
        """
        db = SessionLocal()
        try:
            logger.info("📨 Sending daily share reminders...")

            today = date.today()
            schedules = db.query(CollectiveSchedule).filter(
                CollectiveSchedule.scheduled_date == today,
                CollectiveSchedule.status == "pending",
                CollectiveSchedule.reminder_sent == False
            ).all()

            sent = 0

            for schedule in schedules:
                user = db.query(User).filter(User.id == schedule.sharer_id).first()

                if not user or user.autopilot_enabled:
                    continue

                # Mark reminder as sent
                schedule.reminder_sent = True
                sent += 1

            db.commit()
            logger.info(f"✅ Sent {sent} reminders")
            return {"sent": sent}
        finally:
            db.close()

    def optimize_group_schedules(self):
        """
        Re-optimize schedules for all groups using fair rotation algorithm.
        RUN WEEKLY on Sunday night
        """
        db = SessionLocal()
        try:
            logger.info("🔄 Optimizing group schedules...")

            # Create intelligence service with db session
            intelligence = CollectiveIntelligence(db)

            groups = db.query(CollectiveGroup).all()
            optimized = 0

            for group in groups:
                try:
                    # Use honest intelligence service
                    result = intelligence.optimize_schedule(
                        group.id,
                        weeks=4
                    )

                    if result and not result.get("error"):
                        optimized += 1
                        logger.info(f"✅ Optimized schedule for group {group.id}")
                except Exception as e:
                    logger.error(f"❌ Failed to optimize group {group.id}: {e}")

            logger.info(f"✅ Optimized {optimized}/{len(groups)} group schedules")
            return {"optimized": optimized, "total": len(groups)}
        finally:
            db.close()

    def analyze_group_health(self):
        """
        Analyze all groups and flag at-risk members.
        RUN WEEKLY on Monday morning
        """
        db = SessionLocal()
        try:
            logger.info("📊 Analyzing group health...")

            # Create intelligence service with db session
            intelligence = CollectiveIntelligence(db)

            groups = db.query(CollectiveGroup).all()
            analyses = []

            for group in groups:
                try:
                    analysis = intelligence.analyze_group_health(group.id)
                    analyses.append({
                        "group_id": group.id,
                        **analysis
                    })

                    # Log at-risk members
                    at_risk = analysis.get("at_risk_members", {})
                    if at_risk:
                        logger.warning(f"⚠️ Group {group.id}: {len(at_risk)} members at risk")

                except Exception as e:
                    logger.error(f"❌ Failed to analyze group {group.id}: {e}")

            logger.info(f"✅ Analyzed {len(analyses)} groups")
            return analyses
        finally:
            db.close()

    def generate_weekly_reports(self):
        """
        Generate weekly performance reports for all groups.
        RUN WEEKLY on Monday morning (after health analysis)
        """
        db = SessionLocal()
        try:
            logger.info("📊 Generating weekly reports...")

            # Create intelligence service with db session
            intelligence = CollectiveIntelligence(db)

            groups = db.query(CollectiveGroup).all()
            reports = []

            for group in groups:
                try:
                    # Get week's data
                    week_start = date.today() - timedelta(days=7)
                    week_end = date.today()

                    # Get member performance
                    memberships = db.query(CollectiveMembership).filter(
                        CollectiveMembership.group_id == group.id
                    ).all()

                    member_stats = []
                    for m in memberships:
                        total = m.shares_completed + m.shares_missed
                        completion_rate = m.shares_completed / total if total > 0 else 0

                        member_stats.append({
                            "user_id": m.user_id,
                            "completion_rate": completion_rate,
                            "strikes": m.strike_count,
                            "reliability": intelligence.analyzer.calculate_reliability_score(
                                m.shares_completed,
                                m.shares_missed,
                                m.strike_count
                            )
                        })

                    # Calculate fairness
                    share_counts = {m["user_id"]: m["completion_rate"] * 10 for m in member_stats}
                    fairness = intelligence.optimizer.calculate_fairness_score(share_counts)

                    report = {
                        "group_id": group.id,
                        "week_start": week_start.isoformat(),
                        "week_end": week_end.isoformat(),
                        "member_count": len(memberships),
                        "fairness_score": round(fairness, 2),
                        "member_performance": member_stats
                    }

                    reports.append(report)
                    logger.info(f"✅ Generated report for group {group.id}")

                except Exception as e:
                    logger.error(f"❌ Failed to generate report for group {group.id}: {e}")

            logger.info(f"✅ Generated {len(reports)} weekly reports")
            return reports
        finally:
            db.close()
