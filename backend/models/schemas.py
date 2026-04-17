from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class BrandCreate(BaseModel):
    name: str
    domain: str
    custom_attributes: Optional[List[str]] = []
    language_preferences: Optional[List[str]] = ["english"]
    currency: Optional[str] = "INR"

class BrandResponse(BaseModel):
    id: str
    name: str
    domain: str
    api_key: str
    created_at: Optional[str]

class ProductCreate(BaseModel):
    brand_id: str
    name: str
    category: str
    sku: Optional[str] = None

class ReviewIngest(BaseModel):
    brand_id: str
    product_id: Optional[str] = None
    raw_text: str
    image_url: Optional[str] = None
    star_rating: Optional[int] = Field(None, ge=1, le=5)
    reviewer_id: Optional[str] = None
    source: Optional[str] = "manual"

class BulkReviewIngest(BaseModel):
    brand_id: str
    product_id: Optional[str] = None
    reviews: List[Dict[str, Any]]