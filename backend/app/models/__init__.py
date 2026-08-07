# backend/app/models/__init__.py

from .base import Base

from .pool_submission import PoolSubmission
from .pool_review import PoolReview

from .user import User
from .profile import Profile
from .content import Content, Share
from .conversion import Conversion
from .audience import Audience
from .notification import Notification
from .contact import Contact
from .flag import Flag
from .analytics import UserAnalytics
from .preference import Preference
from .engagement import ContactEngagement
from .share import ShareMapping  # ✅ ADD THIS LINE
from .quick_connect import QuickConnectRequest, QuickConnectHelp, QuickConnectToken
from .message import Message
from .follow import Follow



__all__ = [
    "Base",
    "PoolReview",      # ✅ ADDED
    "PoolSubmission",  # ✅ ADDED
    "User",
    "Profile",
    "Content",
    "Share",
    "Conversion",
    "Audience",
    "Notification",
    "Contact",
    "Flag",
    "UserAnalytics",
    "Link",
    "Preference",
    "ContactEngagement",
    "ShareMapping",
    "QuickConnectRequest",
    "QuickConnectHelp",
    "QuickConnectToken",
    "Message",
    "Follow"
]
