# backend/app/api/webhooks.py

import stripe
import logging
from fastapi import APIRouter, Request, HTTPException
from app.config import settings
from app.services.subscription_service import handle_subscription_created, handle_subscription_updated, handle_subscription_deleted

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])

stripe.api_key = settings.STRIPE_SECRET_KEY

# Set up logger
logger = logging.getLogger(__name__)

@router.post("/stripe")
async def stripe_webhook(request: Request):
    logger.info("Received Stripe webhook request")
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    logger.info(f"Stripe signature header: {sig_header[:10]}..." if sig_header else "No signature header")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
        logger.info(f"Successfully verified Stripe webhook event: {event['type']}")
    except ValueError as e:
        logger.error(f"Invalid payload: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        logger.error(f"Unexpected error processing webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    # Handle the event
    event_type = event["type"]
    data_object = event["data"]["object"]
    logger.info(f"Processing event type: {event_type}")

    try:
        if event_type == "checkout.session.completed":
            logger.info(f"Checkout session completed. Session ID: {data_object.get('id')}")
            logger.info(f"Customer email: {data_object.get('customer_email')}")
            logger.info(f"Metadata: {data_object.get('metadata', {})}")
            handle_subscription_created(data_object)
            logger.info("Successfully processed checkout.session.completed")
        elif event_type == "customer.subscription.updated":
            logger.info(f"Subscription updated. Subscription ID: {data_object.get('id')}")
            handle_subscription_updated(data_object)
            logger.info("Successfully processed customer.subscription.updated")
        elif event_type == "customer.subscription.deleted":
            logger.info(f"Subscription deleted. Subscription ID: {data_object.get('id')}")
            handle_subscription_deleted(data_object)
            logger.info("Successfully processed customer.subscription.deleted")
        # ... handle other event types as needed
    except Exception as e:
        logger.error(f"Error handling event {event_type}: {str(e)}")
        # Note: We don't raise an exception here so Stripe doesn't retry
        # Instead, log the error and return success to avoid webhook retries

    return {"status": "success"}

@router.post("/stripe/test")
async def test_webhook():
    """
    Simple test endpoint to verify webhook routes are accessible.
    """
    logger.info("Test webhook endpoint hit successfully")
    return {"status": "success", "message": "Webhook test endpoint is working"}
