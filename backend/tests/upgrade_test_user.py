import sys
import os
from pathlib import Path
from sqlalchemy import create_engine, text

# Get the correct path to the backend directory
current_file = Path(__file__).resolve()
tests_dir = current_file.parent
backend_dir = tests_dir.parent
sys.path.append(str(backend_dir))

DATABASE_URL = "postgresql://echo_admin:Junebug2025@localhost:5432/echo_db"

def upgrade_test_user():
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            # Update test user to be AI tier
            result = conn.execute(
                text("UPDATE users SET is_ai_tier = true, autopilot_enabled = false WHERE username = 'testuser_ai' RETURNING id, is_ai_tier, autopilot_enabled"),
            )
            
            user = result.fetchone()
            if user:
                conn.commit()
                print(f"✓ User 'testuser_ai' upgraded:")
                print(f"  - ID: {user[0]}")
                print(f"  - AI Tier: {user[1]}")
                print(f"  - Autopilot: {user[2]}")
            else:
                print("✗ User 'testuser_ai' not found")
                
    except Exception as e:
        print(f"Error upgrading user: {e}")

if __name__ == "__main__":
    upgrade_test_user()
