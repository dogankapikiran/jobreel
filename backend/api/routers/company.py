from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from api.dependencies import get_db_repository
from core.database import DatabaseRepository

router = APIRouter()

@router.get("/api/companies/following")
async def get_following(
    user: dict = Depends(get_current_user),
    db_repo: DatabaseRepository = Depends(get_db_repository)
):
    return await db_repo.get_followed_companies(user["sub"])

@router.post("/api/companies/follow")
async def follow_company(
    body: dict,
    user: dict = Depends(get_current_user),
    db_repo: DatabaseRepository = Depends(get_db_repository)
):
    name = (body.get("company_name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Missing company_name")
    await db_repo.upsert_company_follow(user["sub"], name)
    return {"success": True}

@router.delete("/api/companies/follow/{company_name}")
async def unfollow_company(
    company_name: str,
    user: dict = Depends(get_current_user),
    db_repo: DatabaseRepository = Depends(get_db_repository)
):
    await db_repo.delete_company_follow(user["sub"], company_name)
    return {"success": True}
