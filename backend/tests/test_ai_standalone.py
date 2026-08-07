# backend/tests/test_ai_standalone.py
import sys
import os
from pathlib import Path
import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta

# Get the correct path to the backend directory
current_file = Path(__file__).resolve()
tests_dir = current_file.parent
backend_dir = tests_dir.parent

# Add the backend directory to the Python path
sys.path.append(str(backend_dir))

class MockContent:
    def __init__(self, id, user_id, title, description, content_type, categories, view_count=0, share_count=0):
        self.id = id
        self.user_id = user_id
        self.title = title
        self.description = description
        self.content_type = MagicMock()
        self.content_type.value = content_type
        self.categories = categories
        self.view_count = view_count
        self.share_count = share_count
        self.created_at = datetime.utcnow() - timedelta(days=1)
        self.ai_analysis = None

class MockUser:
    def __init__(self, id, username, is_ai_tier=False, is_premium=False):
        self.id = id
        self.username = username
        self.is_ai_tier = is_ai_tier
        self.is_premium = is_premium
        self.autopilot_enabled = False
        self.autopilot_settings = {}

class MockProfile:
    def __init__(self, user_id, name, interests=None, categories=None):
        self.user_id = user_id
        self.name = name
        self.interests = interests or []
        self.categories = categories or []

class MockAIContentAnalysis:
    def __init__(self, content_id, quality_score=75, sentiment_score=0.5, readability_score=80):
        self.content_id = content_id
        self.quality_score = quality_score
        self.sentiment_score = sentiment_score
        self.readability_score = readability_score
        self.topic_analysis = {
            "topics": {"technology": 2, "ai": 1},
            "keywords": ["technology", "artificial", "intelligence"],
            "entities": [{"text": "AI", "type": "PRODUCT"}]
        }

class MockAIService:
    def __init__(self, db=None):
        self.db = db or MagicMock()

        # Set up mock user
        self.mock_user = MockUser(1, "testuser", is_ai_tier=True, is_premium=True)

        # Set up mock contents
        self.mock_contents = [
            MockContent(1, 1, "AI Technology Trends", "Latest in AI tech", "article", ["technology", "ai"], 15, 5),
            MockContent(2, 1, "Machine Learning Guide", "How to get started with ML", "video", ["technology", "machine-learning"], 25, 8),
            MockContent(3, 1, "Python Programming", "Python basics for ML", "blog", ["programming", "python"], 10, 2)
        ]

        # Setup mock profile
        self.mock_profile = MockProfile(1, "Test User",
                                       interests=["technology", "programming", "artificial intelligence"],
                                       categories=["technology", "science"])

        # Configure mock database queries
        self.db.query = MagicMock()
        self.db.query.return_value.filter.return_value.first.return_value = self.mock_user
        self.db.query.return_value.filter.return_value.all.return_value = self.mock_contents

    def recommend_next_content(self, user_id):
        """Recommends content type and category based on performance."""
        # Check if user exists
        if user_id != 1:  # Our mock user ID
            return {"error": "User not found"}

        # If no content, return generic recommendation
        if not self.mock_contents:
            return {
                "recommendation": "Share your first link to get personalized recommendations.",
                "best_content_type": None,
                "best_category": None,
                "type_performance": {},
                "category_performance": {}
            }

        # Calculate performance by type
        type_performance = {}
        for content in self.mock_contents:
            performance = content.view_count + content.share_count * 2
            if content.content_type.value not in type_performance:
                type_performance[content.content_type.value] = 0
            type_performance[content.content_type.value] += performance

        # Calculate performance by category
        category_performance = {}
        for content in self.mock_contents:
            performance = content.view_count + content.share_count * 2
            for category in content.categories:
                if category not in category_performance:
                    category_performance[category] = 0
                category_performance[category] += performance

        # Find best performing type and category
        best_type = max(type_performance.items(), key=lambda x: x[1]) if type_performance else (None, 0)
        best_category = max(category_performance.items(), key=lambda x: x[1]) if category_performance else (None, 0)

        # Create recommendation message
        if best_type[0] and best_category[0]:
            recommendation_msg = f"Links to {best_type[0]} content about {best_category[0]} perform best when you share them."
        elif best_type[0]:
            recommendation_msg = f"Links to {best_type[0]} content perform best regardless of category."
        elif best_category[0]:
            recommendation_msg = f"Content about {best_category[0]} performs best regardless of format."
        else:
            recommendation_msg = "Continue sharing diverse content to gather more performance insights."

        return {
            "recommendation": recommendation_msg,
            "best_content_type": best_type[0],
            "best_category": best_category[0],
            "type_performance": type_performance,
            "category_performance": category_performance
        }

    def generate_content_strategy(self, user_id):
        """Generate a comprehensive content sharing strategy."""
        # Check if user exists
        if user_id != 1:  # Our mock user ID
            return {"error": "User not found"}

        # Get content recommendations
        content_recommendations = self.recommend_next_content(user_id)

        # Calculate some basic statistics
        total_shares = sum(c.share_count for c in self.mock_contents)
        total_views = sum(c.view_count for c in self.mock_contents)
        shares_per_week = len(self.mock_contents) / 1.0  # Assume 1 week of activity

        # Create personalized recommendations
        recommendations = []

        # 1. Sharing volume recommendation
        if len(self.mock_contents) < 5:
            recommendations.append({
                "type": "sharing_volume",
                "title": "Increase Your Sharing Activity",
                "description": f"You've shared {len(self.mock_contents)} links so far. Share at least 5 links to build your cross-promotion network.",
                "expected_impact": "High"
            })

        # 2. Content type recommendation
        best_type = content_recommendations.get("best_content_type")
        if best_type:
            recommendations.append({
                "type": "content_focus",
                "title": f"Share More {best_type.capitalize()} Links",
                "description": f"{best_type.capitalize()} links receive more engagement than your other shared content.",
                "expected_impact": "High"
            })

        # 3. Category recommendation
        best_category = content_recommendations.get("best_category")
        if best_category and best_category != "general":
            recommendations.append({
                "type": "topic_recommendation",
                "title": f"Focus on {best_category.capitalize()} Topics",
                "description": f"Content about {best_category} gets more engagement in your network.",
                "expected_impact": "High"
            })

        # Create a personalized summary
        if len(self.mock_contents) == 0:
            summary = "Start sharing content to build your cross-promotion network and get personalized recommendations."
        else:
            high_impact_recs = [rec["title"] for rec in recommendations if rec["expected_impact"] == "High"]
            if high_impact_recs:
                summary = f"Focus on: {', '.join(high_impact_recs[:3])} to improve your cross-promotion effectiveness."
            else:
                summary = "Your content sharing strategy is working well. Continue engaging with your network regularly."

        # Create the final strategy object
        strategy = {
            "strategy_id": f"strategy-{user_id}-{datetime.utcnow().timestamp()}",
            "created_at": datetime.utcnow().isoformat(),
            "summary": summary,
            "recommendations": recommendations,
            "stats": {
                "total_content_shared": len(self.mock_contents),
                "total_views": total_views,
                "total_shares": total_shares,
                "sharing_frequency": round(shares_per_week, 1)
            }
        }

        return strategy

    def toggle_autopilot(self, user_id, enabled):
        """Toggle autopilot mode for a user."""
        # Check if user exists
        if user_id != 1:  # Our mock user ID
            return {"error": "User not found"}

        # Update user's autopilot setting
        self.mock_user.autopilot_enabled = enabled

        return self.mock_user

    def update_autopilot_settings(self, user_id, settings):
        """Update autopilot settings for a user."""
        # Check if user exists
        if user_id != 1:  # Our mock user ID
            return {"error": "User not found"}

        # Update settings
        for key, value in settings.items():
            self.mock_user.autopilot_settings[key] = value

        return self.mock_user


