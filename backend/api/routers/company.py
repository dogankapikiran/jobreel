from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from api.dependencies import get_interaction_service
from services.interaction_service import InteractionService

router = APIRouter()

@router.get("/api/companies/following")
async def get_following(
    user: dict = Depends(get_current_user),
    interaction_service: InteractionService = Depends(get_interaction_service)
):
    return await interaction_service.get_followed_companies(user["sub"])

@router.post("/api/companies/follow")
async def follow_company(
    body: dict,
    user: dict = Depends(get_current_user),
    interaction_service: InteractionService = Depends(get_interaction_service)
):
    name = (body.get("company_name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Missing company_name")
    await interaction_service.upsert_company_follow(user["sub"], name)
    return {"success": True}

@router.delete("/api/companies/follow/{company_name}")
async def unfollow_company(
    company_name: str,
    user: dict = Depends(get_current_user),
    interaction_service: InteractionService = Depends(get_interaction_service)
):
    await interaction_service.delete_company_follow(user["sub"], company_name)
    return {"success": True}
