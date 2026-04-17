import {
  AnalyzeReviewResponse,
  BrandProduct,
  InsightItem,
  InsightsResponse,
  InsightsSummaryResponse,
  ReviewPayload,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const BRAND_ID = process.env.NEXT_PUBLIC_BRAND_ID || "";

let reviewerId = "";

function getReviewerId(): string {
  if (!reviewerId) {
    reviewerId = crypto.randomUUID();
  }
  return reviewerId;
}

function safeJoinReview(insight: InsightItem) {
  const joined = insight.reviews;
  if (!joined) return {} as { raw_text?: string; star_rating?: number; created_at?: string };
  if (Array.isArray(joined)) return joined[0] || {};
  return joined;
}

function normalizeInsight(item: InsightItem): InsightItem {
  const joined = safeJoinReview(item);
  return {
    ...item,
    review_id: item.review_id || item.id || "",
    raw_text: item.raw_text || joined.raw_text || "",
    star_rating: item.star_rating ?? joined.star_rating,
    created_at: item.created_at || joined.created_at,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getProducts(brandId: string): Promise<BrandProduct[]> {
  try {
    const data = await request<BrandProduct[]>(`/brands/${brandId}/products`);
    return data || [];
  } catch {
    return [];
  }
}

export async function submitReview(
  payload: Omit<ReviewPayload, "brand_id" | "reviewer_id"> & { reviewer_id?: string }
): Promise<{ review_id: string; status: string } | null> {
  try {
    const body: ReviewPayload = {
      ...payload,
      brand_id: BRAND_ID,
      reviewer_id: payload.reviewer_id || getReviewerId(),
      source: "ecommerce",
    };
    return await request<{ review_id: string; status: string }>("/ingest/", {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch {
    return null;
  }
}

export async function analyzeReview(
  payload: Omit<ReviewPayload, "brand_id" | "reviewer_id"> & { reviewer_id?: string }
): Promise<AnalyzeReviewResponse | null> {
  try {
    const body: ReviewPayload = {
      ...payload,
      brand_id: BRAND_ID,
      reviewer_id: payload.reviewer_id || getReviewerId(),
      source: "ecommerce",
    };
    return await request<AnalyzeReviewResponse>("/analyze/", {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch {
    return null;
  }
}

export async function getInsights(
  productId?: string,
  limit = 20,
  offset = 0
): Promise<InsightsResponse> {
  try {
    const params = new URLSearchParams({
      brand_id: BRAND_ID,
      limit: String(limit),
      offset: String(offset),
    });
    if (productId) params.set("product_id", productId);

    const data = await request<InsightsResponse>(`/insights/?${params.toString()}`);
    if (!data) return { insights: [], count: 0 };

    return {
      count: data.count || 0,
      insights: (data.insights || []).map((i) => normalizeInsight(i)),
    };
  } catch {
    return { insights: [], count: 0 };
  }
}

export async function getInsightsSummary(): Promise<InsightsSummaryResponse | null> {
  try {
    const params = new URLSearchParams({ brand_id: BRAND_ID });
    return await request<InsightsSummaryResponse>(`/insights/summary?${params.toString()}`);
  } catch {
    return null;
  }
}

export async function getProductRatings(): Promise<Record<string, { rating: number; reviewCount: number }>> {
  try {
    const all = await getInsights(undefined, 1000, 0);
    const grouped: Record<string, { total: number; count: number }> = {};

    all.insights.forEach((review) => {
      if (!review.product_id || !review.star_rating) return;
      if (!grouped[review.product_id]) grouped[review.product_id] = { total: 0, count: 0 };
      grouped[review.product_id].total += review.star_rating;
      grouped[review.product_id].count += 1;
    });

    const result: Record<string, { rating: number; reviewCount: number }> = {};
    Object.entries(grouped).forEach(([productId, item]) => {
      result[productId] = {
        rating: Number((item.total / item.count).toFixed(1)),
        reviewCount: item.count,
      };
    });

    return result;
  } catch {
    return {};
  }
}

export const API_CONSTANTS = {
  BRAND_ID,
  reviewerId: getReviewerId,
};
