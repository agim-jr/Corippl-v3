# populate_db.py

import requests
import logging

API_URL = "http://127.0.0.1:8000"  # Ensure this matches your FastAPI server URL

# Configure Logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Sample data for users, profiles, and content
users = [
    {
        "username": "alice",
        "email": "alice@example.com",
        "password": "Password123!",
        "profile": {
            "name": "Alice Wonderland",
            "bio": "Loves exploring technology and AI.",
            "categories": ["Technology", "Science"],
            "interests": ["AI", "Blockchain"]
        },
        "contents": [
            {
                "title": "Introduction to AI",
                "description": "A beginner's guide to Artificial Intelligence.",
                "url": "https://example.com/ai-intro",
                "content_type": "Technology"
            },
            {
                "title": "Blockchain Basics",
                "description": "Understanding the fundamentals of Blockchain.",
                "url": "https://example.com/blockchain-basics",
                "content_type": "Technology"
            }
        ]
    },
    {
        "username": "bob",
        "email": "bob@example.com",
        "password": "Password123!",
        "profile": {
            "name": "Bob Builder",
            "bio": "Passionate about Health and Nutrition.",
            "categories": ["Health", "Business"],
            "interests": ["Nutrition", "Fitness"]
        },
        "contents": [
            {
                "title": "Healthy Eating Habits",
                "description": "Tips for maintaining a balanced diet.",
                "url": "https://example.com/healthy-eating",
                "content_type": "Health"
            },
            {
                "title": "Fitness Routines for Busy People",
                "description": "Effective workouts you can do anytime.",
                "url": "https://example.com/fitness-routines",
                "content_type": "Health"
            }
        ]
    },
    {
        "username": "charlie",
        "email": "charlie@example.com",
        "password": "Password123!",
        "profile": {
            "name": "Charlie Chaplin",
            "bio": "Avid enthusiast of Art and Photography.",
            "categories": ["Art", "Science"],
            "interests": ["Painting", "Biology"]
        },
        "contents": [
            {
                "title": "Digital Painting Techniques",
                "description": "Advanced methods for digital artists.",
                "url": "https://example.com/digital-painting",
                "content_type": "Art"
            },
            {
                "title": "Biology Basics",
                "description": "An introduction to Biology.",
                "url": "https://example.com/biology-basics",
                "content_type": "Science"
            }
        ]
    },
    # Add more users as needed
]

def register_user(user_data):
    url = f"{API_URL}/auth/register"
    response = requests.post(url, json={
        "username": user_data["username"],
        "email": user_data["email"],
        "password": user_data["password"]
    })
    if response.status_code == 201:
        logger.info(f"User '{user_data['username']}' registered successfully.")
        return response.json().get("access_token")
    else:
        logger.error(f"Failed to register user '{user_data['username']}': {response.text}")
        return None

def create_profile(token, profile_data):
    url = f"{API_URL}/profiles/"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    response = requests.post(url, json=profile_data, headers=headers)
    if response.status_code == 201:
        logger.info(f"Profile for '{profile_data['name']}' created successfully.")
    else:
        logger.error(f"Failed to create profile for '{profile_data['name']}': {response.text}")

def submit_content(token, content):
    url = f"{API_URL}/content/"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    response = requests.post(url, json=content, headers=headers)
    if response.status_code == 201:
        logger.info(f"Content '{content['title']}' submitted successfully.")
    else:
        logger.error(f"Failed to submit content '{content['title']}': {response.text}")

def main():
    for user in users:
        logger.info(f"Processing user: {user['username']}")
        token = register_user(user)
        if token:
            # Create Profile
            create_profile(token, user["profile"])

            # Submit Content
            for content in user["contents"]:
                submit_content(token, content)
        logger.info("-" * 50)

if __name__ == "__main__":
    main()
