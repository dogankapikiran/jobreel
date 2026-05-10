import asyncio
import io
import json
import os
import random
from collections import Counter
from contextlib import asynccontextmanager
from typing import Optional

import groq
import httpx
import pdfplumber
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from supabase import create_client, Client

from auth import get_current_user, get_optional_user
from jobspy_service import fetch_jobs, get_job_description, PAGE_SIZE

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID", "")
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET", "")
LINKEDIN_REDIRECT_URI = os.getenv("LINKEDIN_REDIRECT_URI", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


# ── Push Notifications ────────────────────────────────────────────────────────

async def send_expo_push(token: str, title: str, body: str, data: dict | None = None) -> None:
    """Send a single push notification via Expo Push API."""
    if not token.startswith("ExponentPushToken"):
        return
    async with httpx.AsyncClient() as client:
        try:
            await client.post(
                "https://exp.host/--/api/v2/push/send",
                json={"to": token, "title": title, "body": body, "data": data or {}, "sound": "default"},
                headers={"Content-Type": "application/json"},
                timeout=10,
            )
        except Exception as e:
            print(f"[Push] Error: {e}")


async def send_daily_alerts() -> None:
    """Daily scheduler job: push notifications for active job alerts."""
    print("[Alerts] Running daily alert job…")
    db = get_supabase()

    alerts_res = db.table("job_alerts").select("*").eq("enabled", True).execute()
    alerts = alerts_res.data or []
    if not alerts:
        return

    user_ids = list({a["user_id"] for a in alerts})
    tokens_res = (
        db.table("profiles")
        .select("user_id, push_token")
        .in_("user_id", user_ids)
        .execute()
    )
    token_map = {
        r["user_id"]: r["push_token"]
        for r in (tokens_res.data or [])
        if r.get("push_token")
    }

    for alert in alerts:
        push_token = token_map.get(alert["user_id"])
        if not push_token:
            continue
        keyword = alert.get("keyword") or "software developer"
        location = alert.get("location") or "Istanbul, Turkey"
        seniority_list = alert.get("seniority") or []
        sectors = alert.get("sectors") or []
        work_type = alert.get("work_type") or "any"
        label = alert.get("label") or keyword

        try:
            _, total, _ = await fetch_jobs(
                keyword=keyword,
                location=location,
                sectors=sectors,
                extra_keywords=[],
                work_type=work_type,
                seniority_list=seniority_list,
                page=1,
            )
            count = min(total, 99)
            if count > 0:
                await send_expo_push(
                    push_token,
                    f"{label} — Yeni İlanlar",
                    f"Bugün {count}+ ilan bulundu. Hemen bak!",
                    {"keyword": keyword, "location": location},
                )
                print(f"[Alerts] Sent alert to {alert['user_id'][:8]}… ({count} jobs)")
        except Exception as e:
            print(f"[Alerts] Alert {alert.get('id')}: {e}")


async def send_company_alerts() -> None:
    """Daily scheduler job: notify users about new jobs at followed companies."""
    print("[Companies] Running company alert job…")
    db = get_supabase()

    follows_res = db.table("company_follows").select("user_id, company_name").execute()
    follows = follows_res.data or []
    if not follows:
        return

    user_ids = list({f["user_id"] for f in follows})
    tokens_res = (
        db.table("profiles")
        .select("user_id, push_token")
        .in_("user_id", user_ids)
        .execute()
    )
    token_map = {
        r["user_id"]: r["push_token"]
        for r in (tokens_res.data or [])
        if r.get("push_token")
    }

    for follow in follows:
        push_token = token_map.get(follow["user_id"])
        if not push_token:
            continue
        company = follow["company_name"]
        try:
            _, total, _ = await fetch_jobs(
                keyword=company,
                location="Istanbul, Turkey",
                sectors=[],
                extra_keywords=[],
                work_type="any",
                seniority_list=[],
                page=1,
            )
            count = min(total, 99)
            if count > 0:
                await send_expo_push(
                    push_token,
                    f"{company} — Açık Pozisyonlar",
                    f"{count}+ ilan var. Hemen incele!",
                    {"company_name": company},
                )
                print(f"[Companies] Notified {follow['user_id'][:8]}… re: {company} ({count} jobs)")
        except Exception as e:
            print(f"[Companies] {company}: {e}")


scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(send_daily_alerts, "cron", hour=6, minute=0, timezone="UTC")   # 09:00 TR
    scheduler.add_job(send_company_alerts, "cron", hour=7, minute=0, timezone="UTC")  # 10:00 TR
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(title="JobReel API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


# ── CV Parse Helpers ──────────────────────────────────────────────────────────

def _extract_cv_text(file_bytes: bytes) -> str:
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        return "\n".join(page.extract_text() or "" for page in pdf.pages)


async def _parse_cv_with_groq(text: str) -> dict:
    client = groq.AsyncGroq(api_key=GROQ_API_KEY)
    msg = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=1024,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a CV parser. Return ONLY valid JSON with this structure: "
                    '{"name":"string","title":"string","skills":["skill1"],'
                    '"experience":[{"company":"...","role":"...","years":1}],'
                    '"education":[{"school":"...","degree":"..."}],"summary":"string"}'
                ),
            },
            {
                "role": "user",
                "content": f"Parse this CV:\n\n{text[:4000]}",
            },
        ],
    )
    content = msg.choices[0].message.content.strip()
    return json.loads(content)


