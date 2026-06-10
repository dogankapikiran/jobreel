from fastapi import APIRouter, Depends, HTTPException, Request
from auth import get_current_user
from api.dependencies import get_db_repository
from api.limiter import limiter
from core.database import DatabaseRepository
from utils.validation import is_safe_url, limit_str_length

router = APIRouter()

ALLOWED_ACTIONS = {"view", "save", "apply", "skip", "unsave"}


@router.post("/api/interactions")
@limiter.limit("60/minute")
async def post_interaction(
    request: Request,
    body: dict,
    user: dict = Depends(get_current_user),
    db_repo: DatabaseRepository = Depends(get_db_repository)
):
    action = body.get("action", "")
    if action not in ALLOWED_ACTIONS:
        raise HTTPException(status_code=400, detail="Geçersiz aksiyon")
    job_id = limit_str_length(body.get("job_id"), 128)
    if not job_id:
        raise HTTPException(status_code=400, detail="job_id zorunludur")
    raw_url = body.get("job_url")
    safe_url = raw_url[:2048] if raw_url and is_safe_url(raw_url) else None
    raw_duration = body.get("duration_seconds")
    duration = int(raw_duration) if isinstance(raw_duration, (int, float)) else None

    if action == "save":
        if await db_repo.has_saved_job(user["sub"], job_id):
            return {"success": True}

    await db_repo.insert_interaction({
        "user_id": user["sub"],
        "job_id": job_id,
        "action": action,
        "duration_seconds": duration,
        "job_title": limit_str_length(body.get("job_title"), 200),
        "job_company": limit_str_length(body.get("job_company"), 200),
        "job_location": limit_str_length(body.get("job_location"), 200),
        "job_sector": limit_str_length(body.get("job_sector"), 100),
        "job_work_type": limit_str_length(body.get("job_work_type"), 50),
        "job_seniority": limit_str_length(body.get("job_seniority"), 50),
        "job_url": safe_url,
    })
    return {"success": True}

@router.get("/api/saved")
async def get_saved(
    user: dict = Depends(get_current_user),
    db_repo: DatabaseRepository = Depends(get_db_repository)
):
    return await db_repo.get_saved_jobs(user["sub"])

@router.delete("/api/saved/{job_id}")
async def unsave_job(
    job_id: str,
    user: dict = Depends(get_current_user),
    db_repo: DatabaseRepository = Depends(get_db_repository)
):
    await db_repo.delete_saved_job(user["sub"], job_id)
    return {"success": True}

@router.get("/api/applications")
async def get_applications(
    user: dict = Depends(get_current_user),
    db_repo: DatabaseRepository = Depends(get_db_repository)
):
    return await db_repo.get_applied_jobs(user["sub"])
