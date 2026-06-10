import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from auth import get_optional_user
from api.dependencies import get_job_service
from api.limiter import limiter
from services.job_service import JobService
from services.job_scraper import get_job_description

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/api/feed")
@limiter.limit("30/minute")
async def feed(
    request: Request,
    location: str = Query(default="Istanbul, Turkey"),
    keyword: str = Query(default=""),
    sectors: str = Query(default=""),
    work_type: str = Query(default="any"),
    seniority: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    user: dict | None = Depends(get_optional_user),
    job_service: JobService = Depends(get_job_service),
):
    try:
        return await job_service.get_feed(
            location=location,
            keyword=keyword,
            sectors=sectors,
            work_type=work_type,
            seniority=seniority,
            page=page,
            user=user
        )
    except Exception as e:
        logger.exception("[Feed] UNHANDLED ERROR for user=%s", user and user.get("sub", "?")[:8])
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/api/job/{job_id}/description")
async def job_description(job_id: str, user: dict | None = Depends(get_optional_user)):
    desc = await get_job_description(job_id)
    return {"description": desc}
