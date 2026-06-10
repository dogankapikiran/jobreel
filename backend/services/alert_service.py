# backend/services/alert_service.py

from typing import Any, Dict, List
from core.database import DatabaseRepository
from core.notifier import PushNotifier
from .alert_runners import DailyAlertRunner, CompanyAlertRunner

class AlertService:
    def __init__(self, db_repo: DatabaseRepository, notifier: PushNotifier):
        self.db_repo = db_repo
        self.daily_runner = DailyAlertRunner(db_repo, notifier)
        self.company_runner = CompanyAlertRunner(db_repo, notifier)

    async def send_daily_alerts(self) -> None:
        """Daily scheduler job: push notifications for active job alerts."""
        await self.daily_runner.run()

    async def send_company_alerts(self) -> None:
        """Daily scheduler job: notify users about new jobs at followed companies."""
        await self.company_runner.run()

    async def get_job_alerts(self, user_id: str) -> List[Dict[str, Any]]:
        return await self.db_repo.get_job_alerts(user_id)

    async def get_job_alerts_count(self, user_id: str) -> int:
        return await self.db_repo.get_job_alerts_count(user_id)

    async def insert_job_alert(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return await self.db_repo.insert_job_alert(data)

    async def update_job_alert(self, alert_id: str, user_id: str, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        return await self.db_repo.update_job_alert(alert_id, user_id, data)

    async def delete_job_alert(self, alert_id: str, user_id: str) -> List[Dict[str, Any]]:
        return await self.db_repo.delete_job_alert(alert_id, user_id)
