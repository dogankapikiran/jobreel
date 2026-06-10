from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from api.dependencies import get_company_service
from services.company_service import CompanyService

router = APIRouter()

@router.get("/api/companies/following")
async def get_following(
    user: dict = Depends(get_current_user),
    company_service: CompanyService = Depends(get_company_service)
):
    return await company_service.get_followed_companies(user["sub"])

@router.post("/api/companies/follow")
async def follow_company(
    body: dict,
    user: dict = Depends(get_current_user),
    company_service: CompanyService = Depends(get_company_service)
):
    name = (body.get("company_name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Missing company_name")
    await company_service.upsert_company_follow(user["sub"], name)
    return {"success": True}

@router.delete("/api/companies/follow/{company_name}")
async def unfollow_company(
    company_name: str,
    user: dict = Depends(get_current_user),
    company_service: CompanyService = Depends(get_company_service)
):
    await company_service.delete_company_follow(user["sub"], company_name)
    return {"success": True}