# ── Personalization ───────────────────────────────────────────────────────────

async def _get_user_context(user_id: str, db: Client) -> tuple[list[tuple[str, float]], dict, dict | None]:
    """
    Returns (weighted_terms, profile_prefs, cv_parsed).

    weighted_terms: [(term, weight), ...] toplam 1.0'a normalize edilmiş.
    Ağırlık hesabı: apply=3, save=2 puan; CV/profil title sabit 2 puan (baseline).
    En fazla 4 term, min %5 ağırlık filtresi.
    """
    counts: Counter = Counter()

    res = db.table("interactions") \
        .select("job_title, action") \
        .eq("user_id", user_id) \
        .in_("action", ["save", "apply"]) \
        .order("created_at", desc=True) \
        .limit(50) \
        .execute()

    for row in (res.data or []):
        title = (row.get("job_title") or "").strip()
        if not title:
            continue
        weight = 3 if row["action"] == "apply" else 2
        counts[title.lower()] += weight

    prof = db.table("profiles") \
        .select("title, linkedin_headline, preferences, cv_parsed") \
        .eq("user_id", user_id) \
        .maybe_single() \
        .execute()

    prefs: dict = {}
    cv_parsed: dict | None = None
    cv_title = ""
    if prof.data:
        for field in ("title", "linkedin_headline"):
            val = (prof.data.get(field) or "").strip()
            if val:
                cv_title = val.lower()
                break
        prefs = prof.data.get("preferences") or {}
        cv_parsed = prof.data.get("cv_parsed") or None

    # CV/profil title'ı baseline ağırlıkla ekle (interaction'da yoksa)
    if cv_title and cv_title not in counts:
        counts[cv_title] = 2

    total_pts = sum(counts.values()) or 1
    weighted_terms = [
        (title, cnt / total_pts)
        for title, cnt in counts.most_common(4)
        if cnt / total_pts >= 0.05
    ]

    # Filtreleme sonrası toplam 1.0'a yeniden normalize et
    kept_total = sum(w for _, w in weighted_terms)
    if kept_total > 0:
        weighted_terms = [(t, w / kept_total) for t, w in weighted_terms]

    if not weighted_terms:
        weighted_terms = [("software developer", 1.0)]

    print(f"[Feed] Weighted terms for {user_id[:8]}: {[(t, round(w, 2)) for t, w in weighted_terms]}")
    return weighted_terms, prefs, cv_parsed


def _calculate_preference_score(
    job: dict,
    user_prefs: dict,
    filter_work_type: str,
    filter_seniority: list[str],
    filter_sectors: list[str],
) -> int:
    """Kullanıcı tercihlerine göre 0-50 puan. Dil bağımsız, deterministik."""
    score = 25  # nötr base

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

    if eff_work_type != "any" and job_wt != "unknown":
        if job_wt == eff_work_type:
            score += 5
        else:
            score -= 5

    if eff_seniority and job_seniority != "unknown":
        if job_seniority in eff_seniority:
            score += 5
        else:
            score -= 5

    return max(0, min(50, score))


