# backend/app/api/contacts.py

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import csv
import io
import json
import logging

from ..database import get_db
from ..models.schemas import ContactCreate, ContactResponse, ContactListResponse
from ..models.contact import Contact
from ..utils.dependencies import get_current_user
from ..models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/contacts",
    tags=["Contacts"],
    dependencies=[Depends(get_current_user)]
)


@router.post("/", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def create_contact(
    contact: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a new contact"""
    # Check for duplicate email
    existing = db.query(Contact).filter(
        Contact.user_id == current_user.id,
        Contact.email == contact.email
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contact with this email already exists"
        )

    db_contact = Contact(
        name=contact.name,
        email=contact.email,
        user_id=current_user.id
    )

    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)

    logger.info(f"Contact created: {db_contact.name} ({db_contact.email}) for user {current_user.id}")
    return db_contact


@router.post("/bulk", response_model=List[ContactResponse], status_code=status.HTTP_201_CREATED)
def bulk_upload_contacts(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Bulk upload contacts from CSV or JSON file.
    Premium/AI feature only.

    CSV format: name,email
    JSON format: [{"name": "...", "email": "..."}, ...]
    """
    # Check Premium/AI access
    if current_user.subscription_tier not in ["premium", "ai"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bulk upload requires Premium or AI subscription"
        )

    if not file.filename.endswith(('.csv', '.json')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be CSV or JSON format"
        )

    contacts_to_create = []

    try:
        if file.filename.endswith('.csv'):
            content = file.file.read().decode('utf-8')
            reader = csv.DictReader(io.StringIO(content))

            for row in reader:
                if 'name' in row and 'email' in row:
                    contacts_to_create.append({
                        'name': row['name'].strip(),
                        'email': row['email'].strip()
                    })

        elif file.filename.endswith('.json'):
            content = file.file.read().decode('utf-8')
            data = json.loads(content)

            if not isinstance(data, list):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="JSON must be an array of contacts"
                )

            contacts_to_create = [
                {'name': item['name'].strip(), 'email': item['email'].strip()}
                for item in data
                if 'name' in item and 'email' in item
            ]

    except Exception as e:
        logger.error(f"Error parsing upload file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file format: {str(e)}"
        )

    if not contacts_to_create:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid contacts found in file"
        )

    # Create contacts, skip duplicates
    created_contacts = []
    skipped_duplicates = 0

    for contact_data in contacts_to_create:
        existing = db.query(Contact).filter(
            Contact.user_id == current_user.id,
            Contact.email == contact_data['email']
        ).first()

        if existing:
            skipped_duplicates += 1
            continue

        db_contact = Contact(
            name=contact_data['name'],
            email=contact_data['email'],
            user_id=current_user.id
        )

        db.add(db_contact)
        created_contacts.append(db_contact)

    db.commit()

    for contact in created_contacts:
        db.refresh(contact)

    logger.info(
        f"Bulk upload: {len(created_contacts)} contacts created, "
        f"{skipped_duplicates} duplicates skipped for user {current_user.id}"
    )

    return created_contacts


@router.get("/", response_model=ContactListResponse)
def get_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all contacts for current user"""
    contacts = db.query(Contact).filter(
        Contact.user_id == current_user.id
    ).order_by(Contact.created_at.desc()).all()

    return {"contacts": contacts}


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a contact"""
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.user_id == current_user.id
    ).first()

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )

    db.delete(contact)
    db.commit()

    logger.info(f"Contact deleted: ID {contact_id} by user {current_user.id}")
    return
