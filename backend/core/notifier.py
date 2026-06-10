from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

class PushNotifier(ABC):
    @abstractmethod
    async def send_push(self, token: str, title: str, body: str, data: Optional[Dict[str, Any]] = None) -> None:
        """Send a push notification to a device token."""
        pass
