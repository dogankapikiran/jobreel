# backend/services/alert_service/alert_runners.py

import logging
from typing import Dict, List, Any, Tuple
from core.database import DatabaseRepository
from core.notifier import PushNotifier
from services.job_scraper import fetch_jobs

logger = logging.getLogger(__name__)


class AlertQueryService:
    def __init__(self, db_repo: DatabaseRepository):
        self.db_repo = db_repo

    async def get_daily_alerts_and_tokens(self) -> Tuple[List[Dict[str, Any]], Dict[str, str]]:
        """Fetch active alerts and map user IDs to push tokens for daily alerts."""
        alerts = await self.db_repo.get_active_alerts()
        if not alerts:
            return [], {}

        user_ids = list({a["user_id"] for a in alerts})
        profiles = await self.db_repo.get_profiles_by_ids(user_ids, "id, push_token, notif_job_alerts")
        token_map = {
            r["id"]: r["push_token"]
            for r in profiles
            if r.get("push_token") and r.get("notif_job_alerts", True)
        }
        return alerts, token_map

    async def get_company_follows_and_tokens(self) -> Tuple[List[Dict[str, Any]], Dict[str, Dict[str, Any]]]:
        """Fetch company follows and map user IDs to push tokens & preferences."""
        follows = await self.db_repo.get_all_company_follows()
        if not follows:
            return [], {}

        user_ids = list({f["user_id"] for f in follows})
        profiles = await self.db_repo.get_profiles_by_ids(user_ids, "id, push_token, notif_follow, preferences")
        token_map = {
            r["id"]: {
                "push_token": r["push_token"],
                "location": (r.get("preferences") or {}).get("location") or "Istanbul, Turkey",
            }
            for r in profiles
            if r.get("push_token") and r.get("notif_follow", True)
        }
        return follows, token_map


class AlertNotificationDispatcher:
    def __init__(self, notifier: PushNotifier):
        self.notifier = notifier

    async def send_daily_alert(self, token: str, label: str, count: int, keyword: str, location: str) -> None:
        """Send daily job match push notification."""
        await self.notifier.send_push(
            token,
            f"{label} — Yeni İlanlar",
            f"Bugün {count}+ ilan bulundu. Hemen bak!",
            {"keyword": keyword, "location": location},
        )

    async def send_company_alert(self, token: str, company: str, count: int) -> None:
        """Send company followed open position notification."""
        await self.notifier.send_push(
            token,
            f"{company} — Açık Pozisyonlar",
            f"{count}+ ilan var. Hemen incele!",
            {"company_name": company},
        )


class DailyAlertRunner:
    def __init__(self, db_repo: DatabaseRepository, notifier: PushNotifier):
        self.query_service = AlertQueryService(db_repo)
        self.dispatcher = AlertNotificationDispatcher(notifier)

    async def run(self) -> None:
        logger.info("[Alerts] Running daily alert job…")
        try:
            alerts, token_map = await self.query_service.get_daily_alerts_and_tokens()
            if not alerts:
                return

            for alert in alerts:
                push_token = token_map.get(alert["user_id"])
                if not push_token:
                    continue
                keyword = alert.get("keyword") or "software developer"
                location = alert.get("location") or "Istanbul, Turkey"
                seniority_list = alert.get("seniority") or []
                sectors = alert.get("sectors") or []
                work_type = alert.get("work_type") or "any"
                label = alert.get("label") or keyword

                try:
                    _, total, _ = await fetch_jobs(
                        keyword=keyword,
                        location=location,
                        sectors=sectors,
                        extra_keywords=[],
                        work_type=work_type,
                        seniority_list=seniority_list,
                        page=1,
                    )
                    count = min(total, 99)
                    if count > 0:
                        await self.dispatcher.send_daily_alert(
                            push_token, label, count, keyword, location
                        )
                        logger.info("[Alerts] Sent alert to %s… (%s jobs)", alert['user_id'][:8], count)
                except Exception as e:
                    logger.exception("[Alerts] Alert %s error: %s", alert.get('id'), e)
        except Exception as e:
            logger.exception("[Alerts] Job failed: %s", e)


class CompanyAlertRunner:
    def __init__(self, db_repo: DatabaseRepository, notifier: PushNotifier):
        self.query_service = AlertQueryService(db_repo)
        self.dispatcher = AlertNotificationDispatcher(notifier)

    async def run(self) -> None:
        logger.info("[Companies] Running company alert job…")
        try:
            follows, token_map = await self.query_service.get_company_follows_and_tokens()
            if not follows:
                return

            for follow in follows:
                user_data = token_map.get(follow["user_id"])
                if not user_data:
                    continue
                push_token = user_data["push_token"]
                user_location = user_data["location"]
                company = follow["company_name"]
                try:
                    _, total, _ = await fetch_jobs(
                        keyword=company,
                        location=user_location,
                        sectors=[],
                        extra_keywords=[],
                        work_type="any",
                        seniority_list=[],
                        page=1,
                    )
                    count = min(total, 99)
                    if count > 0:
                        await self.dispatcher.send_company_alert(push_token, company, count)
                        logger.info("[Companies] Notified %s… re: %s (%s jobs)", follow['user_id'][:8], company, count)
                except Exception as e:
                    logger.exception("[Companies] Error for %s: %s", company, e)
        except Exception as e:
            logger.exception("[Companies] Job failed: %s", e)
