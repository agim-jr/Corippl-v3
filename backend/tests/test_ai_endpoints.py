# backend/tests/test_ai_endpoints.py
import requests
import json
import sys
from pathlib import Path
import urllib.parse

# Get the correct path to the backend directory if needed
current_file = Path(__file__).resolve()
tests_dir = current_file.parent
backend_dir = tests_dir.parent

# Add the backend directory to the Python path if needed
sys.path.append(str(backend_dir))

# Use the newly created test user credentials
BASE_URL = "http://localhost:8000"
USERNAME = "testuser_ai"
EMAIL = "testuser_ai@example.com"
PASSWORD = "Test123!"
USER_ID = 56  # The ID returned from create_test_user.py

def test_ai_endpoints():
    # Try all possible authentication endpoints and methods
    auth_endpoints = [
        "/api/auth/login",
        "/api/auth/token",
        "/auth/login",
        "/auth/token",
        "/token",
        "/login"
    ]

    auth_data = None
    token = None

    # Try all possible auth endpoints with different formats
    for endpoint in auth_endpoints:
        full_url = f"{BASE_URL}{endpoint}"
        print(f"\nTrying authentication at: {full_url}")

        # Method 1: JSON with username
        try:
            response = requests.post(
                full_url,
                json={"username": USERNAME, "password": PASSWORD}
            )
            print(f"JSON username method: {response.status_code}")
            if response.status_code == 200:
                auth_data = response.json()
                print("Authentication successful with JSON username!")
                break
        except Exception as e:
            print(f"Error: {str(e)}")

        # Method 2: JSON with email
        try:
            response = requests.post(
                full_url,
                json={"email": EMAIL, "password": PASSWORD}
            )
            print(f"JSON email method: {response.status_code}")
            if response.status_code == 200:
                auth_data = response.json()
                print("Authentication successful with JSON email!")
                break
        except Exception as e:
            print(f"Error: {str(e)}")

        # Method 3: Form data with username
        try:
            response = requests.post(
                full_url,
                data={"username": USERNAME, "password": PASSWORD}
            )
            print(f"Form username method: {response.status_code}")
            if response.status_code == 200:
                auth_data = response.json()
                print("Authentication successful with form username!")
                break
        except Exception as e:
            print(f"Error: {str(e)}")

        # Method 4: Form data with email
        try:
            response = requests.post(
                full_url,
                data={"email": EMAIL, "password": PASSWORD}
            )
            print(f"Form email method: {response.status_code}")
            if response.status_code == 200:
                auth_data = response.json()
                print("Authentication successful with form email!")
                break
        except Exception as e:
            print(f"Error: {str(e)}")

        # Method 5: URL encoded form data (for OAuth style endpoints)
        try:
            headers = {'Content-Type': 'application/x-www-form-urlencoded'}
            data = {
                'grant_type': 'password',
                'username': USERNAME,
                'password': PASSWORD
            }
            response = requests.post(
                full_url,
                headers=headers,
                data=urllib.parse.urlencode(data)
            )
            print(f"OAuth style method: {response.status_code}")
            if response.status_code == 200:
                auth_data = response.json()
                print("Authentication successful with OAuth style!")
                break
        except Exception as e:
            print(f"Error: {str(e)}")

    # If we still don't have auth data, try testing endpoints without authentication
    if not auth_data:
        print("\nAll authentication methods failed.")
        print("Let's test the endpoints without authentication to see what happens.")

        # Test insights endpoint without authentication
        print("\n=== Testing AI insights endpoint without authentication ===")
        insights_response = requests.get(f"{BASE_URL}/api/ai/insights/{USER_ID}")
        print(f"Status code: {insights_response.status_code}")

        if insights_response.status_code == 401:
            print("✓ Endpoint exists but requires authentication (expected)")
        elif insights_response.status_code == 404:
            print("✓ Endpoint doesn't exist (needs to be implemented)")
        else:
            print(f"Unexpected response: {insights_response.text}")

        # Test recommendations endpoint without authentication
        print("\n=== Testing AI recommendations endpoint without authentication ===")
        recommendations_response = requests.get(f"{BASE_URL}/api/ai/recommend")
        print(f"Status code: {recommendations_response.status_code}")

        if recommendations_response.status_code == 401:
            print("✓ Endpoint exists but requires authentication (expected)")
        elif recommendations_response.status_code == 404:
            print("✓ Endpoint doesn't exist (needs to be implemented)")
        else:
            print(f"Unexpected response: {recommendations_response.text}")

        # Test health-check endpoint without authentication
        print("\n=== Testing AI health-check endpoint without authentication ===")
        health_response = requests.get(f"{BASE_URL}/api/ai/health-check")
        print(f"Status code: {health_response.status_code}")

        if health_response.status_code == 401:
            print("✓ Endpoint exists but requires authentication (expected)")
        elif health_response.status_code == 404:
            print("✓ Endpoint doesn't exist (needs to be implemented)")
        else:
            print(f"Unexpected response: {health_response.text}")

        print("\nWe've confirmed which endpoints exist. Next step is to implement missing endpoints and fix authentication.")
        return

    # If we have auth data, extract token
    token = auth_data.get("access_token")
    if not token and "token" in auth_data:
        token = auth_data.get("token")

    if not token:
        print("No token available in the authentication response. Cannot proceed with testing protected endpoints.")
        return

    # Proceed with testing API endpoints using the token
    headers = {"Authorization": f"Bearer {token}"}

    # Test the AI insights endpoint
    print("\n=== Testing AI insights endpoint ===")
    insights_response = requests.get(
        f"{BASE_URL}/api/ai/insights/{USER_ID}",
        headers=headers
    )

    if insights_response.status_code == 200:
        insights = insights_response.json()
        print(json.dumps(insights, indent=2))

        # Validate the insights data structure
        validate_insights(insights)
    else:
        print(f"Failed to get AI insights: {insights_response.status_code} - {insights_response.text}")

    # Test content recommendations endpoint
    print("\n=== Testing AI content recommendations endpoint ===")
    recommendations_response = requests.get(
        f"{BASE_URL}/api/ai/recommend",
        headers=headers
    )

    if recommendations_response.status_code == 200:
        recommendations = recommendations_response.json()
        print(json.dumps(recommendations, indent=2))
    else:
        print(f"Failed to get recommendations: {recommendations_response.status_code} - {recommendations_response.text}")

    # Test AI dashboard stats endpoint
    print("\n=== Testing AI dashboard stats endpoint ===")
    stats_response = requests.get(
        f"{BASE_URL}/api/ai/health-check",
        headers=headers
    )

    if stats_response.status_code == 200:
        stats = stats_response.json()
        print(json.dumps(stats, indent=2))
    else:
        print(f"Failed to get AI dashboard stats: {stats_response.status_code} - {stats_response.text}")

    print("\nAPI endpoint tests completed!")

def validate_insights(insights):
    """Validate the structure of the insights response"""
    required_keys = [
        "status", "user_id", "content_performance",
        "content_recommendations", "scheduling_insights",
        "audience_insights", "trending_topics"
    ]

    missing_keys = [key for key in required_keys if key not in insights]

    if missing_keys:
        print(f"Warning: Insights response is missing these keys: {missing_keys}")
    else:
        print("✓ Insights response contains all required keys")

        # Check for best performing content type
        if "best_performing_type" in insights["content_performance"]:
            print(f"✓ Best performing content type: {insights['content_performance']['best_performing_type']}")

        # Check recommendations
        if insights["content_recommendations"]:
            print(f"✓ Found {len(insights['content_recommendations'])} content recommendations")

        # Check scheduling insights
        if "optimal_time_slots" in insights["scheduling_insights"]:
            print(f"✓ Optimal time slots: {insights['scheduling_insights']['optimal_time_slots']}")

        # Check trending topics
        if insights["trending_topics"]:
            print(f"✓ Found {len(insights['trending_topics'])} trending topics")

if __name__ == "__main__":
    test_ai_endpoints()
