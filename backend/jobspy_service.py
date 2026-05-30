import asyncio
import re
import time
from datetime import datetime

import pandas as pd
import requests
from jobspy import scrape_jobs

_cache: dict = {}
_scraping: set[str] = set()  # background scrape takibi
CACHE_TTL = 3600
RESULTS_PER_TERM = 50
RESULTS_PER_TERM_BG = 250
PAGE_SIZE = 20

# Türkçe iş unvanı → LinkedIn/Indeed'in İngilizce indexed karşılıkları
# LinkedIn TR'de ilanlar büyük oranda İngilizce başlıkla yayınlandığından TR terimler sonuç vermez.
_KEYWORD_TR_EN: dict[str, str] = {
    'proje yöneticisi':           'project manager',
    'proje uzmanı':               'project specialist',
    'proje koordinatörü':         'project coordinator',
    'yazılım geliştirici':        'software developer',
    'yazılım mühendisi':          'software engineer',
    'ön uç geliştirici':          'frontend developer',
    'arka uç geliştirici':        'backend developer',
    'veri analisti':              'data analyst',
    'veri bilimci':               'data scientist',
    'ürün yöneticisi':            'product manager',
    'satış uzmanı':               'sales specialist',
    'satış temsilcisi':           'sales representative',
    'satış yöneticisi':           'sales manager',
    'iş geliştirme uzmanı':       'business development specialist',
    'iş geliştirme müdürü':       'business development manager',
    'pazarlama uzmanı':           'marketing specialist',
    'pazarlama müdürü':           'marketing manager',
    'insan kaynakları uzmanı':    'hr specialist',
    'muhasebeci':                 'accountant',
    'mali müşavir':               'financial advisor',
    'operasyon uzmanı':           'operations specialist',
    'lojistik uzmanı':            'logistics specialist',
    'tedarik zinciri uzmanı':     'supply chain specialist',
    'kalite güvence uzmanı':      'quality assurance specialist',
    'müşteri hizmetleri uzmanı':  'customer service specialist',
    'grafik tasarımcı':           'graphic designer',
    'ui/ux tasarımcı':            'ui ux designer',
    'elektrik mühendisi':         'electrical engineer',
    'makine mühendisi':           'mechanical engineer',
    'inşaat mühendisi':           'civil engineer',
}


def _translate_keyword(kw: str) -> str:
    """Türkçe iş unvanını İngilizce karşılığına çevirir. Eşleşme yoksa orijinali döner."""
    return _KEYWORD_TR_EN.get(kw.lower().strip(), kw)


SECTOR_TERMS: dict[str, str] = {
    'Yazılım & Teknoloji': 'software developer',
    'E-ticaret':           'e-commerce developer',
    'Fintech':             'fintech developer',
    'Gaming':              'game developer',
    'SaaS':                'SaaS developer',
    'Lojistik':            'logistics software developer',
    'Sağlık':              'health tech developer',
    'Eğitim':              'edtech developer',
    'Medya':               'media technology developer',
    'Üretim':              'manufacturing software developer',
}

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

def _normalize_location(loc: str) -> str:
    t = loc.strip()
    mapped = _LOCATION_MAP.get(t.lower())
    if mapped:
        return mapped
    if not t:
        return 'Istanbul, Turkey'
    # Bilinmeyen şehirlere ", Turkey" ekle (LinkedIn "Kocaeli" yerine "Kocaeli, Turkey" ister)
    if 'turkey' not in t.lower() and ',' not in t:
        return f'{t}, Turkey'
    return t


SENIORITY_COMPATIBLE: dict[str, list[str]] = {
    'junior': ['junior'],
    'mid':    ['mid'],
    'senior': ['senior'],
    'lead':   ['lead', 'senior'],
}


def _cache_key(terms: list[str], location: str) -> str:
    # Filtreler scrape parametresi değil, post-process adımı — cache key'e dahil etme
    return f"{'|'.join(sorted(terms))}||{location.lower()}"


# ─── Alan eşleme ───────────────────────────────────────────────────────────