async def _generate_groq_batch(
    jobs: list[dict],
    cv_parsed: dict,
) -> dict[int, dict]:
    """Groq ile CV uyum skoru (0-50) + Türkçe gerekçe üret. Returns {job_index: {"score": int, "reason": str}}."""
    if not GROQ_API_KEY or not jobs:
        return {}

    cv_title = cv_parsed.get("title") or ""
    cv_skills = (cv_parsed.get("skills") or [])[:10]
    cv_roles = [e.get("role", "") for e in (cv_parsed.get("experience") or [])[:3]]

    job_lines = []
    for i, job in enumerate(jobs):
        title = job.get("title") or ""
        company = job.get("company") or ""
        desc = (job.get("description") or "")[:200]
        job_lines.append(f"{i}. {title} @ {company} — {desc}")

    prompt = (
        f"CV: başlık={cv_title}, yetenekler={cv_skills}, geçmiş_roller={cv_roles}\n\n"
        "Aşağıdaki iş ilanları için bu CV'ye göre değerlendir:\n"
        "- score (0-50): sadece CV'nin ilana semantik uyumu — tercihler değil, dil fark etmez\n"
        "- reason: kısa Türkçe gerekçe (max 8 kelime)\n"
        "- matched_skills: CV'de olan ve bu ilan için gerekli yetenekler (string listesi, maks 5)\n"
        "- missing_skills: ilanın gerektirdiği ancak CV'de olmayan yetenekler (string listesi, maks 5)\n\n"
        'Sadece JSON döndür: {"0": {"score": 35, "reason": "...", "matched_skills": [...], "missing_skills": [...]}, "1": {...}, ...}\n\n'
        + "\n".join(job_lines)
    )

    try:
        client = groq.AsyncGroq(api_key=GROQ_API_KEY)
        msg = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=1200,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "CV-iş uyum değerlendirmesi yap. "
                        "Score 0-50 arası olmalı. İngilizce ve Türkçe ilanları aynı şekilde değerlendir. "
                        "Sadece JSON döndür."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
        )
        raw = msg.choices[0].message.content.strip()
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            # Model bazen ] yerine } yazar — regex ile sağlam entry'leri çek
            import re
            data = {}
            for m in re.finditer(
                r'"(\d+)"\s*:\s*\{\s*"score"\s*:\s*(\d+)\s*,\s*"reason"\s*:\s*"([^"]*)"',
                raw,
            ):
                data[m.group(1)] = {"score": int(m.group(2)), "reason": m.group(3)}
        result: dict[int, dict] = {}
        for k, v in data.items():
            if str(k).isdigit() and isinstance(v, dict):
                result[int(k)] = {
                    "score": max(0, min(50, int(v.get("score", 25)))),
                    "reason": str(v.get("reason", "")),
                    "matched_skills": v.get("matched_skills") or [],
                    "missing_skills": v.get("missing_skills") or [],
                }
        return result
    except Exception as e:
        print(f"[AI Score] Groq batch error: {e}")
        return {}


# ── Groq Score Cache ─────────────────────────────────────────────────────────

groq_score_cache: dict[str, dict] = {}      # job_id → {"score": int, "reason": str}
groq_scoring_in_progress: set[str] = set()  # job_ids currently being scored by Groq


async def _score_jobs_background(jobs: list[dict], cv_parsed: dict) -> None:
    """Background: Groq CV match scoring — results stored in groq_score_cache."""
    ids = {j["id"] for j in jobs}
    groq_scoring_in_progress.update(ids)
    try:
        results = await _generate_groq_batch(jobs, cv_parsed)
        for i, job in enumerate(jobs):
            entry = results.get(i)
            if entry:
                groq_score_cache[job["id"]] = entry
    finally:
        groq_scoring_in_progress.difference_update(ids)


# ── Feed & Job ────────────────────────────────────────────────────────────────

