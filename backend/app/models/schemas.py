# backend/app/models/schemas.py

from enum import Enum
from pydantic import BaseModel, EmailStr, Field, HttpUrl, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from ..models.content import ContentTypeEnum  # Import from models.content.py
import re


# Remove duplicate ContentTypeEnum definition



class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, example="john_doe")
    email: EmailStr = Field(..., example="john@example.com")
    password: str = Field(..., min_length=6, example="strongpassword")

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_admin: bool = False  # Added line
    is_active: bool = True
    has_profile_completed: bool = False  # Added line
    is_premium: bool = False  # <-- Added field
    autopilot_enabled: bool = False  # Add this line too for completeness
    autopilot_settings: Optional[dict] = None  # Add this line for completeness
    share_count: int = Field(default=0, example=3)  # ✅ ADD THIS LINE

    interests: Optional[List[str]] = Field(default=[], example=["python", "fastapi", "machine-learning"])
    skills: Optional[List[str]] = Field(default=[], example=["python", "backend", "database"])


    class Config:
        from_attributes = True

# backend/app/models/schemas.py - Add after UserResponse

class GoogleLoginRequest(BaseModel):
    token: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

    class Config:
        from_attributes = True

class TokenData(BaseModel):
    username: Optional[str] = None

    class Config:
        from_attributes = True

# NEW: Add these Google OAuth schemas
class GoogleAuthRequest(BaseModel):
    token: str  # The Google ID token from frontend

class GoogleAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# New Profile Schemas
class ProfileCreate(BaseModel):
    name: str = Field(..., max_length=100, example="John Doe")
    bio: Optional[str] = Field(None, max_length=500, example="This is my bio.")
    categories: List[str] = Field(..., example=["Technology", "Science"])
    interests: List[str] = Field(..., example=["AI", "Blockchain"])


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    name: str
    bio: Optional[str]
    categories: List[str]
    interests: List[str]
    content_type: Optional[str] = None  # ← ADD THIS LINE
    social_links: Optional[dict] = {}
    created_at: datetime
    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    categories: Optional[List[str]] = []
    interests: Optional[List[str]] = []
    content_type: Optional[ContentTypeEnum] = Field(None, max_length=100)  # Use imported Enum
    social_links: Optional[dict] = {}

    class Config:
        from_attributes = True

class ContentBase(BaseModel):
    title: str = Field(..., example="Understanding AI")
    description: Optional[str] = Field(None, example="An in-depth look into artificial intelligence.")
    url: HttpUrl = Field(..., example="https://example.com/ai-blog")
    media_url: Optional[str] = Field(None, example="https://echo-project-media.s3.amazonaws.com/file.jpg")  # 🔥 NEW
    content_type: ContentTypeEnum = Field(..., example="article")  # Updated to Enum with lowercase example
    required_shares: Optional[int] = Field(5, example=5)  # New field with default value

class ContentCreate(ContentBase):
    class Config:
        from_attributes = True


class LinkResponse(BaseModel):
    id: int
    content_id: int
    short_code: str
    created_at: datetime
    click_count: int
    click_timestamps: Optional[List[str]] = []  # ← Add this

    class Config:
        from_attributes = True

class ContentResponse(ContentBase):
    id: int
    user_id: int
    created_at: datetime
    status: str = Field(..., example="pending")
    share_count: int = Field(default=0, example=5)
    required_shares: int = Field(default=5, example=5)
    auto_share: bool = Field(default=False, example=False)  # ✅ ADD THIS LINE
    categories: List[str]  # Added line for categories
    user: UserResponse  # Changed from createdBy with alias
    view_count: int
    short_link_clicks: int = Field(default=0, example=100)  # Added field
    conversions_count: int = Field(default=0, example=0)  # Added field

    # ✅ ADD THESE TWO LINES:
    is_guest: bool = Field(default=False, example=False)
    guest_creator_name: Optional[str] = Field(default=None, example="Guest Creator")

     # ✅ ADD THIS LINE:
    links: List[LinkResponse] = Field(default=[], example=[])
    media_url: Optional[str] = Field(None, example="https://echo-project-media.s3.amazonaws.com/file.jpg")  # 🔥 NEW

    class Config:
        from_attributes = True


    class Config:
        from_attributes = True

