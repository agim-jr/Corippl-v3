# backend/tests/create_test_user.py
import sys
import os
from pathlib import Path
from sqlalchemy import create_engine, text
import bcrypt

# Get the correct path to the backend directory
current_file = Path(__file__).resolve()
tests_dir = current_file.parent
backend_dir = tests_dir.parent

# Add the backend directory to the Python path
sys.path.append(str(backend_dir))

# Database connection string - using environment variables or default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://echo_admin:Junebug2025@localhost:5432/echo_db")

# Test user credentials
TEST_USERNAME = "testuser_ai"
TEST_EMAIL = "testuser_ai@example.com"
TEST_PASSWORD = "Test123!"  # Clear text password

def create_test_user():
    try:
        # Connect to the database
        engine = create_engine(DATABASE_URL)

        with engine.connect() as conn:
            print("Connected to database successfully!")

            # Check if user already exists
            user_exists = conn.execute(
                text("SELECT id FROM users WHERE username = :username OR email = :email"),
                {"username": TEST_USERNAME, "email": TEST_EMAIL}
            ).fetchone()

            if user_exists:
                print(f"User already exists with ID: {user_exists[0]}")
                print(f"Username: {TEST_USERNAME}")
                print(f"Email: {TEST_EMAIL}")
                print(f"Password: {TEST_PASSWORD}")
                user_id = user_exists[0]
            else:
                # Hash the password (using bcrypt)
                hashed_password = bcrypt.hashpw(TEST_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

                # Insert the new user
                result = conn.execute(
                    text("""
                    INSERT INTO users (
                        username, email, password, share_count, has_profile_completed,
                        is_admin, is_premium, daily_share_count
                    ) VALUES (
                        :username, :email, :password, 0, true,
                        false, true, 0
                    ) RETURNING id
                    """),
                    {
                        "username": TEST_USERNAME,
                        "email": TEST_EMAIL,
                        "password": hashed_password
                    }
                )

                # Get the ID of the newly created user
                user_id = result.fetchone()[0]

                # Commit the transaction
                conn.commit()

                print(f"Created new test user:")
                print(f"ID: {user_id}")
                print(f"Username: {TEST_USERNAME}")
                print(f"Email: {TEST_EMAIL}")
                print(f"Password: {TEST_PASSWORD}")

            # Check if profile exists for this user
            profile_exists = conn.execute(
                text("SELECT id FROM profiles WHERE user_id = :user_id"),
                {"user_id": user_id}
            ).fetchone()

            if profile_exists:
                print(f"Profile already exists for user with ID: {profile_exists[0]}")
            else:
                # First, check what columns exist in the profiles table
                columns = conn.execute(
                    text("SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles'")
                ).fetchall()
                column_names = [col[0] for col in columns]
                print(f"Available columns in profiles table: {column_names}")

                # Create the profile based on the columns that exist
                try:
                    # Basic required fields
                    query_parts = [
                        "user_id = :user_id"
                    ]
                    params = {
                        "user_id": user_id
                    }

                    # Add fields based on what's available in the database
                    if "name" in column_names:
                        query_parts.append("name = :name")
                        params["name"] = "Test AI User"

                    if "bio" in column_names:
                        query_parts.append("bio = :bio")
                        params["bio"] = "This is an AI test user for API testing"

                    if "categories" in column_names:
                        query_parts.append("categories = :categories")
                        params["categories"] = ["AI", "Testing", "Automation"]

                    if "interests" in column_names:
                        query_parts.append("interests = :interests")
                        params["interests"] = ["Machine Learning", "API Testing", "DevOps"]

                    # Construct the SQL query
                    query = f"""
                    INSERT INTO profiles (
                        {', '.join(k for k in params.keys())}
                    ) VALUES (
                        {', '.join(':' + k for k in params.keys())}
                    ) RETURNING id
                    """

                    profile_result = conn.execute(text(query), params)
                    profile_id = profile_result.fetchone()[0]
                    conn.commit()
                    print(f"Created profile for user with ID: {profile_id}")
                except Exception as e:
                    print(f"Failed to create profile: {str(e)}")
                    print(f"Query attempted: {query}")
                    print(f"Parameters: {params}")

            return user_id

    except Exception as e:
        print(f"Error creating test user: {str(e)}")
        return None

if __name__ == "__main__":
    create_test_user()
