# VantageAI Monorepo

AI-powered Customer Review Intelligence Platform for FMCG/e-commerce, with:

- `backend/` — FastAPI + LangGraph analysis pipeline
- `ecomm-website/` — SwiftCart customer storefront (Next.js App Router)
- `admin/` — VantageAI War Room admin dashboard (Next.js App Router)
- `scripts/` — utility scripts (including bulk review ingestion)

---

## 1) What This Project Does

This repository implements an end-to-end review intelligence system:

1. Reviews are ingested (`/ingest`, `/ingest/bulk`, `/ingest/csv`) or analyzed instantly (`/analyze`).
2. A LangGraph pipeline processes each review:
   - deduplication
   - input quality gate (gibberish/noise detection)
   - NLP feature extraction/sentiment
   - optional image defect analysis
   - financial scoring (RAR, churn, SVI)
   - persistence to Supabase
   - auto-directive generation
   - trend detection
3. Customer frontend shows product reviews + sentiment safely.
4. Admin dashboard shows actionable intelligence for operations, QA, product, CX, and leadership.

---

## 2) Repo Structure

```text
vantageai1/
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── models/schemas.py
│   ├── routers/
│   │   ├── brands.py
│   │   ├── ingest.py
│   │   ├── analyze.py
│   │   ├── insights.py
│   │   ├── trends.py
│   │   └── directives.py
│   ├── pipeline/agent.py
│   ├── services/
│   │   ├── azure_nlp.py
│   │   └── azure_vision.py
│   ├── utils/
│   │   ├── deduplication.py
│   │   ├── input_quality.py
│   │   ├── domain_config.py
│   │   ├── rar_calculator.py
│   │   └── directive_engine.py
│   ├── requirements.txt
│   └── supabase_schema.sql
├── ecomm-website/
│   ├── src/app/
│   │   ├── page.tsx
│   │   ├── product/[id]/page.tsx
│   │   ├── cart/page.tsx
│   │   └── search/page.tsx
│   ├── src/components/
│   ├── src/lib/
│   │   ├── api.ts
│   │   ├── data.ts
│   │   └── cart.tsx
│   └── package.json
├── admin/
│   ├── src/app/admin/
│   │   ├── page.tsx
│   │   ├── products/page.tsx
│   │   ├── products/[id]/page.tsx
│   │   ├── reviews/page.tsx
│   │   ├── trends/page.tsx
│   │   ├── directives/page.tsx
│   │   └── analyze/page.tsx
│   ├── src/components/
│   ├── src/lib/
│   │   ├── api.ts
│   │   ├── compute.ts
│   │   └── constants.ts
│   └── package.json
├── scripts/
│   └── bulk_upload_reviews.py
└── Reviews_dataset_amazon.csv
```

---

## 3) Core Architecture

### Backend (FastAPI)

- **Entry**: `backend/main.py`
- **CORS**: enabled for all origins
- **Storage**: Supabase/Postgres
- **AI services**:
  - Azure OpenAI (JSON structured NLP extraction)
  - Azure Vision (image defect signals)

### Pipeline (LangGraph)

Implemented in `backend/pipeline/agent.py` with node order:

1. `deduplicate`
2. `nlp_analysis`
3. `vision_analysis`
4. `financial_scoring`
5. `save_to_db`
6. `auto_directives`
7. `trend_detection`

### Frontends

- **Customer app** (`ecomm-website`) for product browsing, reviews, and submission.
- **Admin app** (`admin`) for KPI monitoring, product risk, review explorer, trend intelligence, and directives.

---

## 4) Scoring Logic (RAR / Churn / SVI)

### RAR (Revenue at Risk)

`backend/utils/rar_calculator.py`

- CLV baseline constant: `CUSTOMER_LIFETIME_VALUE = 15000`
- Per review:

```text
RAR = Σ(weight(feature) × abs(feature_score) × CLV × 0.1 × review_count)
```

- Only `negative` / `mixed` feature sentiments contribute.
- If visual defect is detected, RAR is multiplied by `1.3` in pipeline.
- Product/brand dashboard RAR is a **sum** across reviews, not an average.

### Churn Risk

- Derived from reviewer sentiment history trend (`customer_sentiment_history`).
- Strong negative sentiment decay increases churn probability.

### SVI (Sentiment Velocity Index)

- Compares recent negative rate vs previous window for product-level direction.
- Positive SVI = worsening negativity trend.

---

## 5) Defensive AI Quality Controls

### Input quality gate

`backend/utils/input_quality.py`

- Rejects/flags very short/noisy/gibberish text before LLM analysis.
- Invalid inputs are marked `invalid_input:*`, and pipeline suppresses:
  - RAR/churn/SVI scoring
  - directives generation
  - sentiment history insertion

### Duplicate-ticket defense for directives

`backend/pipeline/agent.py` + `backend/utils/directive_engine.py`

- Each directive now has an `issue_signature` + `dedup_hours`.
- If same pending issue already exists in window:
  - no new ticket is created
  - existing ticket payload is updated (`occurrences`, `related_review_ids`, `last_seen_at`)

---

## 6) Directive System (Actionable Suggestions)

Directives are generated with concrete business actions (owner, due hours, recommendations), not generic text.

Primary directive types include:

- `qa_alert`
- `churn_alert`
- `pr_crisis`
- `cx_recovery`
- `rar_escalation`
- `bot_activity`
- `sarcasm_watch`
- `low_confidence`
- `manual_review`
- `monitor`

