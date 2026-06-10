# backend/services/job_service/scorer.py

from typing import Any, Dict, List

class PreferenceScorer:
    def calculate_score(
        self,
        job: Dict[str, Any],
        user_prefs: Dict[str, Any],
        filter_work_type: str,
        filter_seniority: List[str],
        filter_sectors: List[str],
    ) -> int:
        score = 25  # neutral base

        eff_sectors = filter_sectors or user_prefs.get("sectors", [])
        eff_work_type = filter_work_type if filter_work_type != "any" else user_prefs.get("work_type", "any")
        eff_seniority = filter_seniority or user_prefs.get("seniority", [])

        job_sector = (job.get("sector") or "").lower()
        job_wt = job.get("work_type") or "unknown"
        job_seniority = job.get("seniority") or "unknown"

        if eff_sectors:
            if any(s.lower() in job_sector or job_sector in s.lower() for s in eff_sectors):
                score += 15
            elif job_sector:
                score -= 15

        eff_work_types = (
            [w.strip() for w in eff_work_type.split(",") if w.strip()]
            if eff_work_type not in ("any", "")
            else []
        )
        if eff_work_types and job_wt != "unknown":
            if job_wt in eff_work_types:
                score += 5
            else:
                score -= 5

        if eff_seniority and job_seniority != "unknown":
            if job_seniority in eff_seniority:
                score += 5
            else:
                score -= 5

        return max(0, min(50, score))
