import logging
from collections import Counter
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple
from core.database import DatabaseRepository

logger = logging.getLogger(__name__)

@dataclass
class UserContext:
    weighted_terms: List[Tuple[str, float]] = field(default_factory=lambda: [("software developer", 1.0)])
    prefs: Dict[str, Any] = field(default_factory=dict)
    cv_parsed: Optional[Dict[str, Any]] = None

class UserContextBuilder:
    def __init__(self, db_repo: DatabaseRepository):
        self.db_repo = db_repo

    async def build_context(self, user_id: str) -> UserContext:
        counts: Counter = Counter()

        try:
            interactions = await self.db_repo.get_recent_interactions(user_id, limit=50)
            for row in interactions:
                title = (row.get("job_title") or "").strip()
                if not title:
                    continue
                weight = 3 if row["action"] == "apply" else 2
                counts[title.lower()] += weight
        except Exception as e:
            logger.error("[UserContext] Interactions query failed for %s: %s", user_id[:8], e)

        prefs: dict = {}
        cv_parsed: Optional[dict] = None
        cv_title = ""

        try:
            prof = await self.db_repo.get_profile_context(user_id)
            if prof:
                val = (prof.get("title") or "").strip()
                if val:
                    cv_title = val.lower()
                prefs = prof.get("preferences") or {}
                cv_parsed = prof.get("cv_parsed") or None
        except Exception as e:
            logger.error("[UserContext] Profile query failed for %s: %s", user_id[:8], e)

        # Add CV/profile title with baseline weight if not present in interactions
        if cv_title and cv_title not in counts:
            counts[cv_title] = 2

        total_pts = sum(counts.values()) or 1
        weighted_terms = [
            (title, cnt / total_pts)
            for title, cnt in counts.most_common(4)
            if cnt / total_pts >= 0.05
        ]

        # Re-normalize to total 1.0 after filtering
        kept_total = sum(w for _, w in weighted_terms)
        if kept_total > 0:
            weighted_terms = [(t, w / kept_total) for t, w in weighted_terms]

        if not weighted_terms:
            weighted_terms = [("software developer", 1.0)]

        logger.info("[Feed] Weighted terms for %s: %s", user_id[:8], [(t, round(w, 2)) for t, w in weighted_terms])
        return UserContext(weighted_terms=weighted_terms, prefs=prefs, cv_parsed=cv_parsed)
