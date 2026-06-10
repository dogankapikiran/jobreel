# backend/services/ai/response_parser.py

import json
import re
import ast
from typing import Any, Dict

class AIResponseParser:
    def parse_cv_response(self, raw_content: str) -> Dict[str, Any]:
        """Parses CV parsing result from raw JSON string."""
        return json.loads(raw_content)

    def _to_str_list(self, val: object) -> list[str]:
        if isinstance(val, list):
            return [str(s) for s in val if s and isinstance(s, (str, int, float))]
        if isinstance(val, str) and val.strip():
            try:
                parsed = ast.literal_eval(val.strip())
                if isinstance(parsed, list):
                    return [str(s) for s in parsed if s]
            except (ValueError, SyntaxError):
                pass
        return []

    def parse_scoring_response(self, raw_content: str) -> Dict[int, Dict[str, Any]]:
        """Parses job scoring batch result from raw JSON string with regex fallback."""
        try:
            data = json.loads(raw_content)
        except json.JSONDecodeError:
            # Model sometimes writes } instead of ] — extract robust entries with regex
            data = {}
            for m in re.finditer(
                r'"(\d+)"\s*:\s*\{\s*"score"\s*:\s*(\d+)\s*,\s*"reason"\s*:\s*"([^"]*)"',
                raw_content,
            ):
                data[m.group(1)] = {"score": int(m.group(2)), "reason": m.group(3)}

        result: Dict[int, Dict[str, Any]] = {}
        for k, v in data.items():
            if str(k).isdigit() and isinstance(v, dict):
                result[int(k)] = {
                    "score": max(0, min(50, int(v.get("score", 25)))),
                    "reason": str(v.get("reason", "")),
                    "matched_skills": self._to_str_list(v.get("matched_skills")),
                    "missing_skills": self._to_str_list(v.get("missing_skills")),
                }
        return result
