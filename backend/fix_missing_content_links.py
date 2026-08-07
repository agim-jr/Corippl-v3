import sys
sys.path.append('.')

from app.database import SessionLocal
from app.models.pool_submission import PoolSubmission
from app.models.content import Content, ContentTypeEnum
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_missing_links():
    """Fix all pool submissions missing content_id"""
    db = SessionLocal()

    try:
        # Find submissions without content_id
        broken_submissions = db.query(PoolSubmission).filter(
            PoolSubmission.content_id == None
        ).all()

        if not broken_submissions:
            logger.info("✅ No broken submissions found")
            return

        logger.info(f"🔧 Found {len(broken_submissions)} submissions without content_id")

        fixed_count = 0
        for submission in broken_submissions:
            # Create missing content
            content = Content(
                user_id=submission.user_id,
                title=submission.title,
                description=submission.pitch or "Content from pool submission",
                url=submission.original_url,
                content_type=ContentTypeEnum.link,
                categories=[submission.category],
                status=submission.status,  # Match submission status
                created_at=submission.created_at,
                share_count=0,
                required_shares=10,
                pool_review_count=submission.review_count or 0,
                pool_average_rating=submission.average_rating or 0.0
            )
            db.add(content)
            db.flush()

            # Link them
            submission.content_id = content.id

            # If submission is approved, make content active
            if submission.status == "approved":
                content.status = "active"
                if not submission.approved_at:
                    submission.approved_at = datetime.utcnow()

            fixed_count += 1
            logger.info(
                f"✅ Fixed submission {submission.id}: "
                f"created content {content.id} (status={content.status})"
            )

        db.commit()
        logger.info(f"🎉 Fixed {fixed_count} submissions")

    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    fix_missing_links()
