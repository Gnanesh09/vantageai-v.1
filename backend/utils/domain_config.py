DOMAIN_ATTRIBUTES = {
    "fmcg": ["packaging","taste","freshness","seal_quality","price_value","shelf_life","quantity","smell"],
    "cafe": ["food_temperature","presentation","staff_behaviour","ambience","wait_time","portion_size","cleanliness","wifi"],
    "quick_commerce": ["delivery_speed","packaging_damage","missing_items","freshness_on_arrival","substitute_quality","app_experience"],
    "automobile": ["build_quality","mileage","service_experience","safety","comfort","pickup","resale_value","noise_level"],
    "electronics": ["battery_life","durability","display_quality","heating_issue","after_sales_service","camera_quality","software_performance","design"],
    "fashion": ["fabric_quality","stitching","fit_sizing","color_accuracy","packaging","delivery_condition","return_process"],
    "default": ["quality","packaging","price_value","customer_service","delivery","durability"]
}

RAR_WEIGHTS = {
    "packaging": 0.8, "delivery_speed": 0.9, "missing_items": 1.0,
    "safety": 1.0, "quality": 0.85, "seal_quality": 0.9,
    "freshness": 0.85, "heating_issue": 0.95, "default": 0.7
}

def get_attributes(domain: str, custom_attributes: list = None) -> list:
    base = DOMAIN_ATTRIBUTES.get(domain, DOMAIN_ATTRIBUTES["default"])
    if custom_attributes:
        return list(set(base + custom_attributes))
    return base

def build_system_prompt(domain: str, custom_attributes: list = None) -> str:
    attributes = get_attributes(domain, custom_attributes)
    return f"""You are VantageAI, an expert consumer intelligence analyst for {domain.upper()} businesses.

Analyse the customer review and return ONLY valid JSON with this exact structure:
{{
  "normalized_text": "clean english version of the review",
  "detected_language": "hinglish/hindi/english/kannada/etc",
  "is_sarcasm": false,
  "is_ambiguous": false,
  "is_bot": false,
  "overall_sentiment": "positive/negative/neutral/mixed",
  "overall_score": 0.0,
  "confidence_score": 0.0,
  "feature_sentiments": {{
    "feature_name": {{"sentiment": "positive/negative/neutral", "score": 0.0, "confidence": 0.0, "excerpt": "exact phrase"}}
  }}
}}

Attributes to analyse (only include ones actually mentioned): {attributes}

Rules:
- Hinglish: "ekdum bekar"=very bad, "mast hai"=great, "bilkul bakwaas"=total nonsense
- Sarcasm: "oh wow amazing quality broke on day 1" → is_sarcasm:true, overall_sentiment:negative
- score range: -1.0 (very negative) to 1.0 (very positive)
- Only include features explicitly mentioned in the review
- is_bot: true if review is generic/repetitive/suspiciously short with no specifics
"""