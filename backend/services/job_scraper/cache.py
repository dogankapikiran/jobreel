# backend/services/job_scraper/cache.py

import time

class JobCache:
    def __init__(self, ttl_seconds: int = 3600):
        self._cache: dict = {}
        self._scraping: set[str] = set()
        self.ttl = ttl_seconds

    def build_key(self, terms: list[str], location: str) -> str:
        return f"{'|'.join(sorted(terms))}||{location.lower()}"

    def get(self, key: str) -> dict | None:
        return self._cache.get(key)

    def set(self, key: str, jobs: list[dict], ts: float, partial: bool = False) -> None:
        self._cache[key] = {
            "ts": ts,
            "jobs": jobs,
            "partial": partial
        }

    def is_valid(self, key: str, now: float) -> bool:
        entry = self._cache.get(key)
        return entry is not None and now - entry["ts"] <= self.ttl

    def is_scraping(self, key: str) -> bool:
        return key in self._scraping

    def start_scraping(self, key: str) -> None:
        self._scraping.add(key)

    def stop_scraping(self, key: str) -> None:
        self._scraping.discard(key)

    def update_description(self, job_id: str, desc: str) -> None:
        for entry in self._cache.values():
            for job in entry.get("jobs", []):
                if job["id"] == job_id:
                    job["description"] = desc
