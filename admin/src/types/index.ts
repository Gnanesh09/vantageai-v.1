export type Sentiment = "positive" | "negative" | "neutral" | "mixed";

export interface BrandProduct {
  id: string;
  brand_id: string;
  name: string;
  category: string;
  sku: string;
  created_at: string;
}

export interface FeatureSentiment {
  sentiment: string;
  score: number;
  confidence: number;
  excerpt: string;
}

export interface InsightItem {
  review_id: string;
  product_id: string;
  raw_text: string;
  normalized_text?: string;
  star_rating?: number;
  reviewer_id?: string;
  detected_language?: string;
  overall_sentiment: Sentiment;
  overall_score: number;
  confidence_score: number;
  feature_sentiments: Record<string, FeatureSentiment>;
  is_sarcasm: boolean;
  is_ambiguous: boolean;
  is_bot: boolean;
  rar_score: number;
  churn_risk: number;
  svi_score: number;
  visual_defect_detected: boolean;
  created_at?: string;
  reviews?: {
    raw_text?: string;
    star_rating?: number;
    created_at?: string;
  } | {
    raw_text?: string;
    star_rating?: number;
    created_at?: string;
  }[];
  [key: string]: unknown;
}

export interface InsightsResponse {
  insights: InsightItem[];
  count: number;
}

export interface InsightsSummary {
  total_reviews: number;
  sentiment_breakdown: {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
  };
  total_rar_inr: number;
  avg_churn_risk: number;
  high_churn_customers: number;
  negative_pct: number;
}

export interface TrendItem {
  id?: string;
  brand_id?: string;
  product_id?: string;
  trend_type?: string;
  trend_name?: string;
  description?: string;
  signal?: string;
  direction?: string;
  impact_score?: number;
  confidence_score?: number;
  is_systemic?: boolean;
  detected_at?: string;
  [key: string]: unknown;
}

export interface DirectiveItem {
  id?: string;
  brand_id?: string;
  product_id?: string;
  directive_type?: string;
  title?: string;
  action_text?: string;
  description?: string;
  reason?: string;
  owner?: string;
  priority?: string;
  status?: string;
  created_at?: string;
  due_at?: string;
  [key: string]: unknown;
}

export interface AnalyzeResponse {
  review_id: string;
  normalized_text: string;
  detected_language: string;
  is_sarcasm: boolean;
  is_ambiguous: boolean;
  is_bot: boolean;
  overall_sentiment: Sentiment;
  overall_score: number;
  confidence_score: number;
  feature_sentiments: Record<string, FeatureSentiment>;
  rar_score: number;
  churn_risk: number;
  svi_score: number;
  visual_defect_detected: boolean;
}
