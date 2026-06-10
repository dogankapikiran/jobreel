from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

class DatabaseError(Exception):
    """Custom exception for database-related errors."""
    pass

class ProfileRepository(ABC):
    @abstractmethod
    async def get_profiles_by_ids(self, user_ids: List[str], fields: str) -> List[Dict[str, Any]]:
        """Fetch profiles by list of user IDs with specified fields."""
        pass

    @abstractmethod
    async def get_profile_context(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch profile context (title, preferences, cv_parsed) for feed personalization."""
        pass

    @abstractmethod
    async def get_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch profile for a user."""
        pass

    @abstractmethod
    async def upsert_profile(self, user_id: str, data: Dict[str, Any]) -> None:
        """Upsert profile data."""
        pass

    @abstractmethod
    async def update_profile(self, user_id: str, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Update profile fields."""
        pass

    @abstractmethod
    async def insert_profile(self, data: Dict[str, Any]) -> None:
        """Insert profile."""
        pass


class JobRepository(ABC):
    @abstractmethod
    async def get_job_cv_scores(self, user_id: str, job_ids: List[str]) -> List[Dict[str, Any]]:
        """Fetch persisted job CV scores."""
        pass

    @abstractmethod
    async def upsert_job_cv_scores(self, rows: List[Dict[str, Any]]) -> None:
        """Upsert job CV scores."""
        pass


class InteractionRepository(ABC):
    @abstractmethod
    async def get_recent_interactions(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch recent interactions for a user."""
        pass

    @abstractmethod
    async def has_saved_job(self, user_id: str, job_id: str) -> bool:
        """Check if a job is already saved by a user."""
        pass

    @abstractmethod
    async def insert_interaction(self, data: Dict[str, Any]) -> None:
        """Insert a new user interaction."""
        pass

    @abstractmethod
    async def get_saved_jobs(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch all saved jobs for a user."""
        pass

    @abstractmethod
    async def delete_saved_job(self, user_id: str, job_id: str) -> None:
        """Delete a saved job interaction."""
        pass

    @abstractmethod
    async def get_applied_jobs(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch all applied jobs for a user."""
        pass

    @abstractmethod
    async def get_followed_companies(self, user_id: str) -> List[str]:
        """Fetch list of company names a user follows."""
        pass

    @abstractmethod
    async def upsert_company_follow(self, user_id: str, company_name: str) -> None:
        """Follow a company."""
        pass

    @abstractmethod
    async def delete_company_follow(self, user_id: str, company_name: str) -> None:
        """Unfollow a company."""
        pass

    @abstractmethod
    async def get_all_company_follows(self) -> List[Dict[str, Any]]:
        """Fetch all company follows."""
        pass


class AlertRepository(ABC):
    @abstractmethod
    async def get_active_alerts(self) -> List[Dict[str, Any]]:
        """Fetch all active job alerts."""
        pass

    @abstractmethod
    async def get_job_alerts(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch all job alerts for a user."""
        pass

    @abstractmethod
    async def get_job_alerts_count(self, user_id: str) -> int:
        """Get the count of job alerts for a user."""
        pass

    @abstractmethod
    async def insert_job_alert(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new job alert."""
        pass

    @abstractmethod
    async def update_job_alert(self, alert_id: str, user_id: str, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Update an existing job alert."""
        pass

    @abstractmethod
    async def delete_job_alert(self, alert_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Delete a job alert."""
        pass


class StorageRepository(ABC):
    @abstractmethod
    async def create_signed_upload_url(self, bucket: str, path: str) -> Dict[str, Any]:
        """Generate a signed upload URL for storage."""
        pass

    @abstractmethod
    async def remove_storage_files(self, bucket: str, paths: List[str]) -> None:
        """Remove files from storage."""
        pass

    @abstractmethod
    async def create_signed_url(self, bucket: str, path: str, expires_in: int) -> Dict[str, Any]:
        """Generate a signed read URL for storage."""
        pass

    @abstractmethod
    async def download_storage_file(self, bucket: str, path: str) -> bytes:
        """Download file content as bytes from storage."""
        pass


class DatabaseRepository(
    ProfileRepository,
    JobRepository,
    InteractionRepository,
    AlertRepository,
    StorageRepository,
    ABC
):
    pass
