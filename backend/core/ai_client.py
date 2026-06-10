from abc import ABC, abstractmethod
from typing import Any, Dict, List

class AIClient(ABC):
    @abstractmethod
    async def parse_cv(self, text: str) -> Dict[str, Any]:
        """Parse raw CV text into a structured dictionary."""
        pass

    @abstractmethod
    async def score_jobs_batch(self, jobs: List[Dict[str, Any]], cv_parsed: Dict[str, Any]) -> Dict[int, Dict[str, Any]]:
        """Score a batch of jobs against a parsed CV."""
        pass
