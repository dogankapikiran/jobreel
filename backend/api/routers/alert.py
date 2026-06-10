from fastapi import APIRouter, Depends, HTTPException, Request
from auth import get_current_user
from api.dependencies import get_alert_service
from api.limiter import limiter
from services.alert_service import AlertService
from core.config import MAX_ALERTS_PER_USER
from utils.validation import parse_comma_separated_list

router = APIRouter()


@router.get("/api/alerts")
async def get_alerts(
    user: dict = Depends(get_current_user),
    alert_service: AlertService = Depends(get_alert_service)
):
    return await alert_service.get_job_alerts(user["sub"])


@router.post("/api/alerts")
@limiter.limit("30/minute")
async def create_alert(
    request: Request,
    body: dict,
    user: dict = Depends(get_current_user),
    alert_service: AlertService = Depends(get_alert_service)
):
    count = await alert_service.get_job_alerts_count(user["sub"])
    if count >= MAX_ALERTS_PER_USER:
        raise HTTPException(status_code=429, detail=f"Maksimum {MAX_ALERTS_PER_USER} alarm oluşturabilirsiniz")

    seniority = parse_comma_separated_list(body.get("seniority"))
    sectors = parse_comma_separated_list(body.get("sectors"))

    keyword_clean = body.get("keyword", "").strip()
    if not keyword_clean and not sectors:
        raise HTTPException(status_code=400, detail="Anahtar kelime veya sektör gerekli")

    res = await alert_service.insert_job_alert({
        "user_id": user["sub"],
        "label": body.get("label", "").strip(),
        "keyword": keyword_clean,
        "location": body.get("location", "Istanbul, Turkey").strip(),
        "work_type": body.get("work_type", "any"),
        "seniority": seniority,
        "sectors": sectors,
        "enabled": True,
    })
    return res if res else {"success": True}


@router.patch("/api/alerts/{alert_id}")
async def toggle_alert(
    alert_id: str,
    body: dict,
    user: dict = Depends(get_current_user),
    alert_service: AlertService = Depends(get_alert_service)
):
    update_data: dict = {}
    if "enabled" in body:
        update_data["enabled"] = body["enabled"]
    if "keyword" in body:
        update_data["keyword"] = body["keyword"]
    if "location" in body:
        update_data["location"] = body["location"]
    if "work_type" in body:
        update_data["work_type"] = body["work_type"]
    if "seniority" in body:
        update_data["seniority"] = parse_comma_separated_list(body["seniority"])
    if "sectors" in body:
        update_data["sectors"] = parse_comma_separated_list(body["sectors"])
    if not update_data:
        return {"success": True}
    res = await alert_service.update_job_alert(alert_id, user["sub"], update_data)
    if not res:
        raise HTTPException(status_code=404, detail="Alarm bulunamadı")
    return {"success": True}


@router.delete("/api/alerts/{alert_id}")
async def delete_alert(
    alert_id: str,
    user: dict = Depends(get_current_user),
    alert_service: AlertService = Depends(get_alert_service)
):
    res = await alert_service.delete_job_alert(alert_id, user["sub"])
    if not res:
        raise HTTPException(status_code=404, detail="Alarm bulunamadı")
    return {"success": True}
