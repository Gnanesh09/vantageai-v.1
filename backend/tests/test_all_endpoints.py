import requests, json, time

BASE = "http://localhost:8000"
brand_id = None
product_id = None

def p(label, res):
    status = "✅" if res.status_code in [200, 201] else "❌"
    print(f"\n{status} {label} [{res.status_code}]")
    try:
        print(json.dumps(res.json(), indent=2)[:500])
    except:
        print(res.text[:200])

def test_health():
    p("GET /health", requests.get(f"{BASE}/health"))

def test_create_brand():
    global brand_id
    res = requests.post(f"{BASE}/brands/", json={
        "name": "BrewCo Cafe", "domain": "cafe",
        "custom_attributes": ["vibe", "wifi_quality"],
        "language_preferences": ["english", "hindi"], "currency": "INR"
    })
    p("POST /brands (cafe)", res)
    if res.status_code == 200:
        brand_id = res.json().get("id")
        print(f"  brand_id: {brand_id}")

def test_create_product():
    global product_id
    if not brand_id: return
    res = requests.post(f"{BASE}/brands/{brand_id}/products",
        params={"name": "Cold Brew Coffee", "category": "beverages", "sku": "CB-001"})
    p("POST /products", res)
    if res.status_code == 200:
        product_id = res.json().get("id")

def test_analyze_english():
    if not brand_id: return
    p("POST /analyze (English)", requests.post(f"{BASE}/analyze/", json={
        "brand_id": brand_id, "product_id": product_id,
        "raw_text": "Cold brew was amazing but staff was very rude and wait time was 30 mins.",
        "star_rating": 3, "reviewer_id": "user_001"
    }))

def test_analyze_hinglish():
    if not brand_id: return
    p("POST /analyze (Hinglish)", requests.post(f"{BASE}/analyze/", json={
        "brand_id": brand_id, "product_id": product_id,
        "raw_text": "Chai bilkul thandi thi aur presentation ekdum bekar. staff bhi bahut rude tha.",
        "star_rating": 1, "reviewer_id": "user_002"
    }))

def test_analyze_sarcasm():
    if not brand_id: return
    p("POST /analyze (Sarcasm)", requests.post(f"{BASE}/analyze/", json={
        "brand_id": brand_id, "product_id": product_id,
        "raw_text": "Oh wow amazing coffee, totally worth waiting 45 mins for a cold drink that arrived warm!",
        "star_rating": 1, "reviewer_id": "user_003"
    }))

def test_ingest_bulk():
    if not brand_id: return
    p("POST /ingest/bulk", requests.post(f"{BASE}/ingest/bulk", json={
        "brand_id": brand_id, "product_id": product_id,
        "reviews": [
            {"text": "Packaging was completely destroyed on arrival", "rating": 1, "reviewer_id": "u_10"},
            {"text": "Ekdum mast taste tha, packaging thodi weak thi", "rating": 4, "reviewer_id": "u_11"},
            {"text": "Good good good good good", "rating": 5, "reviewer_id": "u_12"},
            {"text": "The seal was broken and product leaked everywhere", "rating": 1, "reviewer_id": "u_13"},
        ]
    }))

def test_get_insights():
    if not brand_id: return
    time.sleep(3)
    p("GET /insights", requests.get(f"{BASE}/insights/", params={"brand_id": brand_id}))

def test_insights_summary():
    if not brand_id: return
    p("GET /insights/summary", requests.get(f"{BASE}/insights/summary", params={"brand_id": brand_id}))

def test_get_trends():
    if not brand_id: return
    p("GET /trends", requests.get(f"{BASE}/trends/", params={"brand_id": brand_id}))

def test_get_directives():
    if not brand_id: return
    p("GET /directives", requests.get(f"{BASE}/directives/", params={"brand_id": brand_id}))

if __name__ == "__main__":
    print("=" * 50)
    print("  VANTAGEAI ENDPOINT TEST SUITE")
    print("=" * 50)
    test_health()
    test_create_brand()
    test_create_product()
    test_analyze_english()
    test_analyze_hinglish()
    test_analyze_sarcasm()
    test_ingest_bulk()
    test_get_insights()
    test_insights_summary()
    test_get_trends()
    test_get_directives()
    print("\n" + "=" * 50)
    print("  DONE")
    print("=" * 50)