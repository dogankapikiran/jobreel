import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from auth import get_current_user
from api.dependencies import get_profile_service, get_cv_service
from api.limiter import limiter
from services.profile_service import ProfileService
from services.cv_service import CvService

logger = logging.getLogger(__name__)

router = APIRouter()

class ProfileUpdate(BaseModel):
    display_name: str | None = None
    title: str | None = None
    preferences: dict | None = None
    skills: list[str] | None = None
    avatar_url: str | None = None
    cv_url: str | None = None

class PushTokenUpdate(BaseModel):
    token: str

class NotifPrefsUpdate(BaseModel):
    notif_follow: bool | None = None
    notif_job_alerts: bool | None = None


@router.get("/api/profile")
async def get_profile(
    user: dict = Depends(get_current_user),
    profile_service: ProfileService = Depends(get_profile_service)
):
    return await profile_service.get_profile(user["sub"])


@router.put("/api/profile")
@limiter.limit("30/minute")
async def update_profile(
    request: Request,
    body: ProfileUpdate,
    user: dict = Depends(get_current_user),
    profile_service: ProfileService = Depends(get_profile_service)
):
    update_data = body.model_dump(exclude_none=True)
    await profile_service.update_profile(user["sub"], update_data)
    return {"success": True}


@router.put("/api/profile/push-token")
async def save_push_token(
    body: PushTokenUpdate,
    user: dict = Depends(get_current_user),
    profile_service: ProfileService = Depends(get_profile_service)
):
    try:
        await profile_service.save_push_token(user["sub"], body.token)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Push token kaydedilemedi")
    return {"success": True}


@router.post("/api/profile/cv-parse")
@limiter.limit("5/hour")
async def parse_cv(
    request: Request,
    user: dict = Depends(get_current_user),
    cv_service: CvService = Depends(get_cv_service)
):
    if not cv_service.ai_client.client:
        raise HTTPException(status_code=503, detail="AI parse not configured")
    try:
        parsed = await cv_service.parse_cv_for_user(user["sub"])
        return {"success": True, "parsed": parsed}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        if "sınırını aşıyor" in str(e):
            raise HTTPException(status_code=413, detail=str(e))
        else:
            raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error("[CV Parse] error for %s: %s", user['sub'][:8], e)
        raise HTTPException(status_code=500, detail="CV parse işlemi başarısız oldu")


@router.put("/api/profile/notif-prefs")
async def update_notif_prefs(
    body: NotifPrefsUpdate,
    user: dict = Depends(get_current_user),
    profile_service: ProfileService = Depends(get_profile_service)
):
    update_data = body.model_dump(exclude_none=True)
    await profile_service.update_notif_prefs(user["sub"], update_data)
    return {"success": True}


class ErrorLogBody(BaseModel):
    error: str
    stack: str | None = None
    userInfo: dict | None = None
    deviceInfo: dict | None = None

@router.post("/api/log/error")
async def log_error(body: ErrorLogBody):
    logger.error(
        "[Frontend Crash] Error: %s\nStack: %s\nUser Info: %s\nDevice Info: %s",
        body.error,
        body.stack,
        body.userInfo,
        body.deviceInfo
    )
    return {"success": True}