def _work_type(row: pd.Series) -> str:
    # En güvenilir: LinkedIn'in explicit alanı
    wfh = str(row.get("work_from_home_type", "") or "").upper()
    if wfh in ("REMOTE", "REMOTE_ALLOWED"):
        return "remote"
    if wfh == "HYBRID":
        return "hybrid"
    if wfh in ("ON_SITE", "ONSITE"):
        return "office"

    # is_remote=True güvenilir, False DEĞİL (hybrid de False döner)
    if row.get("is_remote") is True:
        return "remote"

    # Metin ipuçları (başlık veya açıklama varsa)
    text = (str(row.get("title", "")) + " " + str(row.get("description", "") or "")).lower()
    if "remote" in text or "uzaktan" in text or "anywhere" in text or "fully remote" in text:
        return "remote"
    if "hybrid" in text or "hibrit" in text:
        return "hybrid"
    if "on-site" in text or "in-office" in text or "onsite" in text:
        return "office"

    return "unknown"


def _seniority(row: pd.Series) -> str:
    level = str(row.get("job_level", "") or "").lower()
    if any(x in level for x in ("director", "executive", "vp", "principal", "staff")):
        return "lead"
    if "lead" in level:
        return "lead"
    if "senior" in level:
        return "senior"
    if "mid" in level:
        return "mid"
    if any(x in level for x in ("entry", "associate", "junior", "intern", "graduate")):
        return "junior"
    title = str(row.get("title", "")).lower()
    if any(x in title for x in ("lead", "principal", "staff", "vp", "director")):
        return "lead"
    if any(x in title for x in ("senior", " sr ", "sr.")):
        return "senior"
    if any(x in title for x in ("junior", "jr.", "intern", "entry", "graduate")):
        return "junior"
    return "unknown"


def _company_size(row: pd.Series) -> str | None:
    v = row.get("company_num_employees")
    if v is None:
        return None
    try:
        if pd.isna(float(str(v))):
            return None
    except (TypeError, ValueError):
        pass
    return str(v)


def _map_row(row: pd.Series, index: int) -> dict:
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
        "work_type":       _work_type(row),
        "employment_type": str(row.get("job_type", "") or "").lower(),
        "seniority":       _seniority(row),
        "sector":          str(row.get("company_industry", "") or ""),
        "company_size":    _company_size(row),
        "description":     str(row.get("description", "") or "")[:10000],
        "apply_url":       str(row.get("job_url", "")),
        "fetched_at":      posted_at,
        "tags":            skills,
        "site":            site,
    }


# ─── Scraping ──────────────────────────────────────────────────────────────

def _scrape_single(
    search_term: str,
    location: str,
    is_remote: bool | None,
    fetch_description: bool = False,
    sites: list[str] | None = None,
    results_wanted: int = RESULTS_PER_TERM,
) -> list[dict]:
    try:
        kwargs: dict = dict(
            site_name=sites if sites is not None else ["linkedin", "indeed"],
            search_term=search_term,
            location=_normalize_location(location),
            results_wanted=results_wanted,
            hours_old=720,
            linkedin_fetch_description=fetch_description,
        )
        if is_remote is True:
            kwargs["is_remote"] = True
        df = scrape_jobs(**kwargs)
        if df is None or df.empty:
            return []
        return [_map_row(row, i) for i, (_, row) in enumerate(df.iterrows())]
    except Exception as e:
        print(f"[JobSpy] scrape error ({search_term}): {e}")
        return []


def _build_search_terms(keyword: str, sectors: list[str], extra_keywords: list[str] | None = None) -> list[str]:
    terms: list[str] = []
    if keyword:
        translated = _translate_keyword(keyword)
        terms.append(translated)
        # Keyword varken sektör eşlemesi ekleme — developer olmayan kullanıcıları kirletir.
        # Sadece kişiselleştirme extra keyword'lerini ekle.
        for ek in (extra_keywords or []):
            ek_translated = _translate_keyword(ek)
            if ek_translated.lower() not in [t.lower() for t in terms]:
                terms.append(ek_translated)
    else:
        for sector in sectors:
            mapped = SECTOR_TERMS.get(sector, sector)
            if mapped not in terms:
                terms.append(mapped)
        if not terms:
            terms = ["software developer"]
    return terms[:3]


