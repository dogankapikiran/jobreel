from typing import List
from core.database import InteractionRepository


class CompanyService:
    def __init__(self, db_repo: InteractionRepository):
        self.db_repo = db_repo

    async def get_followed_companies(self, user_id: str) -> List[str]:
        return await self.db_repo.get_followed_companies(user_id)

    async def upsert_company_follow(self, user_id: str, company_name: str) -> None:
        await self.db_repo.upsert_company_follow(user_id, company_name)

    async def delete_company_follow(self, user_id: str, company_name: str) -> None:
        await self.db_repo.delete_company_follow(user_id, company_name)
