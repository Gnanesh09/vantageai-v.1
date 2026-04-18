"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getInsights, getProducts } from "@/lib/api";
import { inr } from "@/lib/compute";
import { productNameById } from "@/lib/constants";
import StarRating from "@/components/StarRating";
import SentimentBar from "@/components/SentimentBar";

function sentimentPill(sentiment: string) {
  const s = (sentiment || "neutral").toLowerCase();
  if (s === "positive") return "bg-success/20 text-success";
  if (s === "negative") return "bg-error/20 text-error";
  if (s === "mixed") return "bg-warning/20 text-warning";
  return "bg-surface border border-border text-muted";
}

export default function ProductInsightsPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id || "";

  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Awaited<ReturnType<typeof getInsights>>["insights"]>([]);
  const [products, setProducts] = useState<Awaited<ReturnType<typeof getProducts>>>([]);

  const load = async () => {
    if (!productId) return;
    setLoading(true);
    const [p, i] = await Promise.all([getProducts(), getInsights({ productId, limit: 100, offset: 0 })]);
    setProducts(p);
    setReviews(i.insights.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()));
    setLoading(false);
    window.dispatchEvent(new CustomEvent("warroom-synced"));
  };

  useEffect(() => {
    load();
    const r = () => load();
    window.addEventListener("warroom-refresh", r);
    return () => window.removeEventListener("warroom-refresh", r);
  }, [productId]);

  const product = useMemo(() => products.find((x) => x.id === productId), [products, productId]);

  const metrics = useMemo(() => {
    const total = reviews.length;
    const avgRating = total ? reviews.reduce((a, b) => a + (b.star_rating || 0), 0) / total : 0;
    const avgConfidence = total ? reviews.reduce((a, b) => a + (b.confidence_score || 0), 0) / total : 0;
    const totalRar = reviews.reduce((a, b) => a + (b.rar_score || 0), 0);
    const sentiment = {
      positive: reviews.filter((x) => x.overall_sentiment === "positive").length,
      negative: reviews.filter((x) => x.overall_sentiment === "negative").length,
      neutral: reviews.filter((x) => x.overall_sentiment === "neutral").length,
      mixed: reviews.filter((x) => x.overall_sentiment === "mixed").length,
    };
    const featureAgg: Record<string, { mentions: number; neg: number; score: number }> = {};
    reviews.forEach((r) => {
      Object.entries(r.feature_sentiments || {}).forEach(([feature, v]) => {
        if (!featureAgg[feature]) featureAgg[feature] = { mentions: 0, neg: 0, score: 0 };
        featureAgg[feature].mentions += 1;
        featureAgg[feature].score += v.score || 0;
        if ((v.sentiment || "").toLowerCase() === "negative") featureAgg[feature].neg += 1;
      });
    });
    const topRiskFeature = Object.entries(featureAgg)
      .map(([k, v]) => ({ name: k, negPct: v.mentions ? (v.neg / v.mentions) * 100 : 0 }))
      .sort((a, b) => b.negPct - a.negPct)[0];
    return { total, avgRating, avgConfidence, totalRar, sentiment, featureAgg, topRiskFeature };
  }, [reviews]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black">{productNameById(productId) || product?.name || "Product Insights"}</h2>
          <p className="text-xs text-muted">{product?.sku || ""} {product?.category ? `• ${product.category}` : ""}</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <Link href="/admin/products" className="text-muted hover:underline">← All Products</Link>
          <Link href={`/admin/reviews?product=${productId}`} className="text-accent hover:underline">Open Review Explorer</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-xs text-muted">Total Reviews</p>
          <p className="text-2xl font-black tabular-nums">{metrics.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-xs text-muted mb-1">Avg Rating</p>
          <StarRating rating={metrics.avgRating} count={metrics.total} />
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-xs text-muted">Total RAR</p>
          <p className="text-2xl font-black tabular-nums">₹{inr(metrics.totalRar)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-xs text-muted">Avg Confidence</p>
          <p className="text-2xl font-black tabular-nums">{(metrics.avgConfidence * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold">Sentiment Breakdown</p>
          <p className="text-xs text-muted">Top Risk Feature: <span className="capitalize text-text">{metrics.topRiskFeature?.name || "none"}</span></p>
        </div>
        <div className="h-2 rounded-full overflow-hidden flex mb-2">
          <div className="bg-success" style={{ width: `${(metrics.sentiment.positive / Math.max(1, metrics.total)) * 100}%` }} />
          <div className="bg-error" style={{ width: `${(metrics.sentiment.negative / Math.max(1, metrics.total)) * 100}%` }} />
          <div className="bg-muted" style={{ width: `${((metrics.sentiment.neutral + metrics.sentiment.mixed) / Math.max(1, metrics.total)) * 100}%` }} />
        </div>
        <p className="text-xs text-muted">
          Positive {metrics.sentiment.positive} • Negative {metrics.sentiment.negative} • Neutral {metrics.sentiment.neutral} • Mixed {metrics.sentiment.mixed}
        </p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-3">
        <h3 className="font-bold mb-3">Latest Product Reviews</h3>
        {loading && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-lg border border-border bg-surface-2 animate-pulse" />)}
          </div>
        )}
        {!loading && reviews.length === 0 && <p className="text-sm text-muted">No reviews for this product yet.</p>}
        {!loading && reviews.length > 0 && (
          <div className="space-y-2">
            {reviews.slice(0, 30).map((r) => (
              <article key={r.review_id} className="rounded-lg border border-border bg-surface-2 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <StarRating rating={r.star_rating || 0} />
                    <div className="flex items-center gap-2">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${sentimentPill(r.overall_sentiment)}`}>
                      {r.overall_sentiment}
                    </span>
                    <span className="text-[11px] text-muted">{new Date(r.created_at || Date.now()).toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <p className="text-sm mb-2">{r.raw_text}</p>
                <SentimentBar score={r.overall_score || 0} />
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(r.feature_sentiments || {}).slice(0, 4).map(([k, v]) => (
                    <span key={`${r.review_id}-${k}`} className="text-[11px] px-2 py-0.5 rounded-full bg-surface border border-border">
                      {k}: {(v.confidence * 100).toFixed(0)}%
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
