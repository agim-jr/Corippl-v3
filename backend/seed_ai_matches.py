# seed_ai_matches.py
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import delete
from datetime import datetime, timedelta, timezone
import random

from app.database import Base
from app.models.user import User
from app.models.quick_connect import QuickConnectRequest, QuickConnectHelp, QuickConnectToken
from app.utils.security import hash_password
from app.config import settings

# Build async database URL
DATABASE_URL = f"postgresql+asyncpg://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"

# Sample data
SAMPLE_REQUESTS = [
    {
        "title": "Help with Python Programming Assignment",
        "description": "I need assistance with a data structures project using Python. Specifically working with trees and graphs. The assignment is due next week and I'm stuck on the implementation.",
        "category": "technical",
        "token_reward": 50,
        "tags": ["python", "data-structures", "programming", "algorithms"]
    },
    {
        "title": "Resume Review for Software Engineering Role",
        "description": "Looking for someone experienced in tech recruiting to review my resume. I'm applying for software engineering positions at major tech companies and want to make sure my resume stands out.",
        "category": "advice",
        "token_reward": 30,
        "tags": ["resume", "career", "software-engineering", "job-search"]
    },
    {
        "title": "Spanish Conversation Practice",
        "description": "Native Spanish speaker needed for conversation practice. I'm intermediate level (B1) and want to improve my fluency. Looking for 30-minute sessions 2-3 times per week.",
        "category": "other",
        "token_reward": 25,
        "tags": ["spanish", "language", "conversation", "tutoring"]
    },
    {
        "title": "Logo Design for Startup",
        "description": "Need a creative designer to help brainstorm and design a logo for my new tech startup. We're building an AI-powered productivity app. Looking for modern, minimalist design.",
        "category": "design",
        "token_reward": 75,
        "tags": ["design", "logo", "branding", "startup"]
    },
    {
        "title": "Statistics Homework Help",
        "description": "Struggling with hypothesis testing and confidence intervals. Need someone to explain the concepts and help me understand how to approach the problems, not just give answers.",
        "category": "advice",
        "token_reward": 40,
        "tags": ["statistics", "math", "homework", "tutoring"]
    },
    {
        "title": "Fitness and Nutrition Guidance",
        "description": "Looking for someone knowledgeable about fitness and nutrition to help me create a workout and meal plan. Goal is to lose 15 pounds in 3 months while building muscle.",
        "category": "advice",
        "token_reward": 60,
        "tags": ["fitness", "nutrition", "health", "wellness"]
    },
    {
        "title": "Business Plan Review",
        "description": "Completed my first draft of a business plan for a food delivery service. Need an experienced entrepreneur or business advisor to review and provide feedback.",
        "category": "feedback",
        "token_reward": 80,
        "tags": ["business", "entrepreneurship", "startup", "planning"]
    },
    {
        "title": "React.js Project Debugging",
        "description": "My React app has a state management issue that I can't figure out. Using Redux and getting weird rendering behaviors. Need someone experienced with React hooks and Redux.",
        "category": "technical",
        "token_reward": 55,
        "tags": ["react", "javascript", "redux", "debugging"]
    },
    {
        "title": "Interview Preparation for Consulting",
        "description": "Have interviews coming up with top consulting firms. Need help with case interview practice and behavioral questions. Looking for someone with consulting experience.",
        "category": "advice",
        "token_reward": 70,
        "tags": ["consulting", "interview", "career", "case-study"]
    },
    {
        "title": "Photography Tips for Beginners",
        "description": "Just bought my first DSLR camera and want to learn the basics. Looking for someone to explain aperture, shutter speed, ISO, and composition in simple terms.",
        "category": "advice",
        "token_reward": 35,
        "tags": ["photography", "camera", "learning", "beginner"]
    },
    {
        "title": "Machine Learning Model Optimization",
        "description": "Built a CNN for image classification but accuracy is stuck at 75%. Need help with hyperparameter tuning and architecture improvements. Using PyTorch.",
        "category": "technical",
        "token_reward": 90,
        "tags": ["machine-learning", "deep-learning", "pytorch", "ai"]
    },
    {
        "title": "Public Speaking Coaching",
        "description": "Presenting my research at a conference next month and I'm terrified. Need help with presentation skills, managing anxiety, and engaging the audience.",
        "category": "advice",
        "token_reward": 45,
        "tags": ["public-speaking", "presentation", "communication", "coaching"]
    },
]

