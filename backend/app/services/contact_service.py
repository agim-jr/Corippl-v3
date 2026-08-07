from sqlalchemy.orm import Session
from sqlalchemy import func  # For aggregation functions like sum
from typing import List
import logging                # For logger
from ..models.schemas import ContactCreate
from ..models.contact import Contact
from ..models.conversion import Conversion
from ..models.content import Content   # <-- Make sure your Content model is here
from ..models.user import User        # <-- Make sure your User model is here

logger = logging.getLogger(__name__)  # Define logger if not already defined

def compute_contact_quality(db: Session, user_id: int, contact: Contact, user: User = None) -> float:
    """
    Compute quality score based on user tier:
    - Free users: Return existing manual score (don't auto-calculate)
    - Premium users: Calculate based on reciprocal sharing only
    """
    try:
        # Get user if not provided
        if user is None:
            user = db.query(User).filter(User.id == user_id).first()

        # Free users: preserve manual ratings
        if not user or not user.is_premium:
            # Return existing score, default to 50 if never rated
            return contact.quality_score if contact.quality_score > 0 else 50.0

        # Premium users: calculate based on reciprocal sharing ONLY
        # Count how many times this contact has shared the user's content
        reciprocated_shares = db.query(func.count(Content.id)).filter(
            Content.user_id == user_id,
            Content.shared_by == contact.id  # Assuming you track who shared
        ).scalar() or 0

        # Simple scoring: each reciprocal share = 10 points (max 100)
        score = min(reciprocated_shares * 10, 100)

        # If no shares yet, keep at default 50
        if score == 0:
            score = 50

        return float(score)

    except Exception as e:
        logger.error(f"Error computing quality score for contact ID {contact.id}: {e}")
        return contact.quality_score if contact.quality_score > 0 else 50.0


def update_contact_quality_scores(db: Session):
    """
    Update the quality scores for all contacts of all users.
    """
    try:
        users = db.query(User).all()
        for user in users:
            contacts = db.query(Contact).filter(Contact.user_id == user.id).all()
            for contact in contacts:
                score = compute_contact_quality(db, user.id, contact)
                contact.quality_score = score
        db.commit()
        logger.info("Successfully updated contact quality scores.")
    except Exception as e:
        logger.error(f"Error updating contact quality scores: {e}")
        db.rollback()

def create_contact(db: Session, contact: ContactCreate, user_id: int) -> Contact:
    db_contact = Contact(
        name=contact.name,
        email=contact.email,
        user_id=user_id
    )
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

def bulk_create_contacts(db: Session, contacts: List[ContactCreate], user_id: int) -> List[Contact]:
    db_contacts = [
        Contact(name=contact.name, email=contact.email, user_id=user_id)
        for contact in contacts
    ]
    db.bulk_save_objects(db_contacts)
    db.commit()
    for contact in db_contacts:
        db.refresh(contact)
    return db_contacts

def get_contacts_by_user(db: Session, user_id: int) -> List[Contact]:
    return db.query(Contact).filter(Contact.user_id == user_id).all()

def delete_contact(db: Session, contact_id: int, user_id: int) -> bool:
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.user_id == user_id).first()
    if contact:
        db.delete(contact)
        db.commit()
        return True
    return False
