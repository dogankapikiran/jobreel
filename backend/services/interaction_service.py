from typing import Any, Dict, List
from core.database import InteractionRepository


class InteractionService:
    def __init__(self, db_repo: InteractionRepository):
        self.db_repo = db_repo

    async def has_saved_job(self, user_id: str, job_id: str) -> bool:
        return await self.db_repo.has_saved_job(user_id, job_id)

    async def insert_interaction(self, data: Dict[str, Any]) -> None:
        await self.db_repo.insert_interaction(data)

    async def get_saved_jobs(self, user_id: str) -> List[Dict[str, Any]]:
        return await self.db_repo.get_saved_jobs(user_id)

    async def delete_saved_job(self, user_id: str, job_id: str) -> None:
        await self.db_repo.delete_saved_job(user_id, job_id)

    async def get_applied_jobs(self, user_id: str) -> List[Dict[str, Any]]:
        return await self.db_repo.get_applied_jobs(user_id)

    async def get_followed_companies(self, user_id: str) -> List[str]:
        return await self.db_repo.get_followed_companies(user_id)

    async def upsert_company_follow(self, user_id: str, company_name: str) -> None:
        await self.db_repo.upsert_company_follow(user_id, company_name)

    async def delete_company_follow(self, user_id: str, company_name: str) -> None:
        await self.db_repo.delete_company_follow(user_id, company_name)
