"""
Seed The Pool with high-quality curated content
"""
import os
import sys
from sqlalchemy import text
from dotenv import load_dotenv

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from app.database import SessionLocal
from app.models.user import User
from app.utils.security import hash_password

def seed_pool():
    """Seed the pool with curated content"""

    db = SessionLocal()

    try:
        print("🌱 Starting pool seeding...")

        # First, create curator accounts with proper password hashing
        print("\n📝 Creating curator accounts...")

        curators = [
            {
                'username': 'staff_curator',
                'email': 'curator@thepool.internal',
                'password': hash_password('CuratorPass2026!'),
                'is_admin': False,
                'email_verified': True,
                'unlock_credits': 1000  # Give curator more credits
            },
            {
                'username': 'tech_enthusiast',
                'email': 'tech@thepool.internal',
                'password': hash_password('TechPass2026!'),
                'is_admin': False,
                'email_verified': True,
                'unlock_credits': 500
            },
            {
                'username': 'design_maven',
                'email': 'design@thepool.internal',
                'password': hash_password('DesignPass2026!'),
                'is_admin': False,
                'email_verified': True,
                'unlock_credits': 500
            },
            {
                'username': 'product_builder',
                'email': 'product@thepool.internal',
                'password': hash_password('ProductPass2026!'),
                'is_admin': False,
                'email_verified': True,
                'unlock_credits': 500
            },
            {
                'username': 'content_explorer',
                'email': 'explorer@thepool.internal',
                'password': hash_password('ExplorerPass2026!'),
                'is_admin': False,
                'email_verified': True,
                'unlock_credits': 500
            }
        ]

        for curator_data in curators:
            # Check if user already exists
            existing_user = db.query(User).filter(User.email == curator_data['email']).first()
            if not existing_user:
                user = User(**curator_data)
                db.add(user)
                print(f"  ✅ Created {curator_data['username']}")
            else:
                print(f"  ⏭️  {curator_data['username']} already exists")

        db.commit()
        print("\n✅ Curator accounts created!")

        # Now run the SQL file
        print("\n📚 Loading pool submissions...")

        # Read SQL file
        sql_file_path = os.path.join(os.path.dirname(__file__), 'seed_pool.sql')

        if not os.path.exists(sql_file_path):
            print(f"\n❌ SQL file not found at: {sql_file_path}")
            print("Please make sure seed_pool.sql exists in the backend directory.")
            return

        with open(sql_file_path, 'r', encoding='utf-8') as f:
            sql_script = f.read()

        # Execute SQL
        try:
            db.execute(text(sql_script))
            db.commit()
        except Exception as sql_error:
            print(f"\n❌ Error executing SQL: {str(sql_error)}")
            db.rollback()
            raise

        print("\n🎉 Pool seeding complete!")
        print("\n📊 Summary:")
        print("  - 5 curator accounts created")
        print("  - 75+ high-quality links added to The Pool")
        print("  - All submissions approved and ready to claim")
        print("\n🔑 Curator Login Credentials:")
        print("  staff_curator / CuratorPass2026!")
        print("  tech_enthusiast / TechPass2026!")
        print("  design_maven / DesignPass2026!")
        print("  product_builder / ProductPass2026!")
        print("  content_explorer / ExplorerPass2026!")
        print("\n⚠️  IMPORTANT: Change these passwords in production!")

    except Exception as e:
        print(f"\n❌ Error seeding pool: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_pool()
