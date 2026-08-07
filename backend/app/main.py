# backend/app/main.py

from fastapi import FastAPI, Request
from .api import api_router
from .database import engine, SessionLocal
from .models import Base
from fastapi.middleware.cors import CORSMiddleware
from .utils.scheduler import start_scheduler
import logging
from contextlib import contextmanager

from .utils.rate_limiter import limiter
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse

from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from .config import settings

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to all responses"""
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response


app = FastAPI(
    title="Corippl API",
    description="Content Cross-Promotion Platform API",
    version="1.0.0"
)

# Configure Rate Limiter
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# CORS Configuration
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://corippl.com",
    "https://www.corippl.com",
]

if settings.ENVIRONMENT == "production":
    allowed_origins.extend([
        "https://corippl.com",
        "https://www.corippl.com",
        "https://api.corippl.com"
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SecurityHeadersMiddleware)

if settings.ENVIRONMENT == "production":
    app.add_middleware(HTTPSRedirectMiddleware)
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["corippl.com", "www.corippl.com", "api.corippl.com"]
    )


@contextmanager
def get_db_session():
    """Context manager for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."},
    )


app.include_router(api_router)


@app.on_event("startup")
async def on_startup():
    """Initialize application services on startup"""
    try:
        Base.metadata.create_all(bind=engine)
        start_scheduler()  # ✅ ADD THIS LINE - Actually start the scheduler!
        logger.info("✅ Application startup complete with autopilot scheduler!")
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}", exc_info=True)
        raise


@app.on_event("shutdown")
async def on_shutdown():
    """Clean shutdown of background services"""
    logger.info("✅ Application shutdown")


@app.get("/")
def home():
    return {"message": "Corippl API is running!", "status": "healthy"}


@app.get("/favicon.ico")
def favicon():
    return {"message": "Favicon not found"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Corippl API"}
