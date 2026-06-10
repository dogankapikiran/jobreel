import logging
from typing import Any, Dict, List, Optional
from supabase import Client
from core.database import (
    ProfileRepository,
    JobRepository,
    InteractionRepository,
    AlertRepository,
    StorageRepository,
    DatabaseRepository,
    DatabaseError
)

logger = logging.getLogger(__name__)


class SupabaseBaseRepository:
    def __init__(self, client: Client):
        self.client = client


class SupabaseProfileRepository(SupabaseBaseRepository, ProfileRepository):
    async def get_profiles_by_ids(self, user_ids: List[str], fields: str) -> List[Dict[str, Any]]:
        try:
            res = self.client.table("profiles").select(fields).in_("id", user_ids).execute()
            return res.data or []
        except Exception as e:
            logger.exception("[SupabaseProfileRepository] get_profiles_by_ids error: %s", e)
            return []

    async def get_profile_context(self, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            res = self.client.table("profiles").select("title, preferences, cv_parsed").eq("id", user_id).maybe_single().execute()
            return res.data if res else None
        except Exception as e:
            logger.exception("[SupabaseProfileRepository] get_profile_context error: %s", e)
            return None

    async def get_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            res = self.client.table("profiles").select(
                "id, display_name, title, avatar_url, preferences, cv_url, cv_parsed"
            ).eq("id", user_id).maybe_single().execute()
            return res.data if res else None
        except Exception as e:
            logger.exception("[SupabaseProfileRepository] get_profile error: %s", e)
            return None

    async def upsert_profile(self, user_id: str, data: Dict[str, Any]) -> None:
        try:
            self.client.table("profiles").upsert({"id": user_id, **data}, on_conflict="id").execute()
        except Exception as e:
            logger.exception("[SupabaseProfileRepository] upsert_profile error for user_id=%s: %s", user_id, e)
            raise DatabaseError(f"Upsert profile failed: {e}") from e

    async def update_profile(self, user_id: str, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        try:
            res = self.client.table("profiles").update(data).eq("id", user_id).execute()
            return res.data or []
        except Exception as e:
            logger.exception("[SupabaseProfileRepository] update_profile error: %s", e)
            return []

    async def insert_profile(self, data: Dict[str, Any]) -> None:
        try:
            self.client.table("profiles").insert(data).execute()
        except Exception as e:
            logger.exception("[SupabaseProfileRepository] insert_profile error: %s", e)
            raise DatabaseError(f"Insert profile failed: {e}") from e


class SupabaseJobRepository(SupabaseBaseRepository, JobRepository):
    async def get_job_cv_scores(self, user_id: str, job_ids: List[str]) -> List[Dict[str, Any]]:
        try:
            res = self.client.table("job_cv_scores") \
                .select("job_id,score,reason,matched_skills,missing_skills") \
                .eq("user_id", user_id) \
                .in_("job_id", job_ids) \
                .execute()
            return res.data or []
        except Exception as e:
            logger.exception("[SupabaseJobRepository] get_job_cv_scores error: %s", e)
            return []

    async def upsert_job_cv_scores(self, rows: List[Dict[str, Any]]) -> None:
        try:
            self.client.table("job_cv_scores") \
                .upsert(rows, on_conflict="job_id,user_id") \
                .execute()
        except Exception as e:
            logger.exception("[SupabaseJobRepository] upsert_job_cv_scores error: %s", e)
            raise DatabaseError(f"Upsert job CV scores failed: {e}") from e


class SupabaseInteractionRepository(SupabaseBaseRepository, InteractionRepository):
    async def get_recent_interactions(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        try:
            res = self.client.table("interactions") \
                .select("job_title, action") \
                .eq("user_id", user_id) \
                .in_("action", ["save", "apply"]) \
                .order("created_at", desc=True) \
                .limit(limit) \
                .execute()
            return res.data or []
        except Exception as e:
            logger.exception("[SupabaseInteractionRepository] get_recent_interactions error: %s", e)
            return []

    async def has_saved_job(self, user_id: str, job_id: str) -> bool:
        try:
            res = self.client.table("interactions") \
                .select("id") \
                .eq("user_id", user_id) \
                .eq("job_id", job_id) \
                .eq("action", "save") \
                .limit(1) \
                .execute()
            return bool(res.data)
        except Exception as e:
            logger.exception("[SupabaseInteractionRepository] has_saved_job error: %s", e)
            return False

    async def insert_interaction(self, data: Dict[str, Any]) -> None:
        try:
            self.client.table("interactions").insert(data).execute()
        except Exception as e:
            logger.exception("[SupabaseInteractionRepository] insert_interaction error: %s", e)
            raise DatabaseError(f"Insert interaction failed: {e}") from e

    async def get_saved_jobs(self, user_id: str) -> List[Dict[str, Any]]:
        try:
            res = self.client.table("interactions") \
                .select("job_id,job_title,job_company,job_location,job_sector,job_work_type,job_seniority,job_url,created_at") \
                .eq("user_id", user_id) \
                .eq("action", "save") \
                .order("created_at", desc=True) \
                .execute()
            return res.data or []
        except Exception as e:
            logger.exception("[SupabaseInteractionRepository] get_saved_jobs error: %s", e)
            return []

    async def delete_saved_job(self, user_id: str, job_id: str) -> None:
        try:
            self.client.table("interactions") \
                .delete() \
                .eq("user_id", user_id) \
                .eq("job_id", job_id) \
                .eq("action", "save") \
                .execute()
        except Exception as e:
            logger.exception("[SupabaseInteractionRepository] delete_saved_job error: %s", e)
            raise DatabaseError(f"Delete saved job failed: {e}") from e

    async def get_applied_jobs(self, user_id: str) -> List[Dict[str, Any]]:
        try:
            res = self.client.table("interactions") \
                .select("*") \
                .eq("user_id", user_id) \
                .eq("action", "apply") \
                .order("created_at", desc=True) \
                .execute()
            return res.data or []
        except Exception as e:
            logger.exception("[SupabaseInteractionRepository] get_applied_jobs error: %s", e)
            return []

    async def get_followed_companies(self, user_id: str) -> List[str]:
        try:
            res = self.client.table("company_follows") \
                .select("company_name") \
                .eq("user_id", user_id) \
                .order("created_at", desc=True) \
                .execute()
            return [r["company_name"] for r in (res.data or [])]
        except Exception as e:
            logger.exception("[SupabaseInteractionRepository] get_followed_companies error: %s", e)
            return []

    async def upsert_company_follow(self, user_id: str, company_name: str) -> None:
        try:
            self.client.table("company_follows").upsert({
                "user_id": user_id,
                "company_name": company_name,
            }, on_conflict="user_id,company_name").execute()
        except Exception as e:
            logger.exception("[SupabaseInteractionRepository] upsert_company_follow error: %s", e)
            raise DatabaseError(f"Upsert company follow failed: {e}") from e

    async def delete_company_follow(self, user_id: str, company_name: str) -> None:
        try:
            self.client.table("company_follows") \
                .delete() \
                .eq("user_id", user_id) \
                .eq("company_name", company_name) \
                .execute()
        except Exception as e:
            logger.exception("[SupabaseInteractionRepository] delete_company_follow error: %s", e)
            raise DatabaseError(f"Delete company follow failed: {e}") from e

    async def get_all_company_follows(self) -> List[Dict[str, Any]]:
        try:
            res = self.client.table("company_follows").select("user_id, company_name").execute()
            return res.data or []
        except Exception as e:
            logger.exception("[SupabaseInteractionRepository] get_all_company_follows error: %s", e)
            return []


class SupabaseAlertRepository(SupabaseBaseRepository, AlertRepository):
    async def get_active_alerts(self) -> List[Dict[str, Any]]:
        try:
            res = self.client.table("job_alerts").select("*").eq("enabled", True).execute()
            return res.data or []
        except Exception as e:
            logger.exception("[SupabaseAlertRepository] get_active_alerts error: %s", e)
            return []

    async def get_job_alerts(self, user_id: str) -> List[Dict[str, Any]]:
        try:
            res = self.client.table("job_alerts") \
                .select("*") \
                .eq("user_id", user_id) \
                .order("created_at", desc=True) \
                .execute()
            return res.data or []
        except Exception as e:
            logger.exception("[SupabaseAlertRepository] get_job_alerts error: %s", e)
            return []

    async def get_job_alerts_count(self, user_id: str) -> int:
        try:
            res = self.client.table("job_alerts").select("id").eq("user_id", user_id).execute()
            return len(res.data or [])
        except Exception as e:
            logger.exception("[SupabaseAlertRepository] get_job_alerts_count error: %s", e)
            return 0

    async def insert_job_alert(self, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            res = self.client.table("job_alerts").insert(data).execute()
            return res.data[0] if res.data else {}
        except Exception as e:
            logger.exception("[SupabaseAlertRepository] insert_job_alert error: %s", e)
            return {}

    async def update_job_alert(self, alert_id: str, user_id: str, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        try:
            res = self.client.table("job_alerts") \
                .update(data) \
                .eq("id", alert_id) \
                .eq("user_id", user_id) \
                .execute()
            return res.data or []
        except Exception as e:
            logger.exception("[SupabaseAlertRepository] update_job_alert error: %s", e)
            return []

    async def delete_job_alert(self, alert_id: str, user_id: str) -> List[Dict[str, Any]]:
        try:
            res = self.client.table("job_alerts") \
                .delete() \
                .eq("id", alert_id) \
                .eq("user_id", user_id) \
                .execute()
            return res.data or []
        except Exception as e:
            logger.exception("[SupabaseAlertRepository] delete_job_alert error: %s", e)
            return []


class SupabaseStorageRepository(SupabaseBaseRepository, StorageRepository):
    async def create_signed_upload_url(self, bucket: str, path: str) -> Dict[str, Any]:
        try:
            return self.client.storage.from_(bucket).create_signed_upload_url(path)
        except Exception as e:
            logger.exception("[SupabaseStorageRepository] create_signed_upload_url error: %s", e)
            raise DatabaseError(f"Create signed upload URL failed: {e}") from e

    async def remove_storage_files(self, bucket: str, paths: List[str]) -> None:
        try:
            self.client.storage.from_(bucket).remove(paths)
        except Exception as e:
            logger.exception("[SupabaseStorageRepository] remove_storage_files error: %s", e)
            raise DatabaseError(f"Remove storage files failed: {e}") from e

    async def create_signed_url(self, bucket: str, path: str, expires_in: int) -> Dict[str, Any]:
        try:
            return self.client.storage.from_(bucket).create_signed_url(path, expires_in)
        except Exception as e:
            logger.exception("[SupabaseStorageRepository] create_signed_url error: %s", e)
            raise DatabaseError(f"Create signed URL failed: {e}") from e

    async def download_storage_file(self, bucket: str, path: str) -> bytes:
        try:
            return self.client.storage.from_(bucket).download(path)
        except Exception as e:
            logger.exception("[SupabaseStorageRepository] download_storage_file error: %s", e)
            raise DatabaseError(f"Download storage file failed: {e}") from e


class SupabaseDatabaseRepository(
    SupabaseProfileRepository,
    SupabaseJobRepository,
    SupabaseInteractionRepository,
    SupabaseAlertRepository,
    SupabaseStorageRepository,
    DatabaseRepository
):
    def __init__(self, client: Client):
        SupabaseProfileRepository.__init__(self, client)
        SupabaseJobRepository.__init__(self, client)
        SupabaseInteractionRepository.__init__(self, client)
        SupabaseAlertRepository.__init__(self, client)
        SupabaseStorageRepository.__init__(self, client)
