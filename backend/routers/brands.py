from fastapi import APIRouter, HTTPException
from models.schemas import BrandCreate, BrandResponse
from config import get_supabase
import uuid

router = APIRouter()

@router.post("/", response_model=BrandResponse)
def create_brand(body: BrandCreate):
    db = get_supabase()
    data = {
        "name": body.name,
        "domain": body.domain,
        "custom_attributes": body.custom_attributes,
        "language_preferences": body.language_preferences,
        "currency": body.currency,
        "api_key": str(uuid.uuid4())
    }
    result = db.table("brands").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create brand")
    return result.data[0]

@router.get("/")
def list_brands():
    db = get_supabase()
    result = db.table("brands").select("id,name,domain,created_at").execute()
    return result.data

@router.get("/{brand_id}")
def get_brand(brand_id: str):
    db = get_supabase()
    result = db.table("brands").select("*").eq("id", brand_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Brand not found")
    return result.data[0]

@router.post("/{brand_id}/products")
def create_product(brand_id: str, name: str, category: str, sku: str = None):
    db = get_supabase()
    result = db.table("products").insert({
        "brand_id": brand_id, "name": name, "category": category, "sku": sku
    }).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create product")
    return result.data[0]

@router.get("/{brand_id}/products")
def get_products(brand_id: str):
    db = get_supabase()
    result = db.table("products").select("*").eq("brand_id", brand_id).execute()
    return result.data