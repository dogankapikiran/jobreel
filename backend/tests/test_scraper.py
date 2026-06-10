# backend/tests/test_scraper.py

import sys
import os
import pandas as pd

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from services.job_scraper.translator import KeywordTranslator
from services.job_scraper.normalizer import JobNormalizer

def test_keyword_translator():
    translator = KeywordTranslator()
    
    # Test translations
    assert translator.translate_keyword("yazılım geliştirici") == "software developer"
    assert translator.translate_keyword("Proje Yöneticisi ") == "project manager"
    
    # Test fallback
    assert translator.translate_keyword("nonexistent title") == "nonexistent title"
    
    # Test sector terms
    assert translator.get_sector_term("Yazılım & Teknoloji") == "software developer"
    assert translator.get_sector_term("Unknown Sector") == "Unknown Sector"


def test_job_normalizer():
    normalizer = JobNormalizer()

    # Test location normalization
    assert normalizer.normalize_location("istanbul") == "Istanbul, Turkey"
    assert normalizer.normalize_location("Kocaeli") == "Kocaeli, Turkey"
    assert normalizer.normalize_location("Istanbul, Turkey") == "Istanbul, Turkey"
    assert normalizer.normalize_location("") == "Istanbul, Turkey"

    # Test work type determination
    row_remote = pd.Series({"work_from_home_type": "REMOTE", "is_remote": False})
    assert normalizer.determine_work_type(row_remote) == "remote"

    row_text = pd.Series({"work_from_home_type": "", "is_remote": False, "title": "Hybrid Software Engineer"})
    assert normalizer.determine_work_type(row_text) == "hybrid"

    # Test seniority determination
    row_senior = pd.Series({"job_level": "Senior Developer"})
    assert normalizer.determine_seniority(row_senior) == "senior"

    row_junior = pd.Series({"job_level": "", "title": "Junior Software Engineer"})
    assert normalizer.determine_seniority(row_junior) == "junior"

    # Test company size
    row_size = pd.Series({"company_num_employees": 100})
    assert normalizer.determine_company_size(row_size) == "100"

    # Test deduplication
    jobs = [
        {"id": "linkedin_1", "company": "Google", "title": "Software Engineer", "site": "linkedin"},
        {"id": "indeed_1", "company": "Google", "title": "Software Engineer", "site": "indeed"},
    ]
    deduped = normalizer.dedupe_prefer_indeed(jobs)
    assert len(deduped) == 1
    assert deduped[0]["site"] == "indeed"