@app.get("/api/feed")
async def feed(
    location: str = Query(default="Istanbul, Turkey"),
    keyword: str = Query(default=""),
    sectors: str = Query(default=""),
    work_type: str = Query(default="any"),
    seniority: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    user: dict | None = Depends(get_optional_user),
):
    sectors_list = [s.strip() for s in sectors.split(",") if s.strip()]
    seniority_list = [s.strip() for s in seniority.split(",") if s.strip()]

    user_prefs: dict = {}
    cv_parsed: dict | None = None

    if keyword:
        # Manuel arama: tek keyword, mevcut davranış
        jobs, total, partial = await fetch_jobs(
            keyword=keyword,
            location=location,
            sectors=sectors_list,
            extra_keywords=[],
            work_type=work_type,
            seniority_list=seniority_list,
            page=page,
        )
    elif user:
        weighted_terms, user_prefs, cv_parsed = await _get_user_context(user["sub"], get_supabase())

        # Her term için orantılı slot sayısı
        slots = {term: max(1, round(w * PAGE_SIZE)) for term, w in weighted_terms}

        mixed_jobs: list[dict] = []
        seen_ids: set[str] = set()
        any_partial = False
        term_totals: list[int] = []

        fetch_tasks = [
            fetch_jobs(
                keyword=term,
                location=location,
                sectors=sectors_list,
                extra_keywords=[],
                work_type=work_type,
                seniority_list=seniority_list,
                page=page,
            )
            for term, _ in weighted_terms
        ]
        fetch_results = await asyncio.gather(*fetch_tasks)

        for (term, _weight), (term_jobs, term_total, term_partial) in zip(weighted_terms, fetch_results):
            slot = slots[term]
            if term_partial:
                any_partial = True
            term_totals.append(term_total)
            count = 0
            for job in term_jobs:
                if count >= slot:
                    break
                if job["id"] not in seen_ids:
                    mixed_jobs.append(job)
                    seen_ids.add(job["id"])
                    count += 1

        random.shuffle(mixed_jobs)
        jobs = mixed_jobs
        partial = any_partial
        total = sum(
            int(w * t) for (_, w), t in zip(weighted_terms, term_totals)
        )
    else:
        jobs, total, partial = await fetch_jobs(
            keyword="software developer",
            location=location,
            sectors=sectors_list,
            extra_keywords=[],
            work_type=work_type,
            seniority_list=seniority_list,
            page=page,
        )

    if user and user_prefs:
        for job in jobs:
            job["_pref_score"] = _calculate_preference_score(
                job, user_prefs, work_type, seniority_list, sectors_list
            )

        if cv_parsed:
            # Apply cached Groq scores (default 25 if not yet computed)
            for job in jobs:
                cached = groq_score_cache.get(job["id"], {})
                job["score"] = job["_pref_score"] + cached.get("score", 25)
                if cached.get("reason"):
                    job["ai_reason"] = cached["reason"]
                if cached.get("matched_skills"):
                    job["matched_skills"] = cached["matched_skills"]
                if cached.get("missing_skills"):
                    job["missing_skills"] = cached["missing_skills"]
            # Kick off background scoring for jobs not cached and not already in progress
            to_score = [
                j for j in jobs
                if j["id"] not in groq_score_cache and j["id"] not in groq_scoring_in_progress
            ]
            if to_score:
                asyncio.create_task(_score_jobs_background(to_score, cv_parsed))
            # Tell frontend to come back once Groq scores are ready
            if any(j["id"] not in groq_score_cache for j in jobs):
                partial = True
        else:
            for job in jobs:
                job["score"] = job["_pref_score"] * 2

        for job in jobs:
            job.pop("_pref_score", None)
        # Sıralama yok — random.shuffle() zaten yapıldı

    return {"jobs": jobs, "total": total, "partial": partial}


@app.get("/api/job/{job_id}/description")
async def job_description(job_id: str):
    desc = await get_job_description(job_id)
    return {"description": desc}


# ── Profile ───────────────────────────────────────────────────────────────────

