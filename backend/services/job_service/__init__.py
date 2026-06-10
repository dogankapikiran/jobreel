# backend/services/job_service/__init__.py

from typing import Any, Dict, List, Optional
from core.database import DatabaseRepository
from core.ai_client import AIClient
from services.job_scraper import fetch_jobs

from .user_context import UserContext, UserContextBuilder
from .scorer import PreferenceScorer
from .background_scorer import BackgroundScorer
from .feed_orchestrator import FeedOrchestrator

class JobService:
    def __init__(self, db_repo: DatabaseRepository, ai_client: AIClient):
        self.db_repo = db_repo
        self.ai_client = ai_client
        
        self.user_context_builder = UserContextBuilder(db_repo)
        self.preference_scorer = PreferenceScorer()
        self.background_scorer = BackgroundScorer(db_repo, ai_client, self.preference_scorer)
        self.feed_orchestrator = FeedOrchestrator(self.user_context_builder)

    async def get_feed(
        self,
        location: str,
        keyword: str,
        sectors: str,
        work_type: str,
        seniority: str,
        page: int,
        user: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        sectors_list = [s.strip() for s in sectors.split(",") if s.strip()]
        seniority_list = [s.strip() for s in seniority.split(",") if s.strip()]

        user_prefs: dict = {}
        cv_parsed: Optional[dict] = None

        if keyword:
            jobs, total, partial, user_prefs, cv_parsed = await self.feed_orchestrator.fetch_manual_search(
                keyword, location, sectors_list, work_type, seniority_list, page, user
            )
        elif user:
            ctx = await self.user_context_builder.build_context(user["sub"])
            user_prefs = ctx.prefs
            cv_parsed = ctx.cv_parsed
            jobs, total, partial = await self.feed_orchestrator.fetch_personalized_feed(
                ctx, location, sectors_list, work_type, seniority_list, page
            )
        else:
            jobs, total, partial = await fetch_jobs(
                keyword="software developer",
                location=location,
                sectors=sectors_list,
                extra_keywords=[],
                work_type=work_type,
                seniority_list=seniority_list,
                page=page,
            )

        if user and user_prefs:
            score_partial = await self.background_scorer.apply_scores_to_jobs(
                jobs, user["sub"], user_prefs, cv_parsed,
                work_type, seniority_list, sectors_list
            )
            partial = partial or score_partial

        return {"jobs": jobs, "total": total, "partial": partial}

__all__ = [
    "JobService",
    "UserContext",
    "UserContextBuilder",
    "PreferenceScorer",
    "BackgroundScorer",
    "FeedOrchestrator",
]
