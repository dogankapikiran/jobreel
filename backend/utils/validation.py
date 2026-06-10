import re
from urllib.parse import urlparse
from core.config import ALLOWED_JOB_DOMAINS

def is_safe_url(url: str | None) -> bool:
    """Validate if the provided URL is a safe URL belonging to permitted job domains."""
    if not url:
        return False
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            return False
        hostname = parsed.hostname or ""
        return hostname in ALLOWED_JOB_DOMAINS or any(
            hostname.endswith("." + d) for d in ALLOWED_JOB_DOMAINS
        )
    except Exception:
        return False

def limit_str_length(val: object, max_len: int) -> str | None:
    """Limit the string representation of an object to a maximum length."""
    if val is None:
        return None
    return str(val)[:max_len]

def validate_exponent_push_token(token: str) -> bool:
    """Check if the provided token follows the Exponent push token format."""
    if not token:
        return False
    return bool(re.match(r'^ExponentPushToken\[[\w-]+\]$', token))

def parse_comma_separated_list(val: object) -> list[str]:
    """Parse comma-separated strings or list objects into a clean list of strings."""
    if not val:
        return []
    if isinstance(val, list):
        return [str(item).strip() for item in val if str(item).strip()]
    if isinstance(val, str):
        return [s.strip() for s in val.split(",") if s.strip()]
    return [str(val).strip()]