class ContentUpdate(BaseModel):
    title: Optional[str] = Field(None, example="Understanding AI")
    description: Optional[str] = Field(None, example="An in-depth look into artificial intelligence.")
    url: Optional[HttpUrl] = Field(None, example="https://example.com/ai-blog")
    media_url: Optional[str] = Field(None, example="https://echo-project-media.s3.amazonaws.com/file.jpg")  # 🔥 NEW
    content_type: Optional[ContentTypeEnum] = Field(None, example="article")  # Use lowercase example
    required_shares: Optional[int] = Field(None, example=5)
    status: Optional[str] = Field(None, example="active")  # ADD THIS LINE
    auto_share: Optional[bool] = Field(None, example=True)  # ✅ ADD THIS LINE


    class Config:
        from_attributes = True

class FlagCreate(BaseModel):
    content_id: int = Field(..., example=1)  # Assuming flags are associated with content
    reason: str = Field(..., example="Inappropriate content")

    class Config:
        from_attributes = True

class FlagResponse(BaseModel):
    id: int
    content_id: int
    user_id: int
    reason: str
    created_at: datetime
    content: ContentResponse  # Nested content object
    user: UserResponse        # Nested user object

    class Config:
        from_attributes = True

class UserSubmissionInfo(BaseModel):
     weekly_submission_count: int
     last_submission_date: date
     can_submit: bool
     submissions_remaining: Optional[int] = None  # -1 for unlimited if premium

     class Config:
         from_attributes = True

class UserRegisterResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

    class Config:
        from_attributes = True

class NotificationBase(BaseModel):
    message: str
    type: str  # ← ADD THIS LINE

class NotificationCreate(NotificationBase):
    user_id: int

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = False

class Notification(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime
    timestamp: datetime = Field(default_factory=datetime.utcnow)  # Add this line

    class Config:
        from_attributes = True

# Contact Schemas
class ContactBase(BaseModel):
    name: str = Field(..., max_length=100, example="Jane Doe")
    email: EmailStr = Field(..., example="jane.doe@example.com")

class ContactCreate(ContactBase):
    pass

class ContactBulkCreate(BaseModel):
    contacts: List[ContactCreate]

class ContactResponse(ContactBase):
    id: int
    user_id: int
    quality_score: Optional[float] = None  # Optional for non-premium users
    created_at: datetime

    class Config:
        from_attributes = True

class ContactListResponse(BaseModel):
    contacts: List[ContactResponse]

    class Config:
        from_attributes = True

class UserAnalyticsSchema(BaseModel):
    user_id: int
    total_content_shares: int
    successful_cross_promotions: int

    class Config:
        from_attributes = True

class UserProfileResponse(BaseModel):
    profile: ProfileResponse
    user: UserResponse

    class Config:
        from_attributes = True

# Password Reset Schemas
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, example="StrongPass1!")

