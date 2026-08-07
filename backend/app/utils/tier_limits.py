# backend/app/utils/tier_limits.py

from typing import Dict, Any

# Define tier limits
TIER_LIMITS = {
    'free': {
        # Growth Routes
        'max_routes': 1,  # Only 1 AI-matched route
        'routes_available': ['audience_pool'],  # Default route

        # Queue Access
        'queue_daily_limit': 20,
        'queue_unlimited': False,

        # Submissions
        'max_active_submissions': 100,
        'submissions_unlimited': False,

        # Messaging
        'max_new_chats_per_day': 5,
        'messages_unlimited': False,

        # AI Features
        'ai_profile_analysis': False,  # Basic only
        'ai_icebreakers': False,  # Generic templates
        'ai_matching_unlimited': False,
        'ai_predictions': False,

        # Tokens
        'starting_tokens': 100,
        'monthly_bonus_tokens': 0,

        # Collectives
        'max_groups_join': 2,
        'max_groups_create': 0,
        'ai_scheduling': False,

        # Analytics
        'advanced_analytics': False,

        # Priority
        'queue_priority_boost': 0.0,  # No boost
    },
    'pro': {
        # Growth Routes
        'max_routes': 3,  # All routes unlocked
        'routes_available': ['audience_pool', 'collectives', 'quick_connects'],

        # Queue Access
        'queue_daily_limit': -1,  # -1 means unlimited
        'queue_unlimited': True,

        # Submissions
        'max_active_submissions': -1,  # Unlimited
        'submissions_unlimited': True,

        # Messaging
        'max_new_chats_per_day': -1,  # Unlimited
        'messages_unlimited': True,

        # AI Features
        'ai_profile_analysis': True,  # Deep AI analysis
        'ai_icebreakers': True,  # Unlimited AI-personalized
        'ai_matching_unlimited': True,
        'ai_predictions': True,

        # Tokens
        'starting_tokens': 100,
        'monthly_bonus_tokens': 200,

        # Collectives
        'max_groups_join': -1,  # Unlimited
        'max_groups_create': -1,  # Unlimited
        'ai_scheduling': True,

        # Analytics
        'advanced_analytics': True,

        # Priority
        'queue_priority_boost': 0.25,  # 25% boost
    }
}


def get_tier_limits(tier: str) -> Dict[str, Any]:
    """Get limits for a specific tier"""
    return TIER_LIMITS.get(tier, TIER_LIMITS['free'])


def check_feature_access(user_tier: str, feature: str) -> bool:
    """Check if a tier has access to a feature"""
    limits = get_tier_limits(user_tier)
    return limits.get(feature, False)


def get_remaining_quota(user_tier: str, feature: str, current_usage: int) -> int:
    """Calculate remaining quota for a feature"""
    limits = get_tier_limits(user_tier)
    max_limit = limits.get(feature, 0)

    if max_limit == -1:  # Unlimited
        return -1

    remaining = max_limit - current_usage
    return max(0, remaining)


def requires_upgrade(user_tier: str, feature: str) -> Dict[str, Any]:
    """Check if feature requires upgrade and return upgrade info"""
    has_access = check_feature_access(user_tier, feature)

    if has_access:
        return {
            'requires_upgrade': False,
            'has_access': True
        }

    return {
        'requires_upgrade': True,
        'has_access': False,
        'upgrade_to': 'pro',
        'message': 'This feature is available in Pro plan'
    }
