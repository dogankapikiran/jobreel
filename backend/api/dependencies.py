from fastapi import Request
from core.database import DatabaseRepository
from core.ai_client import AIClient
from core.notifier import PushNotifier
from services.job_service import JobService
from services.cv_service import CvService
from services.alert_service import AlertService
from services.storage_service import StorageService
from services.profile_service import ProfileService

def get_db_repository(request: Request) -> DatabaseRepository:
    return request.app.state.db_repo

def get_ai_client(request: Request) -> AIClient:
    return request.app.state.ai_client

def get_push_notifier(request: Request) -> PushNotifier:
    return request.app.state.notifier

def get_job_service(request: Request) -> JobService:
    return request.app.state.job_service

def get_cv_service(request: Request) -> CvService:
    return request.app.state.cv_service

def get_alert_service(request: Request) -> AlertService:
    return request.app.state.alert_service

def get_storage_service(request: Request) -> StorageService:
    return request.app.state.storage_service

def get_profile_service(request: Request) -> ProfileService:
    return request.app.state.profile_service