class TestAIServiceStandalone(unittest.TestCase):
    """Tests for the mock AI service."""

    def setUp(self):
        self.ai_service = MockAIService()

    def test_recommend_next_content(self):
        """Test content recommendations."""
        # Test with valid user
        result = self.ai_service.recommend_next_content(1)

        # Check basic structure
        self.assertIn("recommendation", result)
        self.assertIn("best_content_type", result)
        self.assertIn("best_category", result)

        # Check that we got meaningful recommendations
        self.assertIsNotNone(result["best_content_type"])
        self.assertIsNotNone(result["best_category"])

        # Based on our mock data, video should be best type and technology best category
        self.assertEqual(result["best_content_type"], "video")
        self.assertEqual(result["best_category"], "technology")

        # Test with invalid user
        result = self.ai_service.recommend_next_content(999)
        self.assertIn("error", result)

    def test_generate_content_strategy(self):
        """Test content strategy generation."""
        # Test with valid user
        result = self.ai_service.generate_content_strategy(1)

        # Check basic structure
        self.assertIn("summary", result)
        self.assertIn("recommendations", result)
        self.assertIn("stats", result)

        # Check recommendations
        self.assertIsInstance(result["recommendations"], list)
        self.assertGreaterEqual(len(result["recommendations"]), 1)

        # Check stats
        self.assertEqual(result["stats"]["total_content_shared"], 3)
        self.assertEqual(result["stats"]["total_views"], 50)
        self.assertEqual(result["stats"]["total_shares"], 15)

        # Test with invalid user
        result = self.ai_service.generate_content_strategy(999)
        self.assertIn("error", result)

    def test_toggle_autopilot(self):
        """Test toggling autopilot."""
        # Test enabling
        user = self.ai_service.toggle_autopilot(1, True)
        self.assertTrue(user.autopilot_enabled)

        # Test disabling
        user = self.ai_service.toggle_autopilot(1, False)
        self.assertFalse(user.autopilot_enabled)

        # Test with invalid user
        result = self.ai_service.toggle_autopilot(999, True)
        self.assertIn("error", result)

    def test_update_autopilot_settings(self):
        """Test updating autopilot settings."""
        # Test updating settings
        settings = {
            "max_daily_shares": 5,
            "schedule_preference": "morning",
            "content_quality_threshold": 80
        }

        user = self.ai_service.update_autopilot_settings(1, settings)

        # Check that settings were updated
        self.assertEqual(user.autopilot_settings["max_daily_shares"], 5)
        self.assertEqual(user.autopilot_settings["schedule_preference"], "morning")
        self.assertEqual(user.autopilot_settings["content_quality_threshold"], 80)

        # Test with invalid user
        result = self.ai_service.update_autopilot_settings(999, settings)
        self.assertIn("error", result)


if __name__ == "__main__":
    unittest.main()
