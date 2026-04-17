export type OverallSentiment = "positive" | "negative" | "neutral" | "mixed";

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

export interface AnalyzeReviewResponse {
  review_id: string;
  normalized_text: string;
  detected_language: string;
  is_sarcasm: boolean;
  is_ambiguous: boolean;
  is_bot: boolean;
  overall_sentiment: OverallSentiment;
  overall_score: number;
  confidence_score: number;
  feature_sentiments: Record<string, FeatureSentiment>;
  rar_score: number;
  churn_risk: number;
  svi_score: number;
  visual_defect_detected: boolean;
}

export interface InsightReview {
  raw_text?: string;
  star_rating?: number;
  source?: string;
  created_at?: string;
}

export interface InsightItem {
  id?: string;
  review_id: string;
  product_id?: string;
  raw_text: string;
  star_rating?: number;
  detected_language?: string;
  overall_sentiment: OverallSentiment;
  overall_score: number;
  confidence_score: number;
  feature_sentiments: Record<string, FeatureSentiment>;
  is_sarcasm: boolean;
  is_bot: boolean;
  created_at?: string;
  reviews?: InsightReview | InsightReview[];
  rar_score?: number;
  churn_risk?: number;
  svi_score?: number;
}

export interface InsightsResponse {
  insights: InsightItem[];
  count: number;
}

export interface InsightsSummaryResponse {
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

export interface ReviewPayload {
  brand_id: string;
  product_id: string;
  raw_text: string;
  star_rating: number;
  reviewer_id: string;
  source: "ecommerce";
  image_url?: string;
}

export interface SwiftCartProduct extends BrandProduct {
  price: number;
  originalPrice: number;
  weight: string;
  deliveryTime: string;
  image: string;
  inStock: boolean;
  rating: number;
  reviewCount: number;
}

export interface CartItem {
  product: SwiftCartProduct;
  qty: number;
}
