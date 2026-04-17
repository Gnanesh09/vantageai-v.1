import {
  AnalyzeResponse,
  BrandProduct,
  DirectiveItem,
  InsightItem,
  InsightsResponse,
  InsightsSummary,
  TrendItem,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const BRAND_ID = process.env.NEXT_PUBLIC_BRAND_ID || "";

async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
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

function normalizeInsight(item: InsightItem): InsightItem {
  const joined = Array.isArray(item.reviews) ? item.reviews[0] : item.reviews;
  return {
    ...item,
    review_id: item.review_id || String(item.id || ""),
    raw_text: item.raw_text || joined?.raw_text || "",
    star_rating: item.star_rating ?? joined?.star_rating,
    created_at: item.created_at || joined?.created_at,
  };
}

export async function getProducts(): Promise<BrandProduct[]> {
  const data = await request<BrandProduct[]>(`/brands/${BRAND_ID}/products`);
  return data || [];
}

export async function getInsights(params?: {
  productId?: string;
  limit?: number;
  offset?: number;
  sentiment?: string;
}): Promise<InsightsResponse> {
  const query = new URLSearchParams({
    brand_id: BRAND_ID,
    limit: String(params?.limit ?? 100),
    offset: String(params?.offset ?? 0),
  });
  if (params?.productId) query.set("product_id", params.productId);
  if (params?.sentiment) query.set("sentiment", params.sentiment);

  const data = await request<InsightsResponse>(`/insights/?${query.toString()}`);
  return {
    insights: (data?.insights || []).map((x) => normalizeInsight(x)),
    count: data?.count || 0,
  };
}

export async function getInsightsSummary(): Promise<InsightsSummary | null> {
  return await request<InsightsSummary>(`/insights/summary?brand_id=${BRAND_ID}`);
}

export async function getTrends(): Promise<{ trends: TrendItem[]; count: number }> {
  const data = await request<{ trends: TrendItem[]; count: number }>(`/trends/?brand_id=${BRAND_ID}`);
  return { trends: data?.trends || [], count: data?.count || 0 };
}

export async function getDirectives(): Promise<{ directives: DirectiveItem[]; count: number }> {
  const data = await request<{ directives: DirectiveItem[]; count: number }>(
    `/directives/?brand_id=${BRAND_ID}&status=pending`
  );
  return { directives: data?.directives || [], count: data?.count || 0 };
}

export async function analyzeReview(payload: {
  product_id: string;
  raw_text: string;
  star_rating?: number;
}): Promise<AnalyzeResponse | null> {
  return await request<AnalyzeResponse>(`/analyze/`, {
    method: "POST",
    body: JSON.stringify({
      brand_id: BRAND_ID,
      product_id: payload.product_id,
      raw_text: payload.raw_text,
      star_rating: payload.star_rating,
      reviewer_id: crypto.randomUUID(),
      source: "ecommerce",
    }),
  });
}

export const APP_META = { BRAND_ID };