# backend/app/models/schemas.py - Line 309
@validator('new_password')
def password_strength(cls, v):
    # Minimum 12 characters
    if len(v) < 12:
        raise ValueError('Password must be at least 12 characters long.')

    # Check for uppercase, lowercase, digit, and special character
    if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&\-_+=\[\]{}|\\:;,.<>?/~`])', v):
        raise ValueError('Password must include uppercase, lowercase, number, and special character.')

    # Check for common passwords
    common_passwords = ['password', '12345678', 'qwerty', 'abc123', 'password123',
                       'letmein', 'welcome', 'monkey', '1234567890', 'password1']
    if v.lower() in common_passwords:
        raise ValueError('Password is too common. Please choose a stronger password.')

    # Check for sequential characters
    if re.search(r'(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def)', v.lower()):
        raise ValueError('Password contains sequential characters. Please choose a stronger password.')

    return v

# Password Update Schema
class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, example="NewStrongPass1!")

    @validator('new_password')
    def password_strength(cls, v):
        """
        Validates that the password has at least one uppercase letter, one digit, and one special character.
        """
        if not re.match(r'^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$', v):
            raise ValueError('Password must be at least 8 characters long, include an uppercase letter, a number, and a special character.')
        return v

class LinkCreate(BaseModel):
    content_id: int

    class Config:
        from_attributes = True


# New Conversion Schemas
class ConversionCreate(BaseModel):
    user_id: int = Field(..., example=1)
    content_id: int = Field(..., example=1)
    conversion_type: str = Field(..., example="purchase")
    details: Optional[str] = Field(None, example="Purchased via promotion code.")

    class Config:
        from_attributes = True

class ConversionResponse(BaseModel):
    id: int
    user_id: int
    content_id: int
    conversion_type: str
    details: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# New Audience Schemas

class AudienceCreate(BaseModel):
    user_id: int = Field(..., example=1)  # ID of the user to associate with this audience
    demographics: Optional[List[str]] = Field(None, example=["Age 18-24", "Location: USA"])
    interests: Optional[List[str]] = Field(None, example=["Technology", "Health"])
    preferences: Optional[dict] = Field(None, example={"newsletter": True, "notifications": False})

    class Config:
        from_attributes = True


class AudienceResponse(BaseModel):
    id: int
    user_id: int
    score: float
    demographics: Optional[List[str]]
    interests: Optional[List[str]]
    preferences: Optional[dict]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AudienceUpdate(BaseModel):
    demographics: Optional[List[str]] = Field(None, example=["Age 25-34", "Location: Canada"])
    interests: Optional[List[str]] = Field(None, example=["Finance", "Education"])
    preferences: Optional[dict] = Field(None, example={"newsletter": False, "notifications": True})

    class Config:
        from_attributes = True



# **Add the EmailSchema here**
class EmailSchema(BaseModel):
    email: List[EmailStr]
    subject: str
    body: str

    class Config:
        from_attributes = True

# Add these new schemas to your schemas.py file

class ContentAnalyticsResponse(BaseModel):
    # ✅ ADD ID FIELD
    id: int = Field(..., example=1)

    # Core metrics
    views: int = Field(default=0, example=100)
    shares: int = Field(default=0, example=5)
    short_link_clicks: int = Field(default=0, example=25)
    conversions_count: int = Field(default=0, example=2)

    # Frontend compatibility fields
    share_count: int = Field(default=0, example=5)
    view_count: int = Field(default=0, example=100)

    # Content metadata
    title: str = Field(..., example="Sample Content Title")
    content_type: str = Field(..., example="article")
    required_shares: int = Field(default=5, example=5)
    status: str = Field(..., example="active")

    # Timestamps
    created_at: Optional[str] = Field(None, example="2025-09-16T06:46:59.898544")

    # Calculated metrics
    completion_rate: float = Field(default=0.0, example=60.5)
    performance_score: float = Field(default=0.0, example=75.2)

    # NEW METRICS
    click_through_rate: float = Field(default=0.0, example=25.0, description="Percentage of views that resulted in clicks")
    conversion_rate: float = Field(default=0.0, example=8.0, description="Percentage of clicks that converted")
    engagement_score: float = Field(default=0.0, example=3.5, description="Overall engagement metric")


    class Config:
        from_attributes = True

class AnalyticsSummaryResponse(BaseModel):
    total_content: int = Field(default=0, example=10)
    total_shares: int = Field(default=0, example=50)
    total_views: int = Field(default=0, example=500)
    total_clicks: int = Field(default=0, example=100)
    completion_rate: float = Field(default=0.0, example=60.5)
    successful_cross_promotions: int = Field(default=0, example=5)
    performance_trend: str = Field(default="stable", example="improving")

    class Config:
        from_attributes = True

# Add these schemas to the end of your backend/app/models/schemas.py file

# Feedback Schemas (add at the end of the file)
class FeedbackCreate(BaseModel):
    name: str = Field(..., max_length=100, example="John Doe")
    email: EmailStr = Field(..., example="john@example.com")
    subject: str = Field(..., max_length=200, example="Question about pricing")
    message: str = Field(..., min_length=10, example="I'd like to know more about your premium features.")
    feedback_type: str = Field(default="general", example="general")

    @validator('feedback_type')
    def validate_feedback_type(cls, v):
        valid_types = ["general", "support", "bug", "feature", "business"]
        if v not in valid_types:
            raise ValueError(f'feedback_type must be one of: {", ".join(valid_types)}')
        return v

class FeedbackResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    subject: str
    message: str
    feedback_type: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class FeedbackListResponse(BaseModel):
    feedback: List[FeedbackResponse]
    total: int

class FeedbackStatusUpdate(BaseModel):
    status: str = Field(..., example="in_progress")

    @validator('status')
    def validate_status(cls, v):
        valid_statuses = ["new", "in_progress", "resolved"]
        if v not in valid_statuses:
            raise ValueError(f'status must be one of: {", ".join(valid_statuses)}')
        return v

# ============================================================================
# POOL SCHEMAS - Content Review & Submission System
# ============================================================================

class PoolReviewCreate(BaseModel):
    """Schema for creating a pool review"""
    content_id: int
    rating: int = Field(..., ge=1, le=5, description="Rating from 1-5")
    feedback: Optional[str] = Field(None, max_length=500)

class PoolReviewResponse(BaseModel):
    """Schema for pool review response"""
    id: int
    user_id: int
    content_id: int
    rating: int
    feedback: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class PoolSubmissionResponse(BaseModel):
    """Schema for pool submission response"""
    id: int
    user_id: int
    content_id: Optional[int]
    title: str
    original_url: str
    category: str
    pitch: Optional[str]
    status: str
    review_count: int
    average_rating: float
    created_at: datetime
    approved_at: Optional[datetime]

    class Config:
        from_attributes = True

class PoolContent(BaseModel):
    """Schema for content in the pool"""
    id: int
    title: str
    description: Optional[str]
    url: Optional[str]
    content_type: str
    categories: List[str] = []
    pool_review_count: int = 0
    pool_average_rating: float = 0.0
    pool_claim_count: int = 0
    engagement_score: float = 0.0
    created_at: datetime

    class Config:
        from_attributes = True

class PoolContentList(BaseModel):
    """Schema for pool content listing"""
    success: bool = True
    contents: List[PoolContent]
    count: int

class PoolActivity(BaseModel):
    """Schema for user's pool activity"""
    success: bool = True
    reviews: List[PoolReviewResponse]
    submissions: List[PoolSubmissionResponse]  # ✅ Changed from claims
    total_reviews: int
    total_submissions: int  # ✅ Changed from total_claims

class PoolReviewSubmitResponse(BaseModel):
    """Schema for review submission"""
    success: bool = True
    content_id: int
    total_reviews: int
    average_rating: float
    engagement_score: float

class PoolSubmissionSubmitResponse(BaseModel):
    """Schema for submission submission"""
    success: bool = True
    submission: PoolSubmissionResponse

class PoolContentWithAlignment(PoolContent):
    """Pool content with alignment scoring"""
    alignment_score: int = Field(default=85, ge=0, le=100)
    match_reason: str = Field(default="Algorithmically matched")

class CollaborationMatch(BaseModel):
    """Collaboration partner suggestion"""
    id: int
    content_id: Optional[int]
    title: str
    original_url: str
    category: str
    pitch: Optional[str]
    collab_score: int
    collab_idea: str

class GenesisMetrics(BaseModel):
    """Audience Genesis metrics response"""
    success: bool = True
    metrics: dict = {
        "would_follow_count": 0,
        "conversion_rate": 0.0,
        "genuine_connections": 0,
        "active_collabs": 0,
        "streak_days": 0,
        "total_reviews_given": 0,
        "total_reviews_received": 0
    }

# ==================== ENUMS ====================
class CollectiveGroupStatusEnum(str, Enum):
    FORMING = "forming"
    ACTIVE = "active"
    PAUSED = "paused"
    DISBANDED = "disbanded"


class MembershipStatusEnum(str, Enum):
    ACTIVE = "active"
    WARNING = "warning"
    PROBATION = "probation"
    REMOVED = "removed"


class ShareStatusEnum(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    MISSED = "missed"
    EXCUSED = "excused"


# ==================== GROUP SCHEMAS ====================
class CollectiveGroupCreate(BaseModel):
    name: str = Field(..., max_length=200, example="Tech Creators Collective")
    description: Optional[str] = Field(None, example="Group for tech bloggers & YouTubers")
    niche: str = Field(..., example="Technology")
    min_members: int = Field(default=4, ge=2, le=4)
    max_members: int = Field(default=8, ge=4, le=12)
    follower_range_min: int = Field(default=0, ge=0)
    follower_range_max: int = Field(default=10000, ge=0)
    target_audience: Optional[List[str]] = Field(None, example=["developers", "entrepreneurs"])
    content_types: Optional[List[str]] = Field(None, example=["article", "video"])
    shares_per_week: int = Field(default=5, ge=1, le=7)


class CollectiveGroupResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    niche: str
    status: CollectiveGroupStatusEnum
    min_members: int
    max_members: int
    current_member_count: int = 0
    follower_range_min: int
    follower_range_max: int
    shares_per_week: int
    created_at: datetime
    last_active: datetime

    class Config:
        from_attributes = True


# ==================== MEMBERSHIP SCHEMAS ====================
class CollectiveMembershipResponse(BaseModel):
    id: int
    user_id: int
    group_id: int
    status: MembershipStatusEnum
    strike_count: int
    shares_completed: int
    shares_missed: int
    total_clicks_generated: int
    average_engagement_rate: float
    quality_score: float
    reliability_score: float
    is_admin: bool
    joined_at: datetime
    last_share_date: Optional[date]

    class Config:
        from_attributes = True


class MemberWithUser(CollectiveMembershipResponse):
    """Extended membership with user details"""
    username: str
    email: str
    profile_name: Optional[str]


# ==================== SCHEDULE SCHEMAS ====================
class CollectiveScheduleResponse(BaseModel):
    id: int
    group_id: int
    user_id: int
    share_date: date
    day_of_week: str
    is_completed: bool
    completion_rate: float
    reminder_sent: bool

    class Config:
        from_attributes = True


class ScheduleWithUser(CollectiveScheduleResponse):
    """Schedule with user details"""
    username: str
    profile_name: Optional[str]


# ==================== SHARE SCHEMAS ====================
class CollectiveShareCreate(BaseModel):
    group_id: int
    recipient_user_id: int
    content_id: int
    share_url: Optional[str] = Field(None, example="https://twitter.com/user/status/123")


class CollectiveShareResponse(BaseModel):
    id: int
    group_id: int
    sharer_id: int
    recipient_id: int
    content_id: Optional[int]
    tracking_code: str
    status: ShareStatusEnum
    click_count: int
    engagement_rate: float
    quality_score: Optional[float]
    due_date: date
    shared_at: Optional[datetime]
    verified_at: Optional[datetime]

    class Config:
        from_attributes = True


class ShareWithDetails(CollectiveShareResponse):
    """Share with full user and content details"""
    sharer_username: str
    recipient_username: str
    content_title: Optional[str]
    content_url: Optional[str]


# ==================== DASHBOARD SCHEMAS ====================
class CollectiveDashboardResponse(BaseModel):
    """Main dashboard data"""
    my_groups: List[CollectiveGroupResponse]
    upcoming_shares: List[ScheduleWithUser]
    pending_shares: List[ShareWithDetails]
    recent_activity: List[Dict]
    overall_stats: Dict[str, Any]  # ✅ Changed from 'any' to 'Any'


class CollectiveGroupDetailResponse(BaseModel):
    """Detailed group view"""
    group: CollectiveGroupResponse
    members: List[MemberWithUser]
    schedule: List[ScheduleWithUser]
    recent_shares: List[ShareWithDetails]
    group_stats: Dict[str, Any]  # ✅ Changed from 'any' to 'Any'

# ==================== MATCHING SCHEMAS ====================
class CollectiveMatchingRequest(BaseModel):
    """Request to find/create a matching group"""
    niche: str
    follower_count: int
    content_types: List[str]
    target_audience: List[str]
    commitment_level: str = Field(..., example="3-5 times/week")


class CollectiveMatchResponse(BaseModel):
    """Matching algorithm results"""
    recommended_groups: List[CollectiveGroupResponse]
    create_new_group: bool = False
    match_scores: Dict[int, float]  # group_id: score


# ==================== VERIFICATION SCHEMAS ====================
class ShareVerificationResponse(BaseModel):
    """Result of share verification"""
    verified: bool
    tracking_code: str
    click_count: int
    engagement_rate: float
    quality_score: float
    timestamp: datetime

# Add these at the end of backend/app/models/schemas.py

# ==================== MESSAGE SCHEMAS ====================
class MessageCreate(BaseModel):
    recipient_id: int
    content: str = Field(..., min_length=1, max_length=2000)

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    content: str
    is_read: bool
    created_at: datetime
    thread_id: str

    # Sender info
    sender_username: Optional[str] = None
    sender_avatar: Optional[str] = None

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    thread_id: str
    other_user_id: int
    other_user_username: str
    other_user_avatar: Optional[str] = None
    last_message: MessageResponse
    unread_count: int
    total_messages: int

class MessageThreadResponse(BaseModel):
    success: bool = True
    thread_id: str
    messages: List[MessageResponse]
    total_count: int

# ==================== FOLLOW SCHEMAS ====================
class FollowResponse(BaseModel):
    id: int
    follower_id: int
    following_id: int
    created_at: datetime

    # User info
    username: Optional[str] = None
    avatar: Optional[str] = None

    class Config:
        from_attributes = True

class FollowStatusResponse(BaseModel):
    is_following: bool
    is_followed_by: bool  # Are they following you back?
    follow_id: Optional[int] = None
    created_at: Optional[datetime] = None

class FollowListResponse(BaseModel):
    success: bool = True
    follows: List[FollowResponse]
    total_count: int

class FollowStatsResponse(BaseModel):
    following_count: int
    followers_count: int
    mutual_count: int  # People who follow you back

# ==================== CREATOR COLLECTIVES SCHEMAS ====================

class CollectiveBase(BaseModel):
    name: str
    description: Optional[str] = None
    niche: str
    max_members: int = 8
    visibility: str = "private"  # private, invite_only, public

class CollectiveCreate(CollectiveBase):
    pass

class CollectiveUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    visibility: Optional[str] = None

class CollectiveMemberBase(BaseModel):
    user_id: int
    collective_id: int
    role: str = "member"  # owner, admin, member

class CollectiveMemberCreate(CollectiveMemberBase):
    pass

class CollectiveMemberResponse(BaseModel):
    id: int
    user_id: int
    collective_id: int
    role: str
    joined_at: datetime
    contribution_score: int

    # User details
    username: str
    email: str
    tier: Optional[str] = None
    profile_picture_url: Optional[str] = None

    class Config:
        from_attributes = True

class CollectiveResponse(CollectiveBase):
    id: int
    creator_id: int
    created_at: datetime
    member_count: int = 0
    members: List[CollectiveMemberResponse] = []

    class Config:
        from_attributes = True

class CollectiveInviteBase(BaseModel):
    collective_id: int
    invitee_email: str
    message: Optional[str] = None

class CollectiveInviteCreate(CollectiveInviteBase):
    pass

class CollectiveInviteResponse(BaseModel):
    id: int
    collective_id: int
    inviter_id: int
    invitee_email: str
    status: str  # pending, accepted, declined
    created_at: datetime

    class Config:
        from_attributes = True

class CollectiveActivityBase(BaseModel):
    collective_id: int
    activity_type: str  # post_shared, engagement_given, milestone_reached
    description: str
    points_earned: int = 0

class CollectiveActivityCreate(CollectiveActivityBase):
    user_id: int

class CollectiveActivityResponse(CollectiveActivityBase):
    id: int
    user_id: int
    created_at: datetime
    username: str  # Added for display purposes

    class Config:
        from_attributes = True

class CollectiveScheduleBase(BaseModel):
    collective_id: int
    assigned_user_id: int
    scheduled_date: datetime
    content_type: str  # post, thread, video
    status: str = "pending"  # pending, completed, skipped

class CollectiveScheduleCreate(CollectiveScheduleBase):
    pass

class CollectiveScheduleResponse(CollectiveScheduleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ==================== QUICK CONNECTS SCHEMAS ====================

class QuickConnectRequestBase(BaseModel):
    title: str
    description: str
    request_type: str  # beta_test, feedback, collaboration, promotion
    tokens_offered: int = 0
    deadline: Optional[datetime] = None
    max_responses: Optional[int] = None

class QuickConnectRequestCreate(QuickConnectRequestBase):
    pass

class QuickConnectRequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[datetime] = None

class QuickConnectRequestResponse(QuickConnectRequestBase):
    id: int
    requester_id: int
    status: str  # open, in_progress, completed, closed
    created_at: datetime

    # Requester details
    requester_username: str
    requester_email: str
    requester_tier: Optional[str] = None

    # Response count
    response_count: int = 0

    class Config:
        from_attributes = True

class QuickConnectResponseBase(BaseModel):
    request_id: int
    message: str

class QuickConnectResponseCreate(QuickConnectResponseBase):
    pass

class QuickConnectResponseUpdate(BaseModel):
    status: Optional[str] = None

class QuickConnectResponseResponse(QuickConnectResponseBase):
    id: int
    responder_id: int
    status: str  # pending, accepted, rejected, completed
    created_at: datetime

    # Responder details
    responder_username: str
    responder_email: str
    responder_tier: Optional[str] = None

    class Config:
        from_attributes = True

class QuickConnectTokenTransactionBase(BaseModel):
    user_id: int
    amount: int
    transaction_type: str  # earned, spent, bonus, refund
    description: str

class QuickConnectTokenTransactionCreate(QuickConnectTokenTransactionBase):
    pass

class QuickConnectTokenTransactionResponse(QuickConnectTokenTransactionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Add this at the end of the file to resolve forward references
UserRegisterResponse.update_forward_refs()
