from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks
from models.schemas import ReviewIngest, BulkReviewIngest
from config import get_supabase
from pipeline.agent import run_pipeline
import pandas as pd, io, uuid

router = APIRouter()

async def process_and_pipeline(review_id, brand_id, product_id, raw_text,
                                 image_url, star_rating, reviewer_id, source,
                                 domain, custom_attributes, currency):
    await run_pipeline({
        "review_id": review_id, "brand_id": brand_id, "product_id": product_id,
        "raw_text": raw_text, "image_url": image_url, "star_rating": star_rating,
        "reviewer_id": reviewer_id, "source": source, "domain": domain,
        "custom_attributes": custom_attributes, "currency": currency,
        "is_duplicate": False, "is_bot": False, "normalized_text": None,
        "detected_language": None, "is_sarcasm": False, "is_ambiguous": False,
        "overall_sentiment": "neutral", "overall_score": 0.0,
        "confidence_score": 0.0, "feature_sentiments": {},
        "visual_defect_detected": False, "visual_defect_description": None,
        "rar_score": 0.0, "churn_risk": 0.0, "svi_score": 0.0, "error": None
    })

@router.post("/")
async def ingest_review(body: ReviewIngest, background_tasks: BackgroundTasks):
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
        "source": body.source
    }).execute()
    background_tasks.add_task(
        process_and_pipeline, review_id, body.brand_id, body.product_id,
        body.raw_text, body.image_url, body.star_rating, body.reviewer_id,
        body.source, b["domain"], b.get("custom_attributes", []), b.get("currency", "INR")
    )
    return {"review_id": review_id, "status": "ingested", "message": "Processing started"}

@router.post("/bulk")
async def ingest_bulk(body: BulkReviewIngest, background_tasks: BackgroundTasks):
    db = get_supabase()
    brand = db.table("brands").select("*").eq("id", body.brand_id).execute()
    if not brand.data:
        raise HTTPException(status_code=404, detail="Brand not found")
    b = brand.data[0]
    ingested = []
    for rev in body.reviews:
        raw_text = rev.get("text") or rev.get("review_text") or rev.get("raw_text", "")
        if not raw_text:
            continue
        review_id = str(uuid.uuid4())
        db.table("reviews").insert({
            "id": review_id, "brand_id": body.brand_id,
            "product_id": body.product_id or rev.get("product_id"),
            "raw_text": raw_text,
            "star_rating": rev.get("star_rating") or rev.get("rating"),
            "reviewer_id": rev.get("reviewer_id"), "source": "bulk"
        }).execute()
        background_tasks.add_task(
            process_and_pipeline, review_id, body.brand_id,
            body.product_id or rev.get("product_id"),
            raw_text, None, rev.get("star_rating"), rev.get("reviewer_id"),
            "bulk", b["domain"], b.get("custom_attributes", []), b.get("currency", "INR")
        )
        ingested.append(review_id)
    return {"ingested_count": len(ingested), "review_ids": ingested, "status": "processing"}

@router.post("/csv")
async def ingest_csv(brand_id: str, background_tasks: BackgroundTasks,
                     product_id: str = None, file: UploadFile = File(...)):
    db = get_supabase()
    brand = db.table("brands").select("*").eq("id", brand_id).execute()
    if not brand.data:
        raise HTTPException(status_code=404, detail="Brand not found")
    b = brand.data[0]
    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid CSV file")
    text_col = next((c for c in df.columns if c.lower() in
                     ["text","review","review_text","comment","body","content"]), None)
    if not text_col:
        raise HTTPException(status_code=400, detail="CSV must have column: text, review, or review_text")
    ingested = []
    for _, row in df.iterrows():
        raw_text = str(row[text_col])
        if not raw_text or raw_text == "nan":
            continue
        review_id = str(uuid.uuid4())
        db.table("reviews").insert({
            "id": review_id, "brand_id": brand_id, "product_id": product_id,
            "raw_text": raw_text,
            "star_rating": int(row["rating"]) if "rating" in df.columns else None,
            "reviewer_id": str(row["reviewer_id"]) if "reviewer_id" in df.columns else None,
            "source": "csv"
        }).execute()
        background_tasks.add_task(
            process_and_pipeline, review_id, brand_id, product_id,
            raw_text, None, None, None, "csv",
            b["domain"], b.get("custom_attributes", []), b.get("currency", "INR")
        )
        ingested.append(review_id)
    return {"ingested_count": len(ingested), "status": "processing"}