SAMPLE_HELPERS = [
    {
        "username": "CodeMaster_AI",
        "email": "codemaster@example.com",
        "skills": ["python", "javascript", "algorithms", "data-structures"]
    },
    {
        "username": "CareerGuru_Pro",
        "email": "careerguru@example.com",
        "skills": ["resume-review", "interview-prep", "career-coaching"]
    },
    {
        "username": "SpanishTutor_Maria",
        "email": "maria@example.com",
        "skills": ["spanish", "language-teaching", "conversation"]
    },
    {
        "username": "DesignWizard_Alex",
        "email": "alexdesign@example.com",
        "skills": ["logo-design", "branding", "ui-ux"]
    },
    {
        "username": "StatsProf_Johnson",
        "email": "statsprof@example.com",
        "skills": ["statistics", "probability", "data-analysis"]
    },
    {
        "username": "FitCoach_Sarah",
        "email": "fitcoach@example.com",
        "skills": ["fitness", "nutrition", "weight-loss"]
    },
    {
        "username": "BizMentor_David",
        "email": "bizmentor@example.com",
        "skills": ["business-planning", "entrepreneurship", "strategy"]
    },
    {
        "username": "ReactNinja_Tom",
        "email": "reactninja@example.com",
        "skills": ["react", "redux", "javascript", "debugging"]
    },
    {
        "username": "ConsultingPro_Emma",
        "email": "consultingpro@example.com",
        "skills": ["consulting", "case-interviews", "strategy"]
    },
    {
        "username": "PhotoPro_Mike",
        "email": "photopro@example.com",
        "skills": ["photography", "camera-basics", "composition"]
    },
    {
        "username": "MLExpert_Sophia",
        "email": "mlexpert@example.com",
        "skills": ["machine-learning", "deep-learning", "pytorch"]
    },
    {
        "username": "SpeakEasy_Coach",
        "email": "speakeasy@example.com",
        "skills": ["public-speaking", "presentation", "communication"]
    },
]

HELPER_RESPONSES = [
    "I'd be happy to help with this! I have extensive experience in this area and can guide you through the process step by step.",
    "This sounds like a great project! I've worked on similar challenges before and would love to contribute my expertise.",
    "I'm definitely interested in helping! Let me know when would be a good time to connect and discuss the details.",
    "I have some ideas that might help solve this problem. Happy to share my experience and insights with you!",
    "This is right up my alley! I've helped many people with similar requests and gotten great feedback.",
    "I'd love to help! I think my background in this area would be a perfect fit for what you're looking for.",
    "Count me in! I have some time this week and would be glad to contribute to this.",
    "I'm available to help and confident I can add value. Let's discuss how we can best work together!",
]

async def clear_quick_connect_data(session: AsyncSession):
    """Clear all QuickConnect data and seeded users"""
    print("\n🗑️  Clearing existing QuickConnect data...")

    # Get all helper and requester usernames to delete
    helper_usernames = [h["username"] for h in SAMPLE_HELPERS]
    requester_prefix = "student_"

    # Delete in correct order (respecting foreign keys)
    print("   ⏳ Deleting help responses...")
    await session.execute(delete(QuickConnectHelp))

    print("   ⏳ Deleting requests...")
    await session.execute(delete(QuickConnectRequest))

    print("   ⏳ Deleting token balances...")
    await session.execute(delete(QuickConnectToken))

    print("   ⏳ Deleting seeded users...")
    # Delete helper users
    await session.execute(
        delete(User).where(User.username.in_(helper_usernames))
    )
    # Delete requester users (students)
    await session.execute(
        delete(User).where(User.username.like(f"{requester_prefix}%"))
    )

    await session.commit()
    print("   ✅ All QuickConnect data cleared\n")

async def create_helper_users(session: AsyncSession):
    """Create helper users with token balances"""
    created_users = []

    for helper_data in SAMPLE_HELPERS:
        user = User(
            username=helper_data["username"],
            email=helper_data["email"],
            password=hash_password("password123"),
            skills=helper_data["skills"],
            is_active=True,
            has_profile_completed=True
        )
        session.add(user)
        await session.flush()

        token_balance = QuickConnectToken(
            user_id=user.id,
            balance=random.randint(50, 200),
            lifetime_earned=random.randint(100, 500),
            lifetime_spent=random.randint(50, 200),
            reputation_score=round(random.uniform(7.0, 9.5), 1),
            help_given_count=random.randint(10, 50),
            help_received_count=random.randint(5, 20),
            average_rating=round(random.uniform(4.0, 5.0), 1),
            total_ratings=random.randint(10, 50)
        )
        session.add(token_balance)

        created_users.append(user)

    await session.commit()

    for user in created_users:
        await session.refresh(user)

    return created_users

async def create_requester_users(session: AsyncSession, count: int):
    """Create requester users"""
    created_users = []

    for i in range(count):
        user = User(
            username=f"student_{random.randint(1000, 9999)}",
            email=f"student{random.randint(1000, 9999)}@example.com",
            password=hash_password("password123"),
            interests=["learning", "education"],
            is_active=True,
            has_profile_completed=True
        )
        session.add(user)
        await session.flush()

        token_balance = QuickConnectToken(
            user_id=user.id,
            balance=random.randint(100, 500),
            lifetime_earned=random.randint(50, 200),
            lifetime_spent=random.randint(20, 150),
            reputation_score=round(random.uniform(5.0, 8.0), 1),
            help_given_count=random.randint(0, 10),
            help_received_count=random.randint(5, 20),
            average_rating=round(random.uniform(3.5, 5.0), 1),
            total_ratings=random.randint(5, 20)
        )
        session.add(token_balance)

        created_users.append(user)

    await session.commit()

    for user in created_users:
        await session.refresh(user)

    return created_users

