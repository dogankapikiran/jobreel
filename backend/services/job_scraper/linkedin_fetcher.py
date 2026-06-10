# backend/services/job_scraper/linkedin_fetcher.py

import logging
import re
import requests

logger = logging.getLogger(__name__)

class LinkedInDescFetcher:
    _LI_HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    }

    def extract_linkedin_job_id(self, apply_url: str) -> str | None:
        """Extracts numerical LinkedIn job ID from the application URL."""
        if not apply_url:
            return None
        matches = re.findall(r'\d{8,}', apply_url)
        return matches[-1] if matches else None

    def fetch_description(self, linkedin_id: str) -> str:
        """Fetches description of a job from LinkedIn's public guest API (~1-2s)."""
        url = f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{linkedin_id}"
        try:
            resp = requests.get(url, headers=self._LI_HEADERS, timeout=15)
            if resp.status_code != 200:
                logger.warning("[LinkedIn] Guest API %d for %s", resp.status_code, linkedin_id)
                return ""

            raw = resp.text

            # Try show-more-less-html__markup first, then description__text
            match = re.search(
                r'class="show-more-less-html__markup[^"]*"[^>]*>(.*?)</div>',
                raw, re.DOTALL | re.IGNORECASE,
            )
            if not match:
                match = re.search(
                    r'<section[^>]*description[^>]*>(.*?)</section>',
                    raw, re.DOTALL | re.IGNORECASE,
                )
            if not match:
                return ""

            content = match.group(1)

            # Unescape HTML entities
            for ent, ch in [('&amp;', '&'), ('&lt;', '<'), ('&gt;', '>'),
                            ('&nbsp;', ' '), ('&#39;', "'"), ('&quot;', '"')]:
                content = content.replace(ent, ch)
            content = re.sub(r'&#\d+;', '', content)

            # Convert HTML to clean text
            content = re.sub(r'<br\s*/?>', '\n', content, flags=re.IGNORECASE)
            content = re.sub(r'<li[^>]*>', '\n• ', content, flags=re.IGNORECASE)
            content = re.sub(r'<h[1-6][^>]*>(.*?)</h[1-6]>', r'\n\1\n', content, flags=re.DOTALL | re.IGNORECASE)
            content = re.sub(r'<p[^>]*>', '\n', content, flags=re.IGNORECASE)
            content = re.sub(r'<[^>]+>', '', content)
            content = re.sub(r'\n{3,}', '\n\n', content)
            return content.strip()[:10000]
        except Exception as e:
            logger.error("[LinkedIn] Fetch error for %s: %s", linkedin_id, e)
            return ""
