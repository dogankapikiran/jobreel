# backend/api/routers/storage.py

from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from api.dependencies import get_storage_service
from services.storage_service import StorageService

router = APIRouter()

@router.post("/api/profile/avatar-url")
async def avatar_url(
    body: dict,
    user: dict = Depends(get_current_user),
    storage_service: StorageService = Depends(get_storage_service)
):
    ext = body.get("ext", "jpg")
    res = await storage_service.get_avatar_upload_url(user["sub"], ext)
    return res

@router.post("/api/profile/cv-url")
async def cv_upload_url(
    user: dict = Depends(get_current_user),
    storage_service: StorageService = Depends(get_storage_service)
):
    res = await storage_service.get_cv_upload_url(user["sub"])
    return res

@router.get("/api/profile/cv-signed-url")
async def cv_signed_url(
    user: dict = Depends(get_current_user),
    storage_service: StorageService = Depends(get_storage_service)
):
    url = await storage_service.get_cv_signed_url(user["sub"])
    if not url:
        raise HTTPException(status_code=404, detail="CV bulunamadı")
    return {"signedUrl": url}
