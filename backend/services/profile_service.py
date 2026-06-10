import logging
from typing import Any, Dict, Optional
from core.database import ProfileRepository
from utils.validation import validate_exponent_push_token

logger = logging.getLogger(__name__)

class ProfileService:
    def __init__(self, db_repo: ProfileRepository):
        self.db_repo = db_repo

    async def get_profile(self, user_id: str) -> Dict[str, Any]:
        """Fetch user profile and map 'id' to 'user_id' for front-end compatibility."""
        profile = await self.db_repo.get_profile(user_id)
        if not profile:
            return {}
        data = dict(profile)
        data["user_id"] = user_id
        return data

    async def update_profile(self, user_id: str, data: Dict[str, Any]) -> None:
        """Upsert profile updates."""
        await self.db_repo.upsert_profile(user_id, data)

    async def save_push_token(self, user_id: str, token: str) -> bool:
        """Validate format and save user push token."""
        token = token.strip()
        if not token:
            raise ValueError("Missing token")
        if not validate_exponent_push_token(token):
            raise ValueError("Invalid token format")
        
        try:
            result = await self.db_repo.update_profile(user_id, {"push_token": token})
            if not result:
                await self.db_repo.insert_profile({"id": user_id, "push_token": token})
            return True
        except Exception as e:
            logger.error("[ProfileService] save_push_token failed for %s: %s", user_id[:8], e)
            raise e

    async def update_notif_prefs(self, user_id: str, data: Dict[str, Any]) -> None:
        """Update notification preferences for a user."""
        if not data:
            return
        await self.db_repo.update_profile(user_id, data)