def _apply_filters(
    jobs: list[dict],
    work_type: str,
    seniority_list: list[str],
) -> list[dict]:
    filtered = jobs

    if work_type and work_type != "any":
        filtered = [j for j in filtered if j["work_type"] in (work_type, "unknown")]

    if seniority_list:
        compatible: set[str] = {"unknown"}
        for s in seniority_list:
            compatible.update(SENIORITY_COMPATIBLE.get(s, [s]))
        filtered = [j for j in filtered if j["seniority"] in compatible]

    return filtered


def _normalize_title(t: str) -> str:
    return re.sub(r'\W+', ' ', t.lower()).strip()


def _dedupe_prefer_indeed(jobs: list[dict]) -> list[dict]:
    """Aynı şirket+pozisyon için Indeed > Google > LinkedIn tercih sırası ile deduplicate eder."""
    # Öncelik sırası: indeed > google > linkedin/diğer
    priority = {"indeed": 0, "google": 1}
    best: dict[tuple, dict] = {}

    for job in jobs:
        key = (job["company"].lower().strip(), _normalize_title(job["title"]))
        site = job.get("site", "other")
        if key not in best:
            best[key] = job
        else:
            current_priority = priority.get(best[key].get("site", "other"), 2)
            new_priority = priority.get(site, 2)
            if new_priority < current_priority:
                best[key] = job

    return list(best.values())


def _merge(existing: list[dict], incoming: list[dict]) -> list[dict]:
    seen = {j["id"] for j in existing}
    result = list(existing)
    for job in incoming:
        if job["id"] not in seen:
            seen.add(job["id"])
            result.append(job)
    return result