@app.get("/api/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    db = get_supabase()
    res = db.table("profiles").select("*").eq("user_id", user["sub"]).maybe_single().execute()
    return res.data or {}


@app.put("/api/profile")
async def update_profile(body: dict, user: dict = Depends(get_current_user)):
    db = get_supabase()
    db.table("profiles").upsert({"user_id": user["sub"], **body}, on_conflict="user_id").execute()
    return {"success": True}


@app.put("/api/profile/push-token")
async def save_push_token(body: dict, user: dict = Depends(get_current_user)):
    token = body.get("token", "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="Missing token")
    db = get_supabase()
    db.table("profiles").upsert({"user_id": user["sub"], "push_token": token}, on_conflict="user_id").execute()
    return {"success": True}


@app.post("/api/profile/avatar-url")
async def avatar_url(body: dict, user: dict = Depends(get_current_user)):
    db = get_supabase()
    ext = body.get("ext", "jpg")
    path = f"avatars/{user['sub']}.{ext}"
    res = db.storage.from_("avatars").create_signed_upload_url(path)
    signed_url = res.get("signedURL", "")
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/avatars/{path}"
    return {"signedUrl": signed_url, "path": path, "publicUrl": public_url}


@app.post("/api/profile/cv-url")
async def cv_upload_url(user: dict = Depends(get_current_user)):
    """Return a signed upload URL for uploading a CV PDF to Supabase Storage."""
    db = get_supabase()
    path = f"{user['sub']}/cv.pdf"
    # Eski dosyayı sil ki yeni imzalı URL çakışmasın
    try:
        db.storage.from_("cvs").remove([path])
    except Exception:
        pass
    res = db.storage.from_("cvs").create_signed_upload_url(path)
    signed_url = res.get("signedURL") or res.get("signed_url", "")
    return {"signedUrl": signed_url, "path": path}


@app.get("/api/profile/cv-signed-url")
async def cv_signed_url(user: dict = Depends(get_current_user)):
    db = get_supabase()
    path = f"{user['sub']}/cv.pdf"
    try:
        res = db.storage.from_("cvs").create_signed_url(path, 300)
        url = res.get("signedURL") or res.get("signed_url", "")
        if not url:
            raise HTTPException(status_code=404, detail="CV bulunamadı")
        return {"signedUrl": url}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="CV bulunamadı")


@app.post("/api/profile/cv-parse")
async def parse_cv(user: dict = Depends(get_current_user)):
    """Download user's CV from storage, parse with pdfplumber + Claude Haiku, save to profile."""
    if not GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="AI parse not configured")
    db = get_supabase()
    path = f"{user['sub']}/cv.pdf"
    try:
        file_bytes = db.storage.from_("cvs").download(path)
    except Exception:
        raise HTTPException(status_code=404, detail="CV bulunamadı — önce yükleyin")

    text = _extract_cv_text(file_bytes)
    if not text.strip():
        raise HTTPException(status_code=422, detail="PDF'den metin çıkarılamadı")

    try:
        parsed = await _parse_cv_with_groq(text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parse hatası: {e}")

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/cvs/{path}"
    db.table("profiles").upsert({
        "user_id": user["sub"],
        "cv_url": public_url,
        "cv_parsed": parsed,
    }, on_conflict="user_id").execute()

    return {"success": True, "parsed": parsed}


# ── Interactions ──────────────────────────────────────────────────────────────

@app.post("/api/interactions")
async def post_interaction(body: dict, user: dict = Depends(get_current_user)):
    db = get_supabase()
    db.table("interactions").insert({
        "user_id": user["sub"],
        "job_id": body.get("job_id"),
        "action": body.get("action"),
        "duration_seconds": body.get("duration_seconds"),
        "job_title": body.get("job_title"),
        "job_company": body.get("job_company"),
        "job_location": body.get("job_location"),
        "job_sector": body.get("job_sector"),
        "job_work_type": body.get("job_work_type"),
        "job_seniority": body.get("job_seniority"),
        "job_url": body.get("job_url"),
    }).execute()
    return {"success": True}


@app.get("/api/saved")
async def get_saved(user: dict = Depends(get_current_user)):
    db = get_supabase()
    res = db.table("interactions") \
        .select("job_id,job_title,job_company,job_location,job_sector,job_work_type,job_seniority,job_url,created_at") \
        .eq("user_id", user["sub"]) \
        .eq("action", "save") \
        .order("created_at", desc=True) \
        .execute()
    return res.data or []


@app.delete("/api/saved/{job_id}")
async def unsave_job(job_id: str, user: dict = Depends(get_current_user)):
    db = get_supabase()
    db.table("interactions") \
        .delete() \
        .eq("user_id", user["sub"]) \
        .eq("job_id", job_id) \
        .eq("action", "save") \
        .execute()
    return {"success": True}


@app.get("/api/applications")
async def get_applications(user: dict = Depends(get_current_user)):
    db = get_supabase()
    res = db.table("interactions") \
        .select("*") \
        .eq("user_id", user["sub"]) \
        .eq("action", "apply") \
        .order("created_at", desc=True) \
        .execute()
    return res.data or []


# ── Job Alerts ────────────────────────────────────────────────────────────────

@app.get("/api/alerts")
async def get_alerts(user: dict = Depends(get_current_user)):
    db = get_supabase()
    res = db.table("job_alerts") \
        .select("*") \
        .eq("user_id", user["sub"]) \
        .order("created_at", desc=True) \
        .execute()
    return res.data or []


@app.post("/api/alerts")
async def create_alert(body: dict, user: dict = Depends(get_current_user)):
    db = get_supabase()
    seniority = body.get("seniority") or []
    if isinstance(seniority, str):
        seniority = [s.strip() for s in seniority.split(",") if s.strip()]
    sectors = body.get("sectors") or []
    if isinstance(sectors, str):
        sectors = [s.strip() for s in sectors.split(",") if s.strip()]

    res = db.table("job_alerts").insert({
        "user_id": user["sub"],
        "label": body.get("label", "").strip(),
        "keyword": body.get("keyword", "").strip(),
        "location": body.get("location", "Istanbul, Turkey").strip(),
        "work_type": body.get("work_type", "any"),
        "seniority": seniority,
        "sectors": sectors,
        "enabled": True,
    }).execute()
    return res.data[0] if res.data else {"success": True}


@app.patch("/api/alerts/{alert_id}")
async def toggle_alert(alert_id: str, body: dict, user: dict = Depends(get_current_user)):
    db = get_supabase()
    db.table("job_alerts") \
        .update({"enabled": body.get("enabled", True)}) \
        .eq("id", alert_id) \
        .eq("user_id", user["sub"]) \
        .execute()
    return {"success": True}


@app.delete("/api/alerts/{alert_id}")
async def delete_alert(alert_id: str, user: dict = Depends(get_current_user)):
    db = get_supabase()
    db.table("job_alerts") \
        .delete() \
        .eq("id", alert_id) \
        .eq("user_id", user["sub"]) \
        .execute()
    return {"success": True}


# ── Company Follows ───────────────────────────────────────────────────────────

@app.get("/api/companies/following")
async def get_following(user: dict = Depends(get_current_user)):
    db = get_supabase()
    res = db.table("company_follows") \
        .select("company_name") \
        .eq("user_id", user["sub"]) \
        .order("created_at", desc=True) \
        .execute()
    return [r["company_name"] for r in (res.data or [])]


@app.post("/api/companies/follow")
async def follow_company(body: dict, user: dict = Depends(get_current_user)):
    name = (body.get("company_name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Missing company_name")
    db = get_supabase()
    db.table("company_follows").upsert({
        "user_id": user["sub"],
        "company_name": name,
    }).execute()
    return {"success": True}


@app.delete("/api/companies/follow/{company_name}")
async def unfollow_company(company_name: str, user: dict = Depends(get_current_user)):
    db = get_supabase()
    db.table("company_follows") \
        .delete() \
        .eq("user_id", user["sub"]) \
        .eq("company_name", company_name) \
        .execute()
    return {"success": True}


# ── LinkedIn Connect ──────────────────────────────────────────────────────────

@app.post("/api/linkedin/connect")
async def connect_linkedin(body: dict, user: dict = Depends(get_current_user)):
    code: Optional[str] = body.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")
    if not LINKEDIN_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="LinkedIn not configured")

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": LINKEDIN_REDIRECT_URI,
                "client_id": LINKEDIN_CLIENT_ID,
                "client_secret": LINKEDIN_CLIENT_SECRET,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="LinkedIn token exchange failed")

        access_token = token_res.json().get("access_token")

        profile_res = await client.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if profile_res.status_code != 200:
            raise HTTPException(status_code=400, detail="LinkedIn profile fetch failed")

        li = profile_res.json()

    db = get_supabase()
    db.table("profiles").upsert({
        "user_id": user["sub"],
        "linkedin_connected": True,
        "linkedin_sub": li.get("sub"),
        "linkedin_name": li.get("name"),
        "linkedin_headline": li.get("headline"),
        "linkedin_photo_url": li.get("picture"),
    }, on_conflict="user_id").execute()

    return {
        "success": True,
        "name": li.get("name"),
        "headline": li.get("headline"),
        "photo_url": li.get("picture"),
    }


@app.delete("/api/linkedin/connect")
async def disconnect_linkedin(user: dict = Depends(get_current_user)):
    db = get_supabase()
    db.table("profiles").update({
        "linkedin_connected": False,
        "linkedin_sub": None,
        "linkedin_name": None,
        "linkedin_headline": None,
        "linkedin_photo_url": None,
    }).eq("user_id", user["sub"]).execute()
    return {"success": True}


# ── LinkedIn Callback ─────────────────────────────────────────────────────────

@app.get("/linkedin/callback")
async def linkedin_callback(code: str = Query(default=""), error: str = Query(default="")):
    if error:
        return RedirectResponse(url=f"jobreel://linkedin-callback?error={error}")
    return RedirectResponse(url=f"jobreel://linkedin-callback?code={code}")


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}
