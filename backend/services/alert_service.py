# backend/services/alert_service.py

from core.database import DatabaseRepository
from core.notifier import PushNotifier
from .alert_runners import DailyAlertRunner, CompanyAlertRunner

class AlertService:
    def __init__(self, db_repo: DatabaseRepository, notifier: PushNotifier):
        self.daily_runner = DailyAlertRunner(db_repo, notifier)
        self.company_runner = CompanyAlertRunner(db_repo, notifier)

    async def send_daily_alerts(self) -> None:
        """Daily scheduler job: push notifications for active job alerts."""
        await self.daily_runner.run()

    async def send_company_alerts(self) -> None:
        """Daily scheduler job: notify users about new jobs at followed companies."""
        await self.company_runner.run()
