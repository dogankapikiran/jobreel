# backend/services/job_scraper/orchestrator.py

import asyncio
import logging
import time
from typing import Tuple

from .translator import KeywordTranslator
from .normalizer import JobNormalizer
from .cache import JobCache
from .scraper_client import JobScraperClient
from .linkedin_fetcher import LinkedInDescFetcher

logger = logging.getLogger(__name__)

class JobScraperOrchestrator:
    def __init__(
        self,
        translator: KeywordTranslator,
        normalizer: JobNormalizer,
        cache: JobCache,
        scraper_client: JobScraperClient,
        linkedin_fetcher: LinkedInDescFetcher,
        results_per_term: int = 50,
        results_per_term_bg: int = 250,
        page_size: int = 20,
    ):
        self.translator = translator
        self.normalizer = normalizer
        self.cache = cache
        self.scraper_client = scraper_client
        self.linkedin_fetcher = linkedin_fetcher
        self.results_per_term = results_per_term
        self.results_per_term_bg = results_per_term_bg
        self.page_size = page_size

    def _scrape_and_map(
        self,
        search_term: str,
        location: str,
        is_remote: bool | None,
        fetch_description: bool = False,
        sites: list[str] | None = None,
        results_wanted: int = 50,
    ) -> list[dict]:
        loc_normalized = self.normalizer.normalize_location(location)
        df = self.scraper_client.scrape(
            search_term=search_term,
            location_normalized=loc_normalized,
            is_remote=is_remote,
            fetch_description=fetch_description,
            sites=sites,
            results_wanted=results_wanted
        )
        if df is None or df.empty:
            return []
        return [self.normalizer.map_row(row, i) for i, (_, row) in enumerate(df.iterrows())]

    def _build_search_terms(self, keyword: str, sectors: list[str], extra_keywords: list[str] | None = None) -> list[str]:
        terms: list[str] = []
        if keyword:
            translated = self.translator.translate_keyword(keyword)
            terms.append(translated)
            for ek in (extra_keywords or []):
                ek_translated = self.translator.translate_keyword(ek)
                if ek_translated.lower() not in [t.lower() for t in terms]:
                    terms.append(ek_translated)
        else:
            for sector in sectors:
                mapped = self.translator.get_sector_term(sector)
                if mapped not in terms:
                    terms.append(mapped)
            if not terms:
                terms = ["software developer"]
        return terms[:3]

    async def _scrape_background(
        self,
        key: str,
        all_terms: list[str],
        location: str,
        is_remote: bool | None,
        ts: float,
    ) -> None:
        try:
            tasks = [
                asyncio.to_thread(
                    self._scrape_and_map, term, location, is_remote, False, ["linkedin", "indeed"], self.results_per_term_bg
                )
                for term in all_terms
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            incoming: list[dict] = []
            for r in results:
                if not isinstance(r, Exception):
                    incoming.extend(r)

            incoming = self.normalizer.dedupe_prefer_indeed(incoming)
            entry = self.cache.get(key)
            existing = entry.get("jobs", []) if entry else []
            merged = self.normalizer.merge_jobs(existing, incoming)
            merged = self.normalizer.dedupe_prefer_indeed(merged)
            self.cache.set(key, merged, ts, partial=False)
            li_count = sum(1 for j in merged if j.get("site") == "linkedin")
            in_count = sum(1 for j in merged if j.get("site") == "indeed")
            logger.info("[JobSpy] Background done: %d jobs (LinkedIn=%d, Indeed=%d) | key=%s", len(merged), li_count, in_count, key[:40])
        finally:
            self.cache.stop_scraping(key)

    async def fetch_jobs(
        self,
        keyword: str,
        location: str,
        sectors: list[str],
        extra_keywords: list[str],
        work_type: str,
        seniority_list: list[str],
        page: int,
    ) -> Tuple[list[dict], int, bool]:
        search_terms = self._build_search_terms(keyword, sectors, extra_keywords)
        key = self.cache.build_key(search_terms, location)
        now = time.time()
        partial = False

        entry = self.cache.get(key)
        cache_valid = self.cache.is_valid(key, now)

        if cache_valid and entry:
            raw = entry["jobs"]
            partial = entry.get("partial", False)
        elif self.cache.is_scraping(key):
            raw = entry["jobs"] if entry else []
            partial = True
        else:
            is_remote = True if work_type == "remote" else None
            half = max(self.results_per_term // 2, 15)
            li_task = asyncio.to_thread(
                self._scrape_and_map, search_terms[0], location, is_remote, False, ["linkedin"], half
            )
            in_task = asyncio.to_thread(
                self._scrape_and_map, search_terms[0], location, is_remote, False, ["indeed"], half
            )
            li_jobs, in_jobs = await asyncio.gather(li_task, in_task, return_exceptions=True)

            first: list[dict] = []
            if isinstance(li_jobs, list):
                first.extend(li_jobs)
            if isinstance(in_jobs, list):
                first.extend(in_jobs)
            first = self.normalizer.dedupe_prefer_indeed(first)
            self.cache.set(key, first, now, partial=True)
            partial = True
            li_count = sum(1 for j in first if j.get("site") == "linkedin")
            in_count = sum(1 for j in first if j.get("site") == "indeed")
            logger.info("[JobSpy] Quick fetch: %d jobs (LinkedIn=%d, Indeed=%d) | term=%s", len(first), li_count, in_count, search_terms[0])

            self.cache.start_scraping(key)
            asyncio.create_task(
                self._scrape_background(key, search_terms, location, is_remote, now)
            )

            raw = first

        jobs = self.normalizer.apply_filters(raw, work_type, seniority_list)
        logger.info("[JobSpy] After filter: %d jobs | partial=%s", len(jobs), partial)

        start = (page - 1) * self.page_size
        return jobs[start: start + self.page_size], len(jobs), partial

    async def get_job_description(self, job_id: str) -> str:
        cached_job: dict | None = None
        for entry in self.cache._cache.values():
            for job in entry.get("jobs", []):
                if job["id"] == job_id:
                    cached_job = job
                    break
            if cached_job:
                break

        if cached_job is None:
            return ""

        existing = cached_job.get("description", "").strip()
        if existing:
            return existing

        apply_url = cached_job.get("apply_url", "")
        linkedin_id = self.linkedin_fetcher.extract_linkedin_job_id(apply_url) if apply_url else None

        if not linkedin_id:
            logger.warning("[LinkedIn] No job ID extractable from: %s", apply_url)
            return ""

        logger.info("[LinkedIn] Direct fetch: linkedin_id=%s (%s)", linkedin_id, cached_job.get('title'))
        desc = await asyncio.to_thread(self.linkedin_fetcher.fetch_description, linkedin_id)

        if desc:
            self.cache.update_description(job_id, desc)
            logger.info("[LinkedIn] OK — %d chars for %s", len(desc), job_id)
        else:
            logger.warning("[LinkedIn] Empty response for linkedin_id=%s", linkedin_id)

        return desc
