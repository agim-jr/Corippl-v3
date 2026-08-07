import pytest
import requests
import json
from datetime import datetime, timedelta
from typing import Dict, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TestAIDashboard:
    @classmethod
    def setup_class(cls):
        cls.base_url = "http://localhost:8000"
        cls.api_prefix = "/api/reciprocal-ai"
        
        cls.test_user = {
            "username": "testuser_ai",
            "password": "Test123!",
            "email": "testuser_ai@example.com"
        }
        
        cls.auth_token = None
        
    def authenticate_user(self, username, password):
        try:
            logger.info(f"[AUTH] Authenticating user: {username}")
            response = requests.post(
                f"{self.base_url}/auth/login",
                data={"username": username, "password": password},
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            logger.info(f"Authentication response: {response.status_code}")
            
            if response.status_code == 200:
                token_data = response.json()
                logger.info("[OK] Authentication successful")
                return token_data["access_token"]
            else:
                logger.error(f"[FAIL] Authentication failed: {response.text}")
                return None
        except Exception as e:
            logger.error(f"[FAIL] Authentication error: {e}")
            return None
    
    def get_headers(self):
        return {"Authorization": f"Bearer {self.__class__.auth_token}"}
    
    def test_01_server_connectivity(self):
        logger.info("[NET] Testing server connectivity...")
        
        try:
            response = requests.get(f"{self.base_url}/docs", timeout=5)
            logger.info(f"[OK] Server is running (status: {response.status_code})")
            assert response.status_code == 200
        except Exception as e:
            logger.error(f"[FAIL] Cannot connect to server: {e}")
            pytest.fail("Backend server is not running. Please start it first.")
    
    def test_02_authentication(self):
        logger.info("[AUTH] Testing authentication...")
        
        token = self.authenticate_user(
            self.test_user["username"], 
            self.test_user["password"]
        )
        
        if token:
            self.__class__.auth_token = token  # Store at class level
            logger.info("[OK] Authentication successful - token stored")
            assert token is not None
        else:
            logger.error("[FAIL] Authentication failed")
            pytest.fail("Authentication failed")
    
    def test_03_user_profile(self):
        if not self.__class__.auth_token:
            pytest.fail("No authentication token available")
        
        logger.info("[USER] Checking user profile...")
        
        try:
            response = requests.get(
                f"{self.base_url}/auth/me",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                user_data = response.json()
                logger.info("[OK] User Profile:")
                logger.info(f"   - ID: {user_data.get('id')}")
                logger.info(f"   - Username: {user_data.get('username')}")
                logger.info(f"   - Is AI Tier: {user_data.get('is_ai_tier', False)}")
                
                assert "id" in user_data
                assert user_data["username"] == self.test_user["username"]
            else:
                logger.error(f"[FAIL] Profile check failed: {response.text}")
                pytest.fail(f"Profile check failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"[FAIL] Profile check error: {e}")
            pytest.fail(f"Profile check error: {e}")
    
    def test_04_ai_health_check(self):
        if not self.__class__.auth_token:
            pytest.fail("No authentication token available")
        
        logger.info("[HEALTH] Testing AI health check...")
            
        try:
            response = requests.get(
                f"{self.base_url}{self.api_prefix}/health-check",
                headers=self.get_headers()
            )
            
            logger.info(f"Health check response: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                logger.info("[OK] AI Health Check Results:")
                logger.info(f"   - Service Status: {data.get('service_status')}")
                logger.info(f"   - User AI Tier: {data.get('is_ai_tier')}")
                logger.info(f"   - Autopilot Enabled: {data.get('autopilot_enabled')}")
                
                assert data["service_status"] == "healthy"
                assert "user_id" in data
                
            elif response.status_code == 403:
                logger.warning("[WARN] User doesn't have AI tier access")
                data = response.json()
                logger.info(f"Response: {data}")
                pytest.fail("User should have AI tier access but doesn't")
                
            else:
                logger.error(f"[FAIL] Health check failed: {response.text}")
                pytest.fail(f"Health check failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"[FAIL] Health check error: {e}")
            pytest.fail(f"Health check error: {e}")
    
    def test_05_dashboard_stats(self):
        if not self.__class__.auth_token:
            pytest.fail("No authentication token available")
        
        logger.info("[STATS] Testing dashboard stats...")
        
        try:
            response = requests.get(
                f"{self.base_url}{self.api_prefix}/dashboard-stats",
                headers=self.get_headers()
            )
            
            logger.info(f"Dashboard stats response: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                logger.info("[OK] Dashboard Stats Structure:")
                logger.info("   - Reciprocal Balance: OK")
                logger.info("   - Queue Status: OK")
                logger.info("   - AI Activity: OK")
                
                # Print the actual data structure
                logger.info(f"Data keys: {list(data.keys())}")
                
                # Verify structure matches frontend expectations
                assert "reciprocal_balance" in data
                assert "queue_status" in data
                assert "ai_activity" in data
                
            elif response.status_code == 403:
                logger.error("[FAIL] User doesn't have AI tier for dashboard")
                data = response.json()
                logger.info(f"403 Response: {data}")
                pytest.fail("User should have AI tier access for dashboard")
                
            else:
                logger.error(f"[FAIL] Dashboard stats failed: {response.text}")
                pytest.fail(f"Dashboard stats failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"[FAIL] Dashboard stats error: {e}")
            pytest.fail(f"Dashboard stats error: {e}")
    
    def test_06_autopilot_toggle(self):
        if not self.__class__.auth_token:
            pytest.fail("No authentication token available")
        
        logger.info("[AI] Testing autopilot toggle...")
        
        try:
            response = requests.post(
                f"{self.base_url}{self.api_prefix}/autopilot/toggle",
                headers=self.get_headers(),
                json={"enabled": True}
            )
            
            logger.info(f"Autopilot enable response: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"[OK] Autopilot enabled: {data.get('autopilot_enabled')}")
                assert data["autopilot_enabled"] == True
                
            elif response.status_code == 403:
                logger.error("[FAIL] User doesn't have AI tier for autopilot")
                data = response.json()
                logger.info(f"403 Response: {data}")
                pytest.fail("User should have AI tier access for autopilot")
                
            else:
                logger.error(f"[FAIL] Autopilot toggle failed: {response.text}")
                pytest.fail(f"Autopilot toggle failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"[FAIL] Autopilot error: {e}")
            pytest.fail(f"Autopilot error: {e}")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
