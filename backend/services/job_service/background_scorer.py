import asyncio
import logging
from collections import OrderedDict
from typing import Any, Dict, List, Optional, Set, Tuple
from core.database import JobRepository

logger = logging.getLogger(__name__)
from core.ai_client import AIClient
from core.config import SCORE_CACHE_MAX
from .scorer import PreferenceScorer


class ScoreCache:
    def __init__(self):
        self._cache: OrderedDict[Tuple[str, str], Dict[str, Any]] = OrderedDict()

    def get(self, user_id: Optional[str], job_id: str) -> Dict[str, Any]:
        """Fetch score information from cache."""
        return self._cache.get((user_id or "", job_id), {})

    def has(self, user_id: Optional[str], job_id: str) -> bool:
        """Check if score is already cached."""
        return (user_id or "", job_id) in self._cache

    def put(self, user_id: Optional[str], job_id: str, value: Dict[str, Any]) -> None:
        """Cache score information and enforce cache size limits."""
        key = (user_id or "", job_id)
        self._cache[key] = value
        if len(self._cache) > SCORE_CACHE_MAX:
            self._cache.popitem(last=False)


class BackgroundScorer:
    def __init__(self, db_repo: JobRepository, ai_client: AIClient, preference_scorer: PreferenceScorer):
        self.db_repo = db_repo
        self.ai_client = ai_client
        self.preference_scorer = preference_scorer
        self.score_cache = ScoreCache()
        self.groq_scoring_in_progress: Set[Tuple[Optional[str], str]] = set()

    async def load_scores_from_db(self, user_id: str, job_ids: List[str]) -> None:
        try:
            rows = await self.db_repo.get_job_cv_scores(user_id, job_ids)
            for row in rows:
                jid = row["job_id"]
                if not self.score_cache.has(user_id, jid):
                    self.score_cache.put(user_id, jid, {
                        "score": row["score"],
                        "reason": row["reason"] or "",
                        "matched_skills": row["matched_skills"] or [],
                        "missing_skills": row["missing_skills"] or [],
                    })
        except Exception as e:
            logger.error("[Score Load] DB error: %s", e)

    async def score_jobs_background(self, jobs: List[Dict[str, Any]], cv_parsed: Dict[str, Any], user_id: Optional[str] = None) -> None:
        ids = {(user_id, j["id"]) for j in jobs}
        self.groq_scoring_in_progress.update(ids)
        try:
            results = await self.ai_client.score_jobs_batch(jobs, cv_parsed)
            rows_to_upsert = []
            for i, job in enumerate(jobs):
                entry = results.get(i)
                if entry:
                    self.score_cache.put(user_id, job["id"], entry)
                    if user_id:
                        rows_to_upsert.append({
                            "job_id": job["id"],
                            "user_id": user_id,
                            "score": entry["score"],
                            "reason": entry["reason"],
                            "matched_skills": entry["matched_skills"],
                            "missing_skills": entry["missing_skills"],
                        })
            if rows_to_upsert:
                try:
                    await self.db_repo.upsert_job_cv_scores(rows_to_upsert)
                except Exception as e:
                    logger.error("[Score Save] DB error: %s", e)
        finally:
            self.groq_scoring_in_progress.difference_update(ids)

    async def apply_scores_to_jobs(
        self,
        jobs: List[Dict[str, Any]],
        user_id: str,
        user_prefs: Dict[str, Any],
        cv_parsed: Optional[Dict[str, Any]],
        work_type: str,
        seniority_list: List[str],
        sectors_list: List[str],
    ) -> bool:
        # Calculate preference scores
        for job in jobs:
            job["_pref_score"] = self.preference_scorer.calculate_score(
                job, user_prefs, work_type, seniority_list, sectors_list
            )

        pref_skills = list(user_prefs.get("skills") or [])
        effective_cv: Optional[Dict[str, Any]] = None
        if cv_parsed or pref_skills:
            effective_cv = dict(cv_parsed or {})
            merged_skills = list(dict.fromkeys(
                (effective_cv.get("skills") or []) + pref_skills
            ))
            effective_cv["skills"] = merged_skills

        partial = False
        if effective_cv and effective_cv.get("skills"):
            uncached_ids = [j["id"] for j in jobs if not self.score_cache.has(user_id, j["id"])]
            if uncached_ids:
                await self.load_scores_from_db(user_id, uncached_ids)

            for job in jobs:
                cached = self.score_cache.get(user_id, job["id"])
                job["score"] = job["_pref_score"] + cached.get("score", 25)
                if cached.get("reason"):
                    job["ai_reason"] = cached["reason"]
                if cached.get("matched_skills"):
                    job["matched_skills"] = cached["matched_skills"]
                if cached.get("missing_skills"):
                    job["missing_skills"] = cached["missing_skills"]

            to_score = [
                j for j in jobs
                if not self.score_cache.has(user_id, j["id"])
                and (user_id, j["id"]) not in self.groq_scoring_in_progress
            ]
            if to_score:
                asyncio.create_task(self.score_jobs_background(to_score, effective_cv, user_id))

            if any(not self.score_cache.has(user_id, j["id"]) for j in jobs):
                partial = True
        else:
            for job in jobs:
                job["score"] = job["_pref_score"] * 2

        for job in jobs:
            job.pop("_pref_score", None)

        return partial
