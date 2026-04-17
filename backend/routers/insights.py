from fastapi import APIRouter, Query
from config import get_supabase
from typing import Optional

router = APIRouter()

@router.get("/")
def get_insights(brand_id: str = Query(...), product_id: Optional[str] = None,
                 sentiment: Optional[str] = None, limit: int = 50, offset: int = 0):
    db = get_supabase()
    q = db.table("insights").select(
        "*, reviews(raw_text, star_rating, source, created_at)"
    ).eq("brand_id", brand_id).order("processed_at", desc=True)
    if product_id:
        q = q.eq("product_id", product_id)
    if sentiment:
        q = q.eq("overall_sentiment", sentiment)
    result = q.range(offset, offset + limit - 1).execute()
    return {"insights": result.data, "count": len(result.data)}

@router.get("/summary")
def get_insights_summary(brand_id: str = Query(...), product_id: Optional[str] = None):
    db = get_supabase()
    q = db.table("insights").select(
        "overall_sentiment, rar_score, churn_risk, confidence_score"
    ).eq("brand_id", brand_id)
    if product_id:
        q = q.eq("product_id", product_id)
    result = q.execute()
    data = result.data or []
    total = len(data)
    if total == 0:
        return {"total": 0}
    sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0, "mixed": 0}
    for r in data:
        s = r.get("overall_sentiment", "neutral")
        sentiment_counts[s] = sentiment_counts.get(s, 0) + 1
    return {
        "total_reviews": total,
        "sentiment_breakdown": sentiment_counts,
        "total_rar_inr": round(sum(r.get("rar_score", 0) for r in data), 2),
        "avg_churn_risk": round(sum(r.get("churn_risk", 0) for r in data) / total, 4),
        "high_churn_customers": len([r for r in data if r.get("churn_risk", 0) > 0.65]),
        "negative_pct": round(sentiment_counts["negative"] / total * 100, 1)
    }

@router.get("/{insight_id}")
def get_insight(insight_id: str):
    db = get_supabase()
    result = db.table("insights").select("*").eq("id", insight_id).execute()
    return result.data[0] if result.data else {}