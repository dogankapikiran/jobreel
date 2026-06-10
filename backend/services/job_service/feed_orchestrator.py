# backend/services/job_service/feed_orchestrator.py

import asyncio
import random
from typing import Any, Dict, List, Optional, Set, Tuple
from services.job_scraper import fetch_jobs, PAGE_SIZE
from .user_context import UserContext, UserContextBuilder

class FeedOrchestrator:
    def __init__(self, user_context_builder: UserContextBuilder):
        self.user_context_builder = user_context_builder

    async def fetch_manual_search(
        self,
        keyword: str,
        location: str,
        sectors_list: List[str],
        work_type: str,
        seniority_list: List[str],
        page: int,
        user: Optional[Dict[str, Any]],
    ) -> Tuple[List[Dict[str, Any]], int, bool, Dict[str, Any], Optional[Dict[str, Any]]]:
        fetch_coro = fetch_jobs(
            keyword=keyword,
            location=location,
            sectors=sectors_list,
            extra_keywords=[],
            work_type=work_type,
            seniority_list=seniority_list,
            page=page,
        )
        if user:
            (jobs, total, partial), ctx = await asyncio.gather(
                fetch_coro,
                self.user_context_builder.build_context(user["sub"]),
            )
            return jobs, total, partial, ctx.prefs, ctx.cv_parsed
        else:
            jobs, total, partial = await fetch_coro
            return jobs, total, partial, {}, None

    async def fetch_personalized_feed(
        self,
        ctx: UserContext,
        location: str,
        sectors_list: List[str],
        work_type: str,
        seniority_list: List[str],
        page: int,
    ) -> Tuple[List[Dict[str, Any]], int, bool]:
        slots = {term: max(1, round(w * PAGE_SIZE)) for term, w in ctx.weighted_terms}

        fetch_tasks = [
            fetch_jobs(
                keyword=term,
                location=location,
                sectors=sectors_list,
                extra_keywords=[],
                work_type=work_type,
                seniority_list=seniority_list,
                page=page,
            )
            for term, _ in ctx.weighted_terms
        ]
        fetch_results = await asyncio.gather(*fetch_tasks)

        mixed_jobs: List[Dict[str, Any]] = []
        seen_ids: Set[str] = set()
        any_partial = False
        term_totals: List[int] = []

        for (term, _weight), (term_jobs, term_total, term_partial) in zip(ctx.weighted_terms, fetch_results):
            slot = slots[term]
            if term_partial:
                any_partial = True
            term_totals.append(term_total)
            count = 0
            for job in term_jobs:
                if count >= slot:
                    break
                if job["id"] not in seen_ids:
                    mixed_jobs.append(job)
                    seen_ids.add(job["id"])
                    count += 1

        random.shuffle(mixed_jobs)
        total = sum(int(w * t) for (_, w), t in zip(ctx.weighted_terms, term_totals))
        return mixed_jobs, total, any_partial
