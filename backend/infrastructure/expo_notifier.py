import logging
from typing import Any, Dict, Optional
import httpx
from core.notifier import PushNotifier

logger = logging.getLogger(__name__)

class ExpoPushNotifier(PushNotifier):
    async def send_push(self, token: str, title: str, body: str, data: Optional[Dict[str, Any]] = None) -> None:
        """Send a push notification via Expo Push API."""
        if not token.startswith("ExponentPushToken"):
            return
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(
                    "https://exp.host/--/api/v2/push/send",
                    json={"to": token, "title": title, "body": body, "data": data or {}, "sound": "default"},
                    headers={"Content-Type": "application/json"},
                    timeout=10,
                )
                if resp.status_code == 200:
                    result = resp.json().get("data", {})
                    if result.get("status") == "error":
                        logger.error("[Push] Delivery error for %s: %s", token[:30], result.get('message'))
            except Exception as e:
                logger.error("[Push] Error: %s", e)
