# backend/services/job_scraper/scraper_client.py

import logging
import pandas as pd
from jobspy import scrape_jobs

logger = logging.getLogger(__name__)

class JobScraperClient:
    def scrape(
        self,
        search_term: str,
        location_normalized: str,
        is_remote: bool | None,
        fetch_description: bool = False,
        sites: list[str] | None = None,
        results_wanted: int = 50,
    ) -> pd.DataFrame | None:
        """Calls jobspy's scrape_jobs with normalized parameters."""
        try:
            kwargs: dict = dict(
                site_name=sites if sites is not None else ["linkedin", "indeed"],
                search_term=search_term,
                location=location_normalized,
                results_wanted=results_wanted,
                hours_old=720,
                linkedin_fetch_description=fetch_description,
            )
            if is_remote is True:
                kwargs["is_remote"] = True
            
            df = scrape_jobs(**kwargs)
            return df
        except Exception as e:
            logger.error("[JobSpyClient] scrape error (%s): %s", search_term, e)
            return None
