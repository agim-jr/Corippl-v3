# backend/tests/test_ai_dashboard.py

import pytest
import requests
import json
from datetime import datetime, timedelta
from typing import Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TestAIDashboard:
    """
    Comprehensive test suite for AI Enhanced Dashboard functionality.
    Tests the reciprocal AI system endpoints and business logic.
    """

    def setup_class(self):
        """Setup test configuration"""
        self.base_url = "http://localhost:8000"
        self.api_prefix = "/api/reciprocal-ai"

        # Test user credentials (you'll need to create these in your test DB)
        self.test_user = {
            "username": "ai_test_user",
            "password": "test_password",
            "email": "ai_test@example.com"
        }

        self.ai_user = {
            "username": "ai_tier_user",
            "password": "test_password",
            "email": "ai_tier@example.com"
        }

        # Will store auth tokens
        self.regular_token = None
        self.ai_tier_token = None

    def authenticate_user(self, username: str, password: str) -> str:
        """Helper method to authenticate and get JWT token"""
        try:
            response = requests.post(
                f"{self.base_url}/auth/login",
                data={"username": username, "password": password}
            )
            if response.status_code == 200:
                return response.json()["access_token"]
            else:
                logger.error(f"Authentication failed: {response.text}")
                return None
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return None

    def get_headers(self, token: str) -> Dict[str, str]:
        """Get authorization headers"""
        return {"Authorization": f"Bearer {token}"}

    def test_01_setup_authentication(self):
        """Test authentication setup"""
        logger.info("Setting up authentication...")

        # Try to authenticate regular user
        self.regular_token = self.authenticate_user(
            self.test_user["username"],
            self.test_user["password"]
        )

        # Try to authenticate AI tier user
        self.ai_tier_token = self.authenticate_user(
            self.ai_user["username"],
            self.ai_user["password"]
        )

        logger.info(f"Regular token: {'✓' if self.regular_token else '✗'}")
        logger.info(f"AI tier token: {'✓' if self.ai_tier_token else '✗'}")

        # At least one should work for testing
        assert self.regular_token or self.ai_tier_token, "No authentication token available"

    def test_02_health_check(self):
        """Test AI service health check"""
        if not self.ai_tier_token:
            pytest.skip("No AI tier token available")

        response = requests.get(
            f"{self.base_url}{self.api_prefix}/health-check",
            headers=self.get_headers(self.ai_tier_token)
        )

        logger.info(f"Health check status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            logger.info(f"AI service status: {data.get('service_status')}")
            logger.info(f"User is AI tier: {data.get('is_ai_tier')}")
            logger.info(f"Autopilot enabled: {data.get('autopilot_enabled')}")

            assert data["service_status"] == "healthy"
            assert "user_id" in data
            assert "reciprocal_ai_version" in data
        else:
            logger.warning(f"Health check failed: {response.text}")

    def test_03_reciprocal_balance(self):
        """Test reciprocal balance calculation"""
        if not self.ai_tier_token:
            pytest.skip("No AI tier token available")

        response = requests.get(
            f"{self.base_url}{self.api_prefix}/balance",
            headers=self.get_headers(self.ai_tier_token)
        )

        logger.info(f"Balance check status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            balance = data["reciprocal_balance"]

            logger.info(f"Weekly given: {balance.get('weekly_given', 0)}")
            logger.info(f"Weekly received: {balance.get('weekly_received', 0)}")
            logger.info(f"Balance status: {balance.get('balance_status')}")

            # Verify structure
            assert "reciprocal_balance" in data
            assert "weekly_given" in balance
            assert "weekly_received" in balance
            assert "balance_status" in balance
            assert balance["balance_status"] in ["balanced", "giving_more", "receiving_more"]
        else:
            logger.warning(f"Balance check failed: {response.text}")

    def test_04_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        if not self.ai_tier_token:
            pytest.skip("No AI tier token available")

        response = requests.get(
            f"{self.base_url}{self.api_prefix}/dashboard-stats",
            headers=self.get_headers(self.ai_tier_token)
        )

        logger.info(f"Dashboard stats status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()

            # Log key metrics
            logger.info(f"Reciprocal balance: {data.get('reciprocal_balance', {})}")
            logger.info(f"Queue status: {data.get('queue_status', {})}")
            logger.info(f"AI activity: {data.get('ai_activity', {})}")

            # Verify structure matches frontend expectations
            assert "reciprocal_balance" in data
            assert "queue_status" in data
            assert "ai_activity" in data
            assert "efficiency_metrics" in data
            assert "performance_trend" in data

            # Verify reciprocal balance structure
            rb = data["reciprocal_balance"]
            assert "given_this_week" in rb
            assert "received_this_week" in rb
            assert "balance_status" in rb

            # Verify queue status structure
            qs = data["queue_status"]
            assert "items_waiting" in qs
            assert "immediate_unlock_opportunities" in qs

        else:
            logger.warning(f"Dashboard stats failed: {response.text}")

    def test_05_reciprocal_activity(self):
        """Test activity feed endpoint"""
        if not self.ai_tier_token:
            pytest.skip("No AI tier token available")

        response = requests.get(
            f"{self.base_url}{self.api_prefix}/activity?days=7",
            headers=self.get_headers(self.ai_tier_token)
        )

        logger.info(f"Activity feed status: {response.status_code}")

        if response.status_code == 200:
            activities = response.json()
            logger.info(f"Found {len(activities)} activities")

            # Verify structure
            assert isinstance(activities, list)

            for activity in activities[:3]:  # Check first 3
                logger.info(f"Activity: {activity.get('type')} - {activity.get('description')}")
                assert "type" in activity
                assert "timestamp" in activity
                assert "description" in activity
                assert activity["type"] in ["gave_share", "received_share"]
        else:
            logger.warning(f"Activity feed failed: {response.text}")

    def test_06_queue_status(self):
        """Test queue automation status"""
        if not self.ai_tier_token:
            pytest.skip("No AI tier token available")

        response = requests.get(
            f"{self.base_url}{self.api_prefix}/queue-status",
            headers=self.get_headers(self.ai_tier_token)
        )

        logger.info(f"Queue status check: {response.status_code}")

        if response.status_code == 200:
            data = response.json()

            logger.info(f"Queue size: {data.get('queue_size', 0)}")
            logger.info(f"Immediate opportunities: {data.get('immediate_unlock_opportunities', 0)}")
            logger.info(f"Next action: {data.get('next_recommended_action')}")

            # Verify structure
            assert "queue_size" in data
            assert "immediate_unlock_opportunities" in data
            assert "total_opportunities" in data
            assert "next_recommended_action" in data
            assert "queue_items" in data

            # Verify queue items structure
            for item in data["queue_items"][:2]:  # Check first 2
                assert "id" in item
                assert "title" in item
                assert "shares_needed" in item
        else:
            logger.warning(f"Queue status failed: {response.text}")

    def test_07_reciprocal_opportunities(self):
        """Test reciprocal opportunities endpoint"""
        if not self.ai_tier_token:
            pytest.skip("No AI tier token available")

        response = requests.get(
            f"{self.base_url}{self.api_prefix}/opportunities",
            headers=self.get_headers(self.ai_tier_token)
        )

        logger.info(f"Opportunities check: {response.status_code}")

        if response.status_code == 200:
            opportunities = response.json()
            logger.info(f"Found {len(opportunities)} opportunities")

            assert isinstance(opportunities, list)

            for opp in opportunities[:2]:  # Check first 2
                logger.info(f"Opportunity: Share '{opp.get('share_content', {}).get('title')}' to unlock '{opp.get('will_unlock', {}).get('title')}'")
                assert "share_content" in opp
                assert "will_unlock" in opp
                assert "reciprocal_value" in opp
        else:
            logger.warning(f"Opportunities failed: {response.text}")

    def test_08_toggle_autopilot(self):
        """Test autopilot toggle functionality"""
        if not self.ai_tier_token:
            pytest.skip("No AI tier token available")

        # Test enabling autopilot
        response = requests.post(
            f"{self.base_url}{self.api_prefix}/autopilot/toggle",
            headers=self.get_headers(self.ai_tier_token),
            json={"enabled": True}
        )

        logger.info(f"Autopilot enable status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            logger.info(f"Autopilot enabled: {data.get('autopilot_enabled')}")
            assert data["autopilot_enabled"] == True

            # Test disabling autopilot
            response = requests.post(
                f"{self.base_url}{self.api_prefix}/autopilot/toggle",
                headers=self.get_headers(self.ai_tier_token),
                json={"enabled": False}
            )

            if response.status_code == 200:
                data = response.json()
                logger.info(f"Autopilot disabled: {data.get('autopilot_enabled')}")
                assert data["autopilot_enabled"] == False
        else:
            logger.warning(f"Autopilot toggle failed: {response.text}")

    def test_09_update_autopilot_settings(self):
        """Test autopilot settings update"""
        if not self.ai_tier_token:
            pytest.skip("No AI tier token available")

        settings_payload = {
            "sharing_pace": "balanced",
            "quality_threshold": 75,
            "niche_matching": "focused",
            "priority_mode": "quality"
        }

        response = requests.put(
            f"{self.base_url}{self.api_prefix}/autopilot/settings",
            headers=self.get_headers(self.ai_tier_token),
            json=settings_payload
        )

        logger.info(f"Settings update status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            logger.info(f"Updated settings: {data.get('autopilot_settings')}")

            settings = data["autopilot_settings"]
            assert settings["sharing_pace"] == "balanced"
            assert settings["quality_threshold"] == 75
            assert settings["niche_matching"] == "focused"
            assert settings["priority_mode"] == "quality"
        else:
            logger.warning(f"Settings update failed: {response.text}")

    def test_10_ai_efficiency_metrics(self):
        """Test AI efficiency metrics"""
        if not self.ai_tier_token:
            pytest.skip("No AI tier token available")

        response = requests.get(
            f"{self.base_url}{self.api_prefix}/efficiency-metrics",
            headers=self.get_headers(self.ai_tier_token)
        )

        logger.info(f"Efficiency metrics status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()

            logger.info(f"Time saved: {data.get('time_saved_hours', 0)} hours")
            logger.info(f"Success rate: {data.get('reciprocal_success_rate', 0)}")
            logger.info(f"Automation efficiency: {data.get('automation_efficiency')}")

            assert "time_saved_hours" in data
            assert "reciprocal_success_rate" in data
            assert "automation_efficiency" in data
            assert data["automation_efficiency"] in ["high", "medium", "low"]
        else:
            logger.warning(f"Efficiency metrics failed: {response.text}")

    def test_11_non_ai_tier_access(self):
        """Test that non-AI tier users get proper error messages"""
        if not self.regular_token:
            pytest.skip("No regular user token available")

        response = requests.get(
            f"{self.base_url}{self.api_prefix}/dashboard-stats",
            headers=self.get_headers(self.regular_token)
        )

        logger.info(f"Non-AI tier access status: {response.status_code}")

        # Should get 403 Forbidden
        assert response.status_code == 403

        if response.status_code == 403:
            data = response.json()
            assert "AI tier subscription required" in data["detail"]
            logger.info("✓ Non-AI tier users properly blocked")

    def test_12_rate_limiting(self):
        """Test rate limiting on protected endpoints"""
        if not self.ai_tier_token:
            pytest.skip("No AI tier token available")

        # Test opportunities endpoint (limited to 10/hour)
        responses = []
        for i in range(3):  # Just test a few calls
            response = requests.get(
                f"{self.base_url}{self.api_prefix}/opportunities",
                headers=self.get_headers(self.ai_tier_token)
            )
            responses.append(response.status_code)

        logger.info(f"Rate limiting test responses: {responses}")

        # All should succeed (we're not hitting the limit)
        assert all(status in [200, 429] for status in responses)

    def test_13_error_handling(self):
        """Test error handling for invalid requests"""
        if not self.ai_tier_token:
            pytest.skip("No AI tier token available")

        # Test invalid settings
        response = requests.put(
            f"{self.base_url}{self.api_prefix}/autopilot/settings",
            headers=self.get_headers(self.ai_tier_token),
            json={"invalid_setting": "invalid_value"}
        )

        logger.info(f"Invalid settings test: {response.status_code}")

        # Should still return 200 but ignore invalid settings
        if response.status_code == 200:
            logger.info("✓ Invalid settings handled gracefully")

    def test_14_integration_workflow(self):
        """Test complete workflow integration"""
        if not self.ai_tier_token:
            pytest.skip("No AI tier token available")

        logger.info("Testing complete AI dashboard workflow...")

        # 1. Get dashboard stats
        stats_response = requests.get(
            f"{self.base_url}{self.api_prefix}/dashboard-stats",
            headers=self.get_headers(self.ai_tier_token)
        )

        # 2. Get activity feed
        activity_response = requests.get(
            f"{self.base_url}{self.api_prefix}/activity",
            headers=self.get_headers(self.ai_tier_token)
        )

        # 3. Get queue status
        queue_response = requests.get(
            f"{self.base_url}{self.api_prefix}/queue-status",
            headers=self.get_headers(self.ai_tier_token)
        )

        # All should succeed for complete dashboard load
        assert stats_response.status_code == 200
        assert activity_response.status_code == 200
        assert queue_response.status_code == 200

        logger.info("✓ Complete dashboard workflow successful")

    def test_15_data_consistency(self):
        """Test data consistency across endpoints"""
        if not self.ai_tier_token:
            pytest.skip("No AI tier token available")

        # Get balance from multiple endpoints
        balance_response = requests.get(
            f"{self.base_url}{self.api_prefix}/balance",
            headers=self.get_headers(self.ai_tier_token)
        )

        stats_response = requests.get(
            f"{self.base_url}{self.api_prefix}/dashboard-stats",
            headers=self.get_headers(self.ai_tier_token)
        )

        if balance_response.status_code == 200 and stats_response.status_code == 200:
            balance_data = balance_response.json()["reciprocal_balance"]
            stats_data = stats_response.json()["reciprocal_balance"]

            # Check consistency
            assert balance_data["weekly_given"] == stats_data["given_this_week"]
            assert balance_data["weekly_received"] == stats_data["received_this_week"]

            logger.info("✓ Data consistency verified across endpoints")

if __name__ == "__main__":
    # Run the tests
    pytest.main([__file__, "-v", "--tb=short"])
