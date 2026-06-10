# backend/services/job_scraper/normalizer.py

import re
from datetime import datetime
import pandas as pd

class JobNormalizer:
    _LOCATION_MAP: dict[str, str] = {
        'istanbul':  'Istanbul, Turkey',
        'i̇stanbul': 'Istanbul, Turkey',
        'ankara':    'Ankara, Turkey',
        'izmir':     'Izmir, Turkey',
        'i̇zmir':    'Izmir, Turkey',
        'bursa':     'Bursa, Turkey',
        'antalya':   'Antalya, Turkey',
        'remote':    'Turkey',
    }

    _WFH_WORK_TYPE: dict[str, str] = {
        "REMOTE":         "remote",
        "REMOTE_ALLOWED": "remote",
        "HYBRID":         "hybrid",
        "ON_SITE":        "office",
        "ONSITE":         "office",
    }

    _TEXT_WORK_TYPE: list[tuple[list[str], str]] = [
        (["remote", "uzaktan", "anywhere", "fully remote"], "remote"),
        (["hybrid", "hibrit"],                              "hybrid"),
        (["on-site", "in-office", "onsite"],                "office"),
    ]

    _LEVEL_SENIORITY: list[tuple[list[str], str]] = [
        (["director", "executive", "vp", "principal", "staff", "lead"], "lead"),
        (["senior"],                                                     "senior"),
        (["mid"],                                                        "mid"),
        (["entry", "associate", "junior", "intern", "graduate"],        "junior"),
    ]

    _TITLE_SENIORITY: list[tuple[list[str], str]] = [
        (["lead", "principal", "staff", "vp", "director"], "lead"),
        (["senior", " sr ", "sr."],                        "senior"),
        (["junior", "jr.", "intern", "entry", "graduate"], "junior"),
    ]

    SENIORITY_COMPATIBLE: dict[str, list[str]] = {
        'junior': ['junior'],
        'mid':    ['mid'],
        'senior': ['senior'],
        'lead':   ['lead', 'senior'],
    }

    def normalize_location(self, loc: str) -> str:
        t = loc.strip()
        mapped = self._LOCATION_MAP.get(t.lower())
        if mapped:
            return mapped
        if not t:
            return 'Istanbul, Turkey'
        if 'turkey' not in t.lower() and ',' not in t:
            return f'{t}, Turkey'
        return t

    def determine_work_type(self, row: pd.Series) -> str:
        wfh = str(row.get("work_from_home_type", "") or "").upper()
        if wfh in self._WFH_WORK_TYPE:
            return self._WFH_WORK_TYPE[wfh]
        if row.get("is_remote") is True:
            return "remote"
        text = (str(row.get("title", "")) + " " + str(row.get("description", "") or "")).lower()
        for keywords, result in self._TEXT_WORK_TYPE:
            if any(kw in text for kw in keywords):
                return result
        return "unknown"

    def determine_seniority(self, row: pd.Series) -> str:
        level = str(row.get("job_level", "") or "").lower()
        for keywords, result in self._LEVEL_SENIORITY:
            if any(x in level for x in keywords):
                return result
        title = str(row.get("title", "")).lower()
        for keywords, result in self._TITLE_SENIORITY:
            if any(x in title for x in keywords):
                return result
        return "unknown"

    def determine_company_size(self, row: pd.Series) -> str | None:
        v = row.get("company_num_employees")
        if v is None:
            return None
        try:
            if pd.isna(float(str(v))):
                return None
        except (TypeError, ValueError):
            pass
        return str(v)

    def map_row(self, row: pd.Series, index: int) -> dict:
        def safe_float(v):
            try:
                f = float(v)
                return None if pd.isna(f) else f
            except (TypeError, ValueError):
                return None

        date_posted = row.get("date_posted")
        if date_posted and hasattr(date_posted, "isoformat"):
            posted_at = date_posted.isoformat()
        elif date_posted:
            posted_at = str(date_posted)
        else:
            posted_at = datetime.utcnow().isoformat()

        skills_raw = row.get("skills")
        if isinstance(skills_raw, list):
            skills = [str(s) for s in skills_raw if s][:12]
        elif isinstance(skills_raw, str) and skills_raw:
            skills = [s.strip() for s in skills_raw.split(",") if s.strip()][:12]
        else:
            skills = []

        currency = str(row.get("currency", "") or "").strip() or "USD"
        site = str(row.get("site", "job"))
        job_id = str(row.get("id", index))

        return {
            "id":              f"{site}_{job_id}",
            "title":           str(row.get("title", "")),
            "company":         str(row.get("company", "")),
            "location":        str(row.get("location", "")),
            "salary_min":      safe_float(row.get("min_amount")),
            "salary_max":      safe_float(row.get("max_amount")),
            "salary_currency": currency,
            "work_type":       self.determine_work_type(row),
            "employment_type": str(row.get("job_type", "") or "").lower(),
            "seniority":       self.determine_seniority(row),
            "sector":          str(row.get("company_industry", "") or ""),
            "company_size":    self.determine_company_size(row),
            "description":     str(row.get("description", "") or "")[:10000],
            "apply_url":       str(row.get("job_url", "")),
            "fetched_at":      posted_at,
            "tags":            skills,
            "site":            site,
        }

    def apply_filters(self, jobs: list[dict], work_type: str, seniority_list: list[str]) -> list[dict]:
        filtered = jobs

        if work_type and work_type != "any":
            filtered = [j for j in filtered if j["work_type"] in (work_type, "unknown")]

        if seniority_list:
            compatible: set[str] = {"unknown"}
            for s in seniority_list:
                compatible.update(self.SENIORITY_COMPATIBLE.get(s, [s]))
            filtered = [j for j in filtered if j["seniority"] in compatible]

        return filtered

    def normalize_title(self, t: str) -> str:
        return re.sub(r'\W+', ' ', t.lower()).strip()

    def dedupe_prefer_indeed(self, jobs: list[dict]) -> list[dict]:
        priority = {"indeed": 0, "google": 1}
        best: dict[tuple, dict] = {}

        for job in jobs:
            key = (job["company"].lower().strip(), self.normalize_title(job["title"]))
            site = job.get("site", "other")
            if key not in best:
                best[key] = job
            else:
                current_priority = priority.get(best[key].get("site", "other"), 2)
                new_priority = priority.get(site, 2)
                if new_priority < current_priority:
                    best[key] = job

        return list(best.values())

    def merge_jobs(self, existing: list[dict], incoming: list[dict]) -> list[dict]:
        seen = {j["id"] for j in existing}
        result = list(existing)
        for job in incoming:
            if job["id"] not in seen:
                seen.add(job["id"])
                result.append(job)
        return result