async def create_requests(session: AsyncSession, requesters: list):
    """Create Quick Connect requests"""
    created_requests = []

    for req_data in SAMPLE_REQUESTS:
        requester = random.choice(requesters)
        hours_ago = random.randint(1, 168)
        created_time = datetime.now(timezone.utc) - timedelta(hours=hours_ago)

        request = QuickConnectRequest(
            requester_id=requester.id,
            title=req_data["title"],
            description=req_data["description"],
            category=req_data["category"],
            tags=req_data["tags"],
            token_reward=req_data["token_reward"],
            status="open",
            urgency=random.choice(["low", "normal", "high"]),
            view_count=random.randint(5, 50),
            help_count=0,
            match_score=round(random.uniform(0.6, 0.95), 2),
            created_at=created_time,
            expires_at=datetime.now(timezone.utc) + timedelta(days=random.randint(7, 30))
        )
        session.add(request)
        created_requests.append(request)

    await session.commit()

    for req in created_requests:
        await session.refresh(req)

    return created_requests

async def create_help_responses(session: AsyncSession, requests: list, helpers: list):
    """Create help responses for some requests"""
    created_responses = []

    for request in requests:
        num_responses = random.randint(1, 3)
        selected_helpers = random.sample(helpers, min(num_responses, len(helpers)))

        for i, helper in enumerate(selected_helpers):
            hours_after_request = random.randint(1, 24)

            help_response = QuickConnectHelp(
                request_id=request.id,
                helper_id=helper.id,
                message=random.choice(HELPER_RESPONSES),
                status="pending",
                created_at=request.created_at + timedelta(hours=hours_after_request)
            )

            if i == 0 and random.random() < 0.3:
                help_response.status = "accepted"
                help_response.accepted_at = help_response.created_at + timedelta(hours=2)
                help_response.tokens_awarded = request.token_reward

                if random.random() < 0.5:
                    help_response.status = "completed"
                    help_response.completed_at = help_response.accepted_at + timedelta(days=random.randint(1, 5))
                    help_response.rating = random.randint(4, 5)
                    help_response.feedback = "Great help! Very knowledgeable and patient."
                    request.status = "completed"
                    request.completed_at = help_response.completed_at

            session.add(help_response)
            created_responses.append(help_response)

        request.help_count = num_responses

    await session.commit()

    return created_responses

async def seed_database():
    """Main seeding function"""
    print(f"\n🌱 Starting database seeding...")
    print(f"🔗 Connecting to: postgresql://{settings.DB_USER}:***@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}\n")

    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with async_session() as session:
            print("✅ Database connection successful")

            # Clear existing data first
            await clear_quick_connect_data(session)

            # Step 1: Create helper users
            print("👥 Creating helper users...")
            helpers = await create_helper_users(session)
            print(f"   ✓ Created {len(helpers)} helper users")

            # Step 2: Create requester users
            print("\n👤 Creating requester users...")
            requesters = await create_requester_users(session, count=len(SAMPLE_REQUESTS))
            print(f"   ✓ Created {len(requesters)} requester users")

            # Step 3: Create requests
            print("\n📝 Creating Quick Connect requests...")
            requests = await create_requests(session, requesters)
            print(f"   ✓ Created {len(requests)} requests")

            # Step 4: Create help responses
            print("\n💬 Creating help responses...")
            responses = await create_help_responses(session, requests, helpers)
            print(f"   ✓ Created {len(responses)} help responses")

            # Print summary
            print("\n" + "="*60)
            print("🎉 SEEDING COMPLETED SUCCESSFULLY!")
            print("="*60)
            print(f"\n📊 Summary:")
            print(f"   • Helper Users: {len(helpers)}")
            print(f"   • Requester Users: {len(requesters)}")
            print(f"   • Quick Connect Requests: {len(requests)}")
            print(f"   • Help Responses: {len(responses)}")
            print(f"\n💡 Test Login Credentials:")
            print(f"   - Any helper: username / password: 'password123'")
            print(f"   - Any requester: student_XXXX / password: 'password123'")
            print(f"\n📋 Sample Usernames:")
            print(f"   - Helpers: CodeMaster_AI, CareerGuru_Pro, SpanishTutor_Maria...")
            print(f"   - Requesters: Check console output above for student_XXXX usernames")
            print("\n")

    except Exception as e:
        print(f"\n❌ Error during seeding: {str(e)}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_database())
