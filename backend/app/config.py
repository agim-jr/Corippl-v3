from pydantic_settings import BaseSettings
from pydantic import EmailStr, Field


class Settings(BaseSettings):
    DB_NAME: str = "echo_db"
    DB_USER: str = "echo_admin"
    DB_PASSWORD: str = "Junebug2025"
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432

    SECRET_KEY: str = "your-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # Changed from 120
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 10080  # Add this new line (7 days)

    RATE_LIMIT: str = "100/minute"  # Default rate limit

     # ✅ ADD THIS LINE:
    ENVIRONMENT: str = Field(default="development")  # Will use .env value if available



    # **FastAPI-Mail Configuration**
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: EmailStr
    MAIL_PORT: int
    MAIL_SERVER: str
    MAIL_STARTTLS: bool      # Renamed from MAIL_TLS
    MAIL_SSL_TLS: bool       # Renamed from MAIL_SSL

        # **Mailchimp Configuration**
    MAILCHIMP_API_KEY: str
    MAILCHIMP_SERVER_PREFIX: str  # e.g., 'us1'
    MAILCHIMP_LIST_ID: str
    MAILCHIMP_WEBHOOK_SECRET: str  # <-- Added Field

    WAITLIST_ENABLED: bool = False



    # **Frontend URL**
    FRONTEND_URL: str = "http://localhost:5173"  # Replace if different

        # **Stripe Configuration**
    STRIPE_SECRET_KEY: str
    STRIPE_PUBLISHABLE_KEY: str
    STRIPE_WEBHOOK_SECRET: str

    STRIPE_PRO_MONTHLY_PRICE_ID: str
    STRIPE_PRO_ANNUAL_PRICE_ID: str
    FREE_TRIAL_DAYS: int = 7

    # **Google OAuth Configuration**
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str

    # **AWS S3 Configuration**
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_S3_BUCKET_NAME: str
    AWS_S3_REGION: str = "us-east-1"
    MAX_FILE_SIZE_MB: int = 100

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        extra = "ignore"

settings = Settings()
