CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  custom_attributes JSONB DEFAULT '[]',
  language_preferences TEXT[] DEFAULT ARRAY['english'],
  currency TEXT DEFAULT 'INR',
  api_key TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sku TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  raw_text TEXT NOT NULL,
  image_url TEXT,
  star_rating INTEGER CHECK (star_rating BETWEEN 1 AND 5),
  reviewer_id TEXT,
  source TEXT DEFAULT 'manual',
  is_bot BOOLEAN DEFAULT FALSE,
  is_duplicate BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  normalized_text TEXT,
  detected_language TEXT,
  is_sarcasm BOOLEAN DEFAULT FALSE,
  is_ambiguous BOOLEAN DEFAULT FALSE,
  overall_sentiment TEXT,
  overall_score FLOAT,
  confidence_score FLOAT,
  feature_sentiments JSONB DEFAULT '{}',
  rar_score FLOAT DEFAULT 0,
  rar_currency TEXT DEFAULT 'INR',
  churn_risk FLOAT DEFAULT 0,
  svi_score FLOAT DEFAULT 0,
  visual_defect_detected BOOLEAN DEFAULT FALSE,
  visual_defect_description TEXT,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  feature TEXT NOT NULL,
  trend_type TEXT,
  current_percentage FLOAT,
  previous_percentage FLOAT,
  review_count INTEGER,
  window_size INTEGER DEFAULT 50,
  is_systemic BOOLEAN DEFAULT FALSE,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE directives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
  directive_type TEXT,
  payload JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE customer_sentiment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  reviewer_id TEXT NOT NULL,
  sentiment_score FLOAT,
  review_id UUID REFERENCES reviews(id),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_brand ON reviews(brand_id);
CREATE INDEX idx_insights_brand ON insights(brand_id);
CREATE INDEX idx_insights_review ON insights(review_id);
CREATE INDEX idx_trends_brand ON trends(brand_id);
CREATE INDEX idx_directives_brand ON directives(brand_id);
CREATE INDEX idx_sentiment_history_reviewer ON customer_sentiment_history(brand_id, reviewer_id);

ALTER PUBLICATION supabase_realtime ADD TABLE insights;
ALTER PUBLICATION supabase_realtime ADD TABLE trends;
ALTER PUBLICATION supabase_realtime ADD TABLE directives;s