"use client";

import { useEffect, useMemo, useState } from "react";
import { getInsights } from "@/lib/api";
import { InsightItem } from "@/types";
import SentimentBadge from "@/components/SentimentBadge";
import StarRating from "@/components/StarRating";
import SkeletonCard from "@/components/SkeletonCard";

function dateLabel(value?: string): string {
  if (!value) return "Unknown";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(dt);
}

export default function ReviewList({ productId, refreshKey }: { productId: string; refreshKey: number }) {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<InsightItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let canceled = false;
    (async () => {
      setLoading(true);
      setError("");
      const res = await getInsights(productId, 20, 0);
      if (canceled) return;
      if (!res.insights.length && res.count === 0) {
        setReviews([]);
      } else {
        setReviews(res.insights);
      }
      setLoading(false);
    })().catch(() => {
      if (!canceled) {
        setError("Reviews unavailable");
        setLoading(false);
      }
    });

    return () => {
      canceled = true;
    };
  }, [productId, refreshKey]);

  const items = useMemo(() => reviews, [reviews]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) return <p className="text-sm font-semibold text-error">{error}</p>;

  if (items.length === 0) {
    return <p className="text-sm text-muted">Be the first to review this product!</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((review) => (
        <article key={review.review_id} className="bg-surface border border-gray-100 rounded-xl p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <StarRating rating={review.star_rating || 0} size="md" />
            <div className="flex items-center gap-2">
              <span className="text-xs rounded-full bg-gray-100 px-2 py-1 text-gray-700">
                {review.detected_language || "Unknown"}
              </span>
              <SentimentBadge sentiment={review.overall_sentiment} />
            </div>
          </div>

          <p className="text-sm text-gray-700 mb-2">{review.raw_text}</p>

          <div className="flex flex-wrap gap-2 mb-2">
            {Object.entries(review.feature_sentiments || {}).map(([feature, value]) => (
              <span
                key={`${review.review_id}-${feature}`}
                className="rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-700"
              >
                {feature}: {value.sentiment}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-muted">
            <span>{dateLabel(review.created_at)}</span>
            {review.is_sarcasm && <span className="text-yellow-700 font-semibold">⚠️ Sarcasm</span>}
          </div>
        </article>
      ))}
    </div>
  );
}
