# backend/core/config.py

import os
from typing import List, Set

# Groq LLM configurations
GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_CV_MAX_TOKENS: int = int(os.getenv("GROQ_CV_MAX_TOKENS", "1024"))
GROQ_SCORE_MAX_TOKENS: int = int(os.getenv("GROQ_SCORE_MAX_TOKENS", "1200"))

# CORS settings
CORS_ORIGINS: List[str] = [
    "https://jobreel.app",
    "https://www.jobreel.app",
]
if os.getenv("ENV") == "development":
    CORS_ORIGINS.extend([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ])

# Alert configurations
MAX_ALERTS_PER_USER: int = int(os.getenv("MAX_ALERTS_PER_USER", "20"))

# Scorer configurations
SCORE_CACHE_MAX: int = int(os.getenv("SCORE_CACHE_MAX", "10000"))

# Allowed job domains for safe URL validation
ALLOWED_JOB_DOMAINS: Set[str] = {
    "linkedin.com", "www.linkedin.com",
    "indeed.com", "tr.indeed.com", "www.indeed.com",
    "glassdoor.com", "www.glassdoor.com",
    "kariyer.net", "www.kariyer.net",
    "secretcv.com", "www.secretcv.com",
    "yenibiris.com", "www.yenibiris.com",
    "jobs.lever.co", "boards.greenhouse.io",
    "workday.com",
}

# Storage configurations
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "") or os.getenv("EXPO_PUBLIC_SUPABASE_URL", "")
AVATARS_BUCKET: str = "avatars"
CVS_BUCKET: str = "cvs"
