from fastapi import APIRouter, Query
from config import get_supabase
from typing import Optional

router = APIRouter()

@router.get("/")
def get_trends(brand_id: str = Query(...), product_id: Optional[str] = None,
               trend_type: Optional[str] = None, limit: int = 50):
    db = get_supabase()
    q = db.table("trends").select("*").eq("brand_id", brand_id).order("detected_at", desc=True)
    if product_id:
        q = q.eq("product_id", product_id)
    if trend_type:
        q = q.eq("trend_type", trend_type)
    result = q.limit(limit).execute()
    return {"trends": result.data, "count": len(result.data)}

@router.get("/systemic")
def get_systemic_issues(brand_id: str = Query(...)):
    db = get_supabase()
    result = db.table("trends").select("*")\
        .eq("brand_id", brand_id).eq("is_systemic", True)\
        .order("detected_at", desc=True).execute()
    return {"systemic_issues": result.data}