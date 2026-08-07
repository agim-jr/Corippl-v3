from fastapi import APIRouter, Request, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.config import settings
import logging
from app.database import get_db
from app.models.waitlist import WaitlistUser
from app.utils.email import send_email, EmailSchema


router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])

# Initialize logger
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

@router.post("/mailchimp")
async def mailchimp_webhook(request: Request, secret: str, db: Session = Depends(get_db)):
    """
    Endpoint to receive MailChimp webhook events.
    """
    if secret != settings.MAILCHIMP_WEBHOOK_SECRET:
        logger.warning("Invalid MailChimp webhook secret.")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid secret.")

    try:
        payload = await request.json()
        event_type = payload.get("type")
        data = payload.get("data", {})
        email = data.get("email")

        logger.info(f"Received MailChimp event: {event_type} for {email}")

        # Handle specific event types
        if event_type == "subscribe":
            # User confirmed their subscription via double opt-in
            logger.info(f"User {email} confirmed subscription to MailChimp.")

            # Update the user's confirmation status in the database
            user = db.query(WaitlistUser).filter(WaitlistUser.email == email).first()
            if user:
                user.email_confirmed = True
                db.commit()

                # Send a welcome email now that they're confirmed
                welcome_email = EmailSchema(
                    email=[email],
                    subject="Welcome to our waitlist!",
                    body=f"""
                    <p>Thank you for confirming your email!</p>
                    <p>Your position in the waitlist is #{user.position}.</p>
                    <p>You can improve your position by referring friends using your unique link.</p>
                    <p>Your referral code is: {user.referral_code}</p>
                    """
                )
                await send_email(welcome_email)

        elif event_type == "unsubscribe":
            # User unsubscribed from the list
            logger.info(f"User {email} unsubscribed from MailChimp.")

            # You may want to mark the user as inactive or remove them
            user = db.query(WaitlistUser).filter(WaitlistUser.email == email).first()
            if user:
                # Option 1: Mark as inactive
                user.email_confirmed = False
                # Option 2: Remove from waitlist
                # db.delete(user)
                db.commit()

        elif event_type == "cleaned":
            # Email was cleaned from the list (hard bounce, etc.)
            logger.info(f"Email {email} was cleaned from MailChimp list.")

            # Remove from waitlist or mark as invalid
            user = db.query(WaitlistUser).filter(WaitlistUser.email == email).first()
            if user:
                db.delete(user)
                db.commit()

        elif event_type == "profile":
            action = data.get("action")
            if action == "update":
                logger.info(f"User {email} updated their MailChimp profile.")
                # Sync profile changes if needed
        else:
            logger.info(f"Ignoring unsupported event type: {event_type}")

    except Exception as e:
        logger.error(f"Error processing MailChimp webhook: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Webhook processing failed.")

    return {"status": "success"}
