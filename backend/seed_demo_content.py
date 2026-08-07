# -*- coding: utf-8 -*-
# backend/seed_demo_content.py

import json
import logging
from pathlib import Path
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.user import User
from app.models.profile import Profile
from app.models.content import Content, ContentTypeEnum
from passlib.context import CryptContext

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Paths to JSON files
DATA_DIR = Path(__file__).parent / "data"
USERS_FILE = DATA_DIR / "demo_users.json"
CONTENT_FILE = DATA_DIR / "demo_content.json"


def load_json(file_path: Path):
    """Load JSON data from file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        logger.error(f"File not found: {file_path}")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing JSON from {file_path}: {e}")
        return None


def create_demo_users(db: Session, users_data: dict):
    """Create demo user accounts with profiles"""
    created_users = {}
    
    for user_data in users_data.get("demo_users", []):
        try:
            # Check if user already exists
            existing_user = db.query(User).filter(
                User.username == user_data["username"]
            ).first()
            
            if existing_user:
                logger.warning(f"Demo user '{user_data['username']}' already exists, skipping...")
                created_users[user_data["username"]] = existing_user
                continue
            
            # Create user
            hashed_password = pwd_context.hash(user_data["password"])
            new_user = User(
                username=user_data["username"],
                email=user_data["email"],
                password=hashed_password,
                has_profile_completed=True,
                email_verified=True,
            )
            
            db.add(new_user)
            db.flush()
            
            # Create profile
            profile_data = user_data["profile"]
            new_profile = Profile(
                user_id=new_user.id,
                name=profile_data["name"],
                bio=profile_data["bio"],
                categories=profile_data["categories"],
                interests=profile_data["interests"]
            )
            
            db.add(new_profile)
            db.commit()
            
            created_users[user_data["username"]] = new_user
            logger.info(f"Created demo user: {user_data['username']}")
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating demo user '{user_data['username']}': {e}")
    
    return created_users


def create_demo_content(db: Session, content_data: dict, users_map: dict):
    """Create demo content for each user"""
    content_count = 0
    
    for content_item in content_data.get("demo_content", []):
        try:
            creator_username = content_item["creator_username"]
            
            user = users_map.get(creator_username)
            if not user:
                logger.warning(f"User '{creator_username}' not found, skipping content...")
                continue
            
            existing_content = db.query(Content).filter(
                Content.user_id == user.id,
                Content.title == content_item["title"]
            ).first()
            
            if existing_content:
                logger.warning(f"Content '{content_item['title']}' already exists, skipping...")
                continue
            
            new_content = Content(
                user_id=user.id,
                title=content_item["title"],
                description=content_item["description"],
                url=content_item["url"],
                content_type=ContentTypeEnum[content_item["content_type"]],
                categories=content_item["categories"],
                status="approved",
                share_count=0,
                required_shares=5
            )
            
            db.add(new_content)
            content_count += 1
            
            logger.info(f"Created content: '{content_item['title']}' for {creator_username}")
            
        except Exception as e:
            logger.error(f"Error creating content '{content_item.get('title', 'Unknown')}': {e}")
    
    try:
        db.commit()
        logger.info(f"Successfully created {content_count} demo content pieces")
    except Exception as e:
        db.rollback()
        logger.error(f"Error committing demo content: {e}")


def seed_demo_data():
    """Main function to seed all demo data"""
    logger.info("Starting demo data seeding...")
    
    users_data = load_json(USERS_FILE)
    content_data = load_json(CONTENT_FILE)
    
    if not users_data or not content_data:
        logger.error("Failed to load required data files")
        return
    
    db = SessionLocal()
    
    try:
        logger.info("Creating demo users...")
        users_map = create_demo_users(db, users_data)
        
        logger.info("Creating demo content...")
        create_demo_content(db, content_data, users_map)
        
        logger.info("Demo data seeding completed successfully!")
        
    except Exception as e:
        logger.error(f"Fatal error during seeding: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
