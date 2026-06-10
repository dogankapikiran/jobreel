# backend/services/job_scraper/__init__.py

from .translator import KeywordTranslator
from .normalizer import JobNormalizer
from .cache import JobCache
from .scraper_client import JobScraperClient
from .linkedin_fetcher import LinkedInDescFetcher
from .orchestrator import JobScraperOrchestrator

# Instantiate default singleton components
_translator = KeywordTranslator()
_normalizer = JobNormalizer()
_cache = JobCache()
_scraper_client = JobScraperClient()
_linkedin_fetcher = LinkedInDescFetcher()

orchestrator = JobScraperOrchestrator(
    translator=_translator,
    normalizer=_normalizer,
    cache=_cache,
    scraper_client=_scraper_client,
    linkedin_fetcher=_linkedin_fetcher,
)

# Export module-level variables and functions for backward compatibility
fetch_jobs = orchestrator.fetch_jobs
get_job_description = orchestrator.get_job_description
PAGE_SIZE = orchestrator.page_size

__all__ = [
    "KeywordTranslator",
    "JobNormalizer",
    "JobCache",
    "JobScraperClient",
    "LinkedInDescFetcher",
    "JobScraperOrchestrator",
    "orchestrator",
    "fetch_jobs",
    "get_job_description",
    "PAGE_SIZE",
]