Each directive payload can include:

- `title`, `description`, `action_text`
- `owner`, `due_hours`, `priority`
- `recommended_actions[]`
- `message`, `reason`, `feature_keys`
- `issue_signature`, `dedup_hours`

---

## 7) Trend Intelligence (Admin)

`admin/src/app/admin/trends/page.tsx`

- Product-level trend intelligence from real insights.
- Features include:
  - all-products risk ranking
  - product filter drill-down
  - “About To Boom” positives
  - “What Customers Need Next” inferred needs
  - actionable playbook per product-feature with severity and delta
- Backend trends endpoint is used when populated; fallback trend compute exists in UI utilities.

---

## 8) API Endpoints

Base URL: `http://localhost:8000`

### Health
- `GET /health`

### Brands & Products
- `POST /brands/`
- `GET /brands/`
- `GET /brands/{brand_id}`
- `POST /brands/{brand_id}/products?name=&category=&sku=`
- `GET /brands/{brand_id}/products`

### Reviews & Analysis
- `POST /ingest/` (async background pipeline)
- `POST /ingest/bulk`
- `POST /ingest/csv`
- `POST /analyze/` (sync analysis response)

### Insights / Trends / Directives
- `GET /insights/?brand_id=&product_id=&limit=&offset=`
- `GET /insights/summary?brand_id=&product_id=`
- `GET /trends/?brand_id=&product_id=&trend_type=&limit=`
- `GET /directives/?brand_id=&status=&directive_type=&limit=`
- `PATCH /directives/{directive_id}/status?status=resolved|pending`

---

## 9) Environment Variables

### Backend (`backend/.env`)

Required:

```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-08-01-preview

AZURE_LANGUAGE_ENDPOINT=
AZURE_LANGUAGE_KEY=

AZURE_VISION_ENDPOINT=
AZURE_VISION_KEY=
```

### Customer frontend (`ecomm-website/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BRAND_ID=1c4b5649-47e9-4f99-871e-f53742fd949f
```

### Admin frontend (`admin/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BRAND_ID=1c4b5649-47e9-4f99-871e-f53742fd949f
```

---

## 10) Local Setup

## Prerequisites

- Python 3.11+
- Node.js 20+
- npm
- Supabase project with schema applied
- Azure credentials (OpenAI + Vision + Language)

### A) Start backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### B) Start customer app

```bash
cd ecomm-website
npm install
npm run dev -- -p 3000
```

### C) Start admin app

```bash
cd admin
npm install
npm run dev -- -p 3001
```

Open:

- Customer app: `http://localhost:3000`
- Admin app: `http://localhost:3001/admin`
- API docs: `http://localhost:8000/docs`

---

## 11) Data Seeding / Bulk Import

- CSV dataset: `Reviews_dataset_amazon.csv`
- Script: `scripts/bulk_upload_reviews.py`

Run:

```bash
python scripts/bulk_upload_reviews.py
```

Notes:

- Script posts to `/ingest/bulk` in chunks.
- If backend is under heavy load, reduce chunk size and add delay between batches.

---

## 12) Customer App Capabilities (`ecomm-website`)

- SwiftCart-style homepage and category sections
- Product detail page with live insights and review list
- Review form:
  - analyze preview via `/analyze`
  - persists via `/ingest`
  - optional image URL
- In-memory cart context (no persistent checkout)
- Search page
- Error-safe API handling (`null`/`[]` fallback)

---

## 13) Admin App Capabilities (`admin`)

- **Overview**: KPI cards, sentiment/financial charts, high-risk reviews, feature health
- **Products**: product cards sorted by risk and drill-down links
- **Product Insights**: per-product KPI + review intelligence view
- **Reviews**: advanced filters, table, modal details, CSV export
- **Trends**: product intelligence ranking + action playbooks
- **Directives**: AI-generated operational recommendations with owners and due windows
- **Analyze**: manual review test console

---

## 14) Known Behavior / Operational Notes

- No WebSocket stream is currently used; UI refresh is pull-based.
- `/ingest` is async (background task), so insights may appear with small delay.
- Azure Vision may reject invalid image URLs with format errors; pipeline handles this gracefully (no crash).
- Existing directives created before latest logic may still contain older payload structure.

---

## 15) Production Hardening Checklist (Recommended)

- Add auth + RBAC for admin routes
- Add idempotency keys for ingest endpoints
- Add request queue / worker (Celery/RQ/Kafka) for high-volume ingestion
- Add observability (structured logs, tracing, alerting)
- Add model evaluation + calibration pipelines for confidence thresholds
- Add DB migrations/versioning (Alembic or SQL migration tooling)
- Add automated tests (unit/integration/e2e)
- Add rate limits and abuse controls on public endpoints

---

## 16) Quick Troubleshooting

### Backend unreachable
- Verify `uvicorn` is running on `:8000`
- Check frontend `NEXT_PUBLIC_API_URL`

### Directives not updating
- Restart backend after pipeline/directive logic changes
- Ensure new reviews are being processed (check `/insights` updates)

### Admin build/runtime issues
- Run type check:

```bash
cd admin
npx tsc --noEmit
```

### No insights/trends data
- Confirm correct `NEXT_PUBLIC_BRAND_ID`
- Seed reviews via UI or bulk script

---

## 17) License

No explicit license file is currently defined in this repository.
