from fastapi import APIRouter, Query
from config import get_supabase
from typing import Optional

router = APIRouter()

@router.get("/")
def get_directives(brand_id: str = Query(...), directive_type: Optional[str] = None,
                   status: Optional[str] = None, limit: int = 50):
    db = get_supabase()
    q = db.table("directives").select("*").eq("brand_id", brand_id).order("created_at", desc=True)
    if directive_type:
        q = q.eq("directive_type", directive_type)
    if status:
        q = q.eq("status", status)
    result = q.limit(limit).execute()
    return {"directives": result.data, "count": len(result.data)}

@router.patch("/{directive_id}/status")
def update_directive_status(directive_id: str, status: str):
    db = get_supabase()
    result = db.table("directives").update({"status": status}).eq("id", directive_id).execute()
    return result.data[0] if result.data else {}