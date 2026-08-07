# -*- coding: utf-8 -*-
# backend/clear_demo_data.py

import logging
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.models.profile import Profile
from app.models.content import Content

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

DEMO_USERNAMES = [
    "demo_tech_curator",
    "demo_startup_stories",
    "demo_design_resources",
    "demo_marketing_guru",
    "demo_productivity_pro",
    "demo_content_creator",
    "demo_ai_ml_resources"
]


def clear_demo_data():
    """Remove all demo users and their associated data"""
    db = SessionLocal()
    
    try:
        deleted_count = 0
        
        for username in DEMO_USERNAMES:
            user = db.query(User).filter(User.username == username).first()
            
            if user:
                content_count = db.query(Content).filter(Content.user_id == user.id).count()
                db.query(Content).filter(Content.user_id == user.id).delete()
                db.query(Profile).filter(Profile.user_id == user.id).delete()
                db.delete(user)
                deleted_count += 1
                
                logger.info(f"Deleted demo user '{username}' and {content_count} content pieces")
        
        db.commit()
        logger.info(f"Cleared {deleted_count} demo accounts")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error clearing demo data: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    clear_demo_data()
