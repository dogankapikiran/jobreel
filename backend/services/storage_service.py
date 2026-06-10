# backend/services/storage_service.py

from typing import Dict
from core.database import StorageRepository
from core.config import SUPABASE_URL, AVATARS_BUCKET, CVS_BUCKET

class StorageService:
    def __init__(self, db_repo: StorageRepository):
        self.db_repo = db_repo
        self.supabase_url = SUPABASE_URL

    async def get_avatar_upload_url(self, user_id: str, ext: str) -> Dict[str, str]:
        ext = ext if ext in ("jpg", "jpeg", "png", "webp") else "jpg"
        path = f"avatars/{user_id}.{ext}"
        res = await self.db_repo.create_signed_upload_url(AVATARS_BUCKET, path)
        signed_url = res.get("signedURL") or res.get("signed_url", "")
        public_url = f"{self.supabase_url}/storage/v1/object/public/{AVATARS_BUCKET}/{path}"
        return {"signedUrl": signed_url, "path": path, "publicUrl": public_url}

    async def get_cv_upload_url(self, user_id: str) -> Dict[str, str]:
        path = f"{user_id}/cv.pdf"
        try:
            await self.db_repo.remove_storage_files(CVS_BUCKET, [path])
        except Exception:
            pass
        res = await self.db_repo.create_signed_upload_url(CVS_BUCKET, path)
        signed_url = res.get("signedURL") or res.get("signed_url", "")
        return {"signedUrl": signed_url, "path": path}

    async def get_cv_signed_url(self, user_id: str) -> str:
        path = f"{user_id}/cv.pdf"
        res = await self.db_repo.create_signed_url(CVS_BUCKET, path, 300)
        url = res.get("signedURL") or res.get("signed_url", "")
        return url
