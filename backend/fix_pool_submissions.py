# backend/fix_pool_submissions.py
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.pool_submission import PoolSubmission
from app.models.content import Content, ContentTypeEnum
from datetime import datetime

def fix_approved_submissions():
    db = SessionLocal()

    try:
        print("🔧 Fixing approved pool submissions without content_id...")

        # Get all approved submissions without content_id
        submissions = db.query(PoolSubmission).filter(
            PoolSubmission.status == "approved",
            PoolSubmission.content_id.is_(None)
        ).all()

        print(f"Found {len(submissions)} submissions to fix\n")

        for submission in submissions:
            # Create Content entry
            content = Content(
                title=submission.title,
                description=submission.pitch or "Submitted via Pool",
                url=submission.original_url,
                content_type=ContentTypeEnum.link,
                categories=[submission.category],
                user_id=submission.user_id,
                status="active",  # Makes it visible in matches
                share_count=0,
                required_shares=10,
                created_at=submission.created_at
            )
            db.add(content)
            db.flush()  # Get the ID without committing

            # Link to pool submission
            submission.content_id = content.id
            if not submission.approved_at:
                submission.approved_at = datetime.utcnow()

            print(f"  ✅ Fixed: '{submission.title}' -> Content ID {content.id}")

        db.commit()
        print(f"\n🎉 Successfully fixed {len(submissions)} submissions!")
        print("These submissions are now visible in /match endpoints")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    fix_approved_submissions()
