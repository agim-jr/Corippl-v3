# backend/app/api/__init__.py

import logging

logger = logging.getLogger(__name__)


from fastapi import APIRouter
from .auth import router as auth_router
from .profiles import router as profiles_router
from .content import router as content_router
from .notifications import router as notifications_router
from .contacts import router as contacts_router
from .analytics import router as analytics_router
from .flag_routes import router as flags_router  # Updated import
from .admin_content_routes import router as admin_content_router  # Import the new admin router
from .user_routes import router as user_router
from .search import router as search_router  # Import the search router
from app.api.conversions import router as conversions_router  # New Router
from app.api.audience import router as audience_router
from .subscription_routes import router as subscription_router  # Import subscription router
from .webhooks import router as webhook_router  # Import webhook router
from .test_email import router as test_email_router  # Corrected import path
from .preferences import router as preferences_router  # Add this line
# from .google_auth import router as google_auth_router
from .media_routes import router as media_router  # ADD THIS LINE
from .feedback_routes import router as feedback_router  # Add this import
from .share import router as share_router  # ✅ ADD THIS
from .pool_routes import router as pool_router  # ✅ ADD THIS LINE
from .quick_connect_routes import router as quick_connect_router
from .collective_routes import router as collective_router
from .collective_intelligence_routes import router as collective_intelligence_router
from .admin_routes import router as admin_router
from .autopilot_routes import router as autopilot_router, api_router as autopilot_api_router  # ✅ UPDATED


# ✅ Import onboarding router with error handling
try:
    from .onboarding import router as onboarding_router
    logger.info("✅ Successfully imported onboarding router")
    logger.info(f"Onboarding router prefix: {onboarding_router.prefix}")
    logger.info(f"Onboarding router routes: {len(onboarding_router.routes)}")
except Exception as e:
    logger.error(f"❌ Failed to import onboarding router: {e}")
    import traceback
    traceback.print_exc()
    onboarding_router = None



api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(profiles_router)
api_router.include_router(content_router)
api_router.include_router(notifications_router)
api_router.include_router(contacts_router)
api_router.include_router(analytics_router)
api_router.include_router(flags_router)  # Include the Flag routes
api_router.include_router(admin_content_router)  # Include the admin content routes
api_router.include_router(user_router)
api_router.include_router(search_router)  # Include the search router
# Including New Routers
api_router.include_router(conversions_router)
api_router.include_router(audience_router)
api_router.include_router(subscription_router)  # Include subscription routes
api_router.include_router(webhook_router)  # Include webhook routes
api_router.include_router(test_email_router)  # Include the Test Email router here
api_router.include_router(preferences_router)  # Add this line
# api_router.include_router(google_auth_router)
api_router.include_router(media_router)  # ADD THIS LINE
api_router.include_router(feedback_router)  # Add this line
api_router.include_router(share_router)  # ✅ ADD THIS LINE
api_router.include_router(pool_router)  # ✅ ADD THIS LINE
api_router.include_router(quick_connect_router)
api_router.include_router(collective_router)
api_router.include_router(collective_intelligence_router)  # ✅ Honest intelligence
api_router.include_router(admin_router)
api_router.include_router(autopilot_router)
api_router.include_router(autopilot_api_router)  # ✅ ADD THIS LINE - Alternative API path



# ✅ Include onboarding router if it loaded successfully
if onboarding_router:
    api_router.include_router(onboarding_router)  # ✅ NO PREFIX HERE
    logger.info("✅ Onboarding router included in API router")
else:
    logger.error("❌ Onboarding router was not included (import failed)")

# ✅ Log all registered routes
logger.info(f"📋 Total routes in api_router: {len(api_router.routes)}")
for route in api_router.routes:
    logger.info(f"  {route.path} [{', '.join(route.methods)}]")