async def _scrape_background(
    key: str,
    all_terms: list[str],
    location: str,
    is_remote: bool | None,
    ts: float,
) -> None:
    """Tüm terimleri description fetch açık olarak scrape eder, cache'i zengin data ile günceller."""
    try:
        tasks = [
            asyncio.to_thread(_scrape_single, term, location, is_remote, False, ["linkedin", "indeed"], RESULTS_PER_TERM_BG)
            for term in all_terms
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        incoming: list[dict] = []
        for r in results:
            if not isinstance(r, Exception):
                incoming.extend(r)

        incoming = _dedupe_prefer_indeed(incoming)
        existing = _cache.get(key, {}).get("jobs", [])
        merged = _merge(existing, incoming)
        merged = _dedupe_prefer_indeed(merged)
        _cache[key] = {"ts": ts, "jobs": merged, "partial": False}
        li_count = sum(1 for j in merged if j.get("site") == "linkedin")
        in_count = sum(1 for j in merged if j.get("site") == "indeed")
        print(f"[JobSpy] Background done: {len(merged)} jobs (LinkedIn={li_count}, Indeed={in_count}) | key={key[:40]}")
    finally:
        _scraping.discard(key)


# ─── Public API ────────────────────────────────────────────────────────────

async def fetch_jobs(
    keyword: str,
    location: str,
    sectors: list[str],
    extra_keywords: list[str],
    work_type: str,
    seniority_list: list[str],
    page: int,
) -> tuple[list[dict], int, bool]:
    search_terms = _build_search_terms(keyword, sectors, extra_keywords)
    key = _cache_key(search_terms, location)
    now = time.time()
    partial = False

    entry = _cache.get(key)
    cache_valid = entry is not None and now - entry["ts"] <= CACHE_TTL

    if cache_valid:
        raw = entry["jobs"]
        partial = entry.get("partial", False)
    elif key in _scraping:
        # Background scrape devam ediyor — elimizdeki ile devam et
        raw = entry["jobs"] if entry else []
        partial = True
    else:
        # Cache miss: LinkedIn + Indeed'i paralel çek
        is_remote = True if work_type == "remote" else None
        half = max(RESULTS_PER_TERM // 2, 15)
        li_task = asyncio.to_thread(
            _scrape_single, search_terms[0], location, is_remote, False, ["linkedin"], half
        )
        in_task = asyncio.to_thread(
            _scrape_single, search_terms[0], location, is_remote, False, ["indeed"], half
        )
        li_jobs, in_jobs = await asyncio.gather(li_task, in_task, return_exceptions=True)

        first: list[dict] = []
        if isinstance(li_jobs, list):
            first.extend(li_jobs)
        if isinstance(in_jobs, list):
            first.extend(in_jobs)
        first = _dedupe_prefer_indeed(first)
        _cache[key] = {"ts": now, "jobs": first, "partial": True}
        partial = True
        li_count = sum(1 for j in first if j.get("site") == "linkedin")
        in_count = sum(1 for j in first if j.get("site") == "indeed")
        print(f"[JobSpy] Quick fetch: {len(first)} jobs (LinkedIn={li_count}, Indeed={in_count}) | term={search_terms[0]}")

        # Tüm terimleri description fetch açık olarak background'da çalıştır
        _scraping.add(key)
        asyncio.create_task(
            _scrape_background(key, search_terms, location, is_remote, now)
        )

        raw = first

    jobs = _apply_filters(raw, work_type, seniority_list)
    print(f"[JobSpy] After filter: {len(jobs)} jobs | partial={partial}")

    start = (page - 1) * PAGE_SIZE
    return jobs[start: start + PAGE_SIZE], len(jobs), partial


# ─── On-demand description fetch ───────────────────────────────────────────

_LI_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
}


def _extract_linkedin_job_id(apply_url: str) -> str | None:
    """Apply URL'sinden LinkedIn numerik job ID'sini çıkar."""
    matches = re.findall(r'\d{8,}', apply_url)
    return matches[-1] if matches else None


def _fetch_linkedin_description(linkedin_id: str) -> str:
    """LinkedIn public guest API ile tek ilanın açıklamasını çeker (~1-2s)."""
    url = f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{linkedin_id}"
    try:
        resp = requests.get(url, headers=_LI_HEADERS, timeout=15)
        if resp.status_code != 200:
            print(f"[LinkedIn] Guest API {resp.status_code} for {linkedin_id}")
            return ""

        raw = resp.text

        # Önce show-more-less-html__markup, sonra description__text dene
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

        # HTML entity'leri önce çöz
        for ent, ch in [('&amp;', '&'), ('&lt;', '<'), ('&gt;', '>'),
                        ('&nbsp;', ' '), ('&#39;', "'"), ('&quot;', '"')]:
            content = content.replace(ent, ch)
        content = re.sub(r'&#\d+;', '', content)

        # HTML → düz metin
        content = re.sub(r'<br\s*/?>', '\n', content, flags=re.IGNORECASE)
        content = re.sub(r'<li[^>]*>', '\n• ', content, flags=re.IGNORECASE)
        content = re.sub(r'<h[1-6][^>]*>(.*?)</h[1-6]>', r'\n\1\n', content, flags=re.DOTALL | re.IGNORECASE)
        content = re.sub(r'<p[^>]*>', '\n', content, flags=re.IGNORECASE)
        content = re.sub(r'<[^>]+>', '', content)
        content = re.sub(r'\n{3,}', '\n\n', content)
        return content.strip()[:10000]
    except Exception as e:
        print(f"[LinkedIn] Fetch error for {linkedin_id}: {e}")
        return ""


def _update_cache_description(job_id: str, desc: str) -> None:
    for entry in _cache.values():
        for job in entry.get("jobs", []):
            if job["id"] == job_id:
                job["description"] = desc


async def get_job_description(job_id: str) -> str:
    """Cache'teki ilana ait açıklamayı döndür; yoksa LinkedIn guest API ile çek."""
    cached_job: dict | None = None
    for entry in _cache.values():
        for job in entry.get("jobs", []):
            if job["id"] == job_id:
                cached_job = job
                break
        if cached_job:
            break

    if cached_job is None:
        return ""

    existing = cached_job.get("description", "").strip()
    if existing:
        return existing

    apply_url   = cached_job.get("apply_url", "")
    linkedin_id = _extract_linkedin_job_id(apply_url) if apply_url else None

    if not linkedin_id:
        print(f"[LinkedIn] No job ID extractable from: {apply_url}")
        return ""

    print(f"[LinkedIn] Direct fetch: linkedin_id={linkedin_id} ({cached_job.get('title')})")
    desc = await asyncio.to_thread(_fetch_linkedin_description, linkedin_id)

    if desc:
        _update_cache_description(job_id, desc)
        print(f"[LinkedIn] OK — {len(desc)} chars for {job_id}")
    else:
        print(f"[LinkedIn] Empty response for linkedin_id={linkedin_id}")

    return desc
