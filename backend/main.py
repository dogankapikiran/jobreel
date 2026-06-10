from dotenv import load_dotenv
# Load environment variables first
load_dotenv()

import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from supabase import create_client
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from api.limiter import limiter
from infrastructure.supabase_repo import SupabaseDatabaseRepository
from infrastructure.groq_client import GroqAIClient
from infrastructure.expo_notifier import ExpoPushNotifier
from services.job_service import JobService
from services.cv_service import CvService
from services.alert_service import AlertService
from services.storage_service import StorageService
from services.profile_service import ProfileService
from services.interaction_service import InteractionService
from services.company_service import CompanyService
from services.alert_runners import DailyAlertRunner, CompanyAlertRunner
from api.routers import feed, profile, interaction, alert, company, storage
from core.config import CORS_ORIGINS

SUPABASE_URL = os.getenv("SUPABASE_URL", "") or os.getenv("EXPO_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "") or os.getenv("EXPO_PUBLIC_SUPABASE_ANON_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Initialize Scheduler
scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize concrete Supabase Client
    supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    # 2. Instantiate concrete infrastructure repositories and adapters
    db_repo = SupabaseDatabaseRepository(supabase_client)
    ai_client = GroqAIClient(GROQ_API_KEY)
    notifier = ExpoPushNotifier()
    
    # 3. Instantiate business services
    job_service = JobService(db_repo, ai_client)
    cv_service = CvService(db_repo, ai_client)
    alert_service = AlertService(db_repo)
    storage_service = StorageService(db_repo)
    profile_service = ProfileService(db_repo)
    interaction_service = InteractionService(db_repo)
    company_service = CompanyService(db_repo)

    # 4. Bind instances to app.state for dependency injection via request.app.state
    app.state.db_repo = db_repo
    app.state.ai_client = ai_client
    app.state.notifier = notifier
    app.state.job_service = job_service
    app.state.cv_service = cv_service
    app.state.alert_service = alert_service
    app.state.storage_service = storage_service
    app.state.profile_service = profile_service
    app.state.interaction_service = interaction_service
    app.state.company_service = company_service

    # 5. Instantiate scheduler runners (separate from AlertService — SRP)
    daily_runner = DailyAlertRunner(db_repo, notifier)
    company_runner = CompanyAlertRunner(db_repo, notifier)

    async def daily_alerts_job():
        await daily_runner.run()

    async def company_alerts_job():
        await company_runner.run()

    # Register scheduled tasks (09:00 and 10:00 Turkey Time)
    scheduler.add_job(daily_alerts_job, "cron", hour=6, minute=0, timezone="UTC")
    scheduler.add_job(company_alerts_job, "cron", hour=7, minute=0, timezone="UTC")
    scheduler.start()
    
    yield
    
    # Shutdown scheduler
    scheduler.shutdown()

# Instantiate FastAPI App
app = FastAPI(title="JobReel API", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# Mount Routers
app.include_router(feed.router)
app.include_router(profile.router)
app.include_router(storage.router)
app.include_router(interaction.router)
app.include_router(alert.router)
app.include_router(company.router)

# Health Check Uç Noktası
@app.get("/health")
async def health():
    return {"status": "ok"}
