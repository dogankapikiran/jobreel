# backend/infrastructure/groq_client.py

import logging
from typing import Any, Dict, List
import groq
from core.ai_client import AIClient
from services.ai.prompt_registry import PromptRegistry
from services.ai.response_parser import AIResponseParser
from core.config import GROQ_MODEL, GROQ_CV_MAX_TOKENS, GROQ_SCORE_MAX_TOKENS

logger = logging.getLogger(__name__)

class GroqAIClient(AIClient):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = groq.AsyncGroq(api_key=self.api_key) if api_key else None
        self.parser = AIResponseParser()

    async def parse_cv(self, text: str) -> Dict[str, Any]:
        if not self.client:
            raise ValueError("Groq AIClient is not configured with an API key")
        
        msg = await self.client.chat.completions.create(
            model=GROQ_MODEL,
            max_tokens=GROQ_CV_MAX_TOKENS,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": PromptRegistry.CV_PARSER_SYSTEM,
                },
                {
                    "role": "user",
                    "content": PromptRegistry.CV_PARSER_USER_TEMPLATE.format(text=text[:10000]),
                },
            ],
        )
        content = msg.choices[0].message.content.strip()
        return self.parser.parse_cv_response(content)

    async def score_jobs_batch(self, jobs: List[Dict[str, Any]], cv_parsed: Dict[str, Any]) -> Dict[int, Dict[str, Any]]:
        if not self.client or not jobs:
            return {}

        cv_title = str(cv_parsed.get("title") or "")[:120]
        cv_skills = [
            str(s)[:60] for s in (cv_parsed.get("skills") or [])
            if isinstance(s, (str, int, float)) and str(s).strip()
        ][:10]
        cv_roles = [
            str(e.get("role", ""))[:80]
            for e in (cv_parsed.get("experience") or [])
            if isinstance(e, dict)
        ][:3]

        job_lines = []
        for i, job in enumerate(jobs):
            title = job.get("title") or ""
            company = job.get("company") or ""
            desc = (job.get("description") or "")[:200]
            job_lines.append(f"{i}. {title} @ {company} — {desc}")

        prompt = PromptRegistry.JOB_SCORER_USER_TEMPLATE.format(
            cv_title=cv_title,
            cv_skills=cv_skills,
            cv_roles=cv_roles,
            jobs_block="\n".join(job_lines)
        )

        try:
            msg = await self.client.chat.completions.create(
                model=GROQ_MODEL,
                max_tokens=GROQ_SCORE_MAX_TOKENS,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": PromptRegistry.JOB_SCORER_SYSTEM,
                    },
                    {"role": "user", "content": prompt},
                ],
            )
            raw = msg.choices[0].message.content.strip()
            return self.parser.parse_scoring_response(raw)
        except Exception as e:
            logger.error("[AI Score] Groq batch error: %s", e)
            return {}
