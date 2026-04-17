"use client";

import { useState } from "react";
import ReviewForm from "@/components/ReviewForm";
import ReviewList from "@/components/ReviewList";

export default function ProductReviews({
  productId,
  total,
  positivePct,
  avgRating,
}: {
  productId: string;
  total: number;
  positivePct: number;
  avgRating: number;
}) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <section className="mt-8 space-y-4">
      <div className="grid grid-cols-3 gap-2 text-center bg-white border border-gray-100 rounded-xl p-3">
        <div>
          <p className="text-xs text-muted">Total Reviews</p>
          <p className="font-black text-text">{total}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Positive</p>
          <p className="font-black text-success">{positivePct.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-muted">Avg Rating</p>
          <p className="font-black text-text">{avgRating.toFixed(1)}</p>
        </div>
      </div>

      <ReviewForm productId={productId} onPosted={() => setRefreshKey((k) => k + 1)} />
      <ReviewList productId={productId} refreshKey={refreshKey} />
    </section>
  );
}
