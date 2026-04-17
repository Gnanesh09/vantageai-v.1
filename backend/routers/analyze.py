from fastapi import APIRouter, HTTPException
from models.schemas import ReviewIngest
from pipeline.agent import run_pipeline
from config import get_supabase
import uuid

router = APIRouter()

@router.post("/")
async def analyze_review(body: ReviewIngest):
    db = get_supabase()
    brand = db.table("brands").select("*").eq("id", body.brand_id).execute()
    if not brand.data:
        raise HTTPException(status_code=404, detail="Brand not found")
    b = brand.data[0]
    review_id = str(uuid.uuid4())
    db.table("reviews").insert({
        "id": review_id, "brand_id": body.brand_id, "product_id": body.product_id,
        "raw_text": body.raw_text, "image_url": body.image_url,
        "star_rating": body.star_rating, "reviewer_id": body.reviewer_id,
        "source": body.source or "api"
    }).execute()
    result = await run_pipeline({
        "review_id": review_id, "brand_id": body.brand_id,
        "product_id": body.product_id, "raw_text": body.raw_text,
        "image_url": body.image_url, "star_rating": body.star_rating,
        "reviewer_id": body.reviewer_id, "source": body.source or "api",
        "domain": b["domain"], "custom_attributes": b.get("custom_attributes", []),
        "currency": b.get("currency", "INR"),
        "is_duplicate": False, "is_bot": False, "normalized_text": None,
        "detected_language": None, "is_sarcasm": False, "is_ambiguous": False,
        "overall_sentiment": "neutral", "overall_score": 0.0,
        "confidence_score": 0.0, "feature_sentiments": {},
        "visual_defect_detected": False, "visual_defect_description": None,
        "rar_score": 0.0, "churn_risk": 0.0, "svi_score": 0.0, "error": None
    })
    return {
        "review_id": review_id,
        "normalized_text": result.get("normalized_text"),
        "detected_language": result.get("detected_language"),
        "is_sarcasm": result.get("is_sarcasm"),
        "is_ambiguous": result.get("is_ambiguous"),
        "is_bot": result.get("is_bot"),
        "overall_sentiment": result.get("overall_sentiment"),
        "overall_score": result.get("overall_score"),
        "confidence_score": result.get("confidence_score"),
        "feature_sentiments": result.get("feature_sentiments"),
        "rar_score": result.get("rar_score"),
        "churn_risk": result.get("churn_risk"),
        "svi_score": result.get("svi_score"),
        "visual_defect_detected": result.get("visual_defect_detected"),
        "visual_defect_description": result.get("visual_defect_description"),
        "error": result.get("error")
    }