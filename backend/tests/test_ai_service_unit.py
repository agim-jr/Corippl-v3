# backend/tests/test_ai_service_unit.py
import sys
import os
from pathlib import Path
import unittest
from unittest.mock import MagicMock, patch

# Get the correct path to the backend directory
current_file = Path(__file__).resolve()
tests_dir = current_file.parent
backend_dir = tests_dir.parent

# Add the backend directory to the Python path
sys.path.append(str(backend_dir))

# Set environment variables
os.environ["DB_NAME"] = "echo_db"
os.environ["DB_USER"] = "echo_admin"
os.environ["DB_PASSWORD"] = "Junebug2025"
os.environ["DB_HOST"] = "localhost"
os.environ["DB_PORT"] = "5432"
os.environ["SECRET_KEY"] = "5cff37c757984a0ff3835cef3431ecd0617a5d825702bfa9ad8820561a277998"
# Add other environment variables if needed for imports

# Import the AI service
from backend.app.services.ai_service import AIService


class TestAIService(unittest.TestCase):
    """Unit tests for AIService that don't require database access"""

    def setUp(self):
        """Set up test fixtures"""
        # Create a mock database session
        self.mock_db = MagicMock()

        # Create an instance of AIService with the mock database
        self.ai_service = AIService(self.mock_db)

        # Create a mock user
        self.mock_user = MagicMock()
        self.mock_user.id = 1
        self.mock_user.username = "testuser_ai"
        self.mock_user.is_ai_tier = True
        self.mock_user.is_premium = True
        self.mock_user.autopilot_enabled = False
        self.mock_user.autopilot_settings = {}

        # Setup query result for the user
        self.mock_db.query().filter().first.return_value = self.mock_user

        # Mock content
        self.mock_content = MagicMock()
        self.mock_content.id = 1
        self.mock_content.user_id = 1
        self.mock_content.title = "Test Content"
        self.mock_content.description = "Test Description"
        self.mock_content.view_count = 10
        self.mock_content.share_count = 5
        self.mock_content.content_type.value = "article"
        self.mock_content.categories = ["technology", "ai"]

        # Setup query for content
        self.mock_db.query().filter().all.return_value = [self.mock_content]

    def test_toggle_autopilot(self):
        """Test toggling autopilot mode"""
        # Configure the mock to return our user when queried
        self.mock_db.query.return_value.filter.return_value.first.return_value = self.mock_user

        # Test enabling autopilot
        result = self.ai_service.toggle_autopilot(1, True)

        # Assert the user's autopilot_enabled was changed
        self.assertTrue(self.mock_user.autopilot_enabled)

        # Test disabling autopilot
        result = self.ai_service.toggle_autopilot(1, False)

        # Assert the user's autopilot_enabled was changed
        self.assertFalse(self.mock_user.autopilot_enabled)

        # Assert commit was called
        self.mock_db.commit.assert_called()

    def test_update_autopilot_settings(self):
        """Test updating autopilot settings"""
        # Configure the mock to return our user when queried
        self.mock_db.query.return_value.filter.return_value.first.return_value = self.mock_user

        # Test updating settings
        new_settings = {
            "max_daily_shares": 5,
            "schedule_preference": "morning",
            "content_quality_threshold": 80
        }

        result = self.ai_service.update_autopilot_settings(1, new_settings)

        # Assert the user's settings were updated
        self.assertEqual(self.mock_user.autopilot_settings, new_settings)

        # Assert commit was called
        self.mock_db.commit.assert_called()

    @patch('app.services.ai_service.datetime')
    def test_determine_optimal_time(self, mock_datetime):
        """Test determining optimal time for content sharing"""
        # Mock the current time to be a weekday at 8 AM
        mock_now = MagicMock()
        mock_now.weekday.return_value = 1  # Tuesday
        mock_now.hour = 8
        mock_datetime.utcnow.return_value = mock_now

        # Test the method
        result = self.ai_service.determine_optimal_time(1)

        # The result should be a datetime object
        self.assertTrue(hasattr(result, 'year'))

        # We're not validating the exact time calculation logic here,
        # just that it returns a datetime

    def test_recommend_next_content_new_user(self):
        """Test recommending content for a user with no content"""
        # Mock empty content list
        self.mock_db.query.return_value.filter.return_value.all.return_value = []

        # Test the method
        result = self.ai_service.recommend_next_content(1)

        # Check the result
        self.assertIn("recommendation", result)
        self.assertIsNone(result.get("best_content_type"))
        self.assertIsNone(result.get("best_category"))
        self.assertEqual(result.get("type_performance"), {})
        self.assertEqual(result.get("category_performance"), {})


if __name__ == "__main__":
    unittest.main()
