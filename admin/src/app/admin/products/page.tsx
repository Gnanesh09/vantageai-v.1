"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getInsights, getProducts } from "@/lib/api";
import { groupByProduct, inr } from "@/lib/compute";
import { productNameById } from "@/lib/constants";
import StarRating from "@/components/StarRating";

export default function ProductsPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Awaited<ReturnType<typeof getProducts>>>([]);
  const [insights, setInsights] = useState<Awaited<ReturnType<typeof getInsights>>["insights"]>([]);

  const load = async () => {
    setLoading(true);
    const [p, i] = await Promise.all([getProducts(), getInsights({ limit: 100, offset: 0 })]);
    setProducts(p);
    setInsights(i.insights);
    window.dispatchEvent(new CustomEvent("warroom-synced"));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const r = () => load();
    window.addEventListener("warroom-refresh", r);
    return () => window.removeEventListener("warroom-refresh", r);
  }, []);

  const cards = useMemo(() => {
    const grouped = groupByProduct(insights);
    return products
      .map((p) => {
        const g = grouped[p.id] || {
          reviews: 0,
          stars: 0,
          rar: 0,
          sentiments: { positive: 0, negative: 0, neutral: 0, mixed: 0 },
          features: {},
        };
        const avg = g.reviews ? g.stars / g.reviews : 0;
        const topComplaint = Object.entries(g.features)
          .map(([k, v]) => ({ name: k, negPct: v.mentions ? (v.neg / v.mentions) * 100 : 0 }))
          .sort((a, b) => b.negPct - a.negPct)[0];
        return {
          ...p,
          reviewCount: g.reviews,
          avg,
          rar: g.rar,
          sentiments: g.sentiments,
          topComplaint: topComplaint?.name || "none",
        };
      })
      .sort((a, b) => b.rar - a.rar);
  }, [products, insights]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {!loading &&
        cards.map((p) => (
          <article key={p.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">{productNameById(p.id) || p.name}</h3>
              <span className="text-[11px] px-2 py-1 rounded-full bg-surface-2 text-muted">{p.category}</span>
            </div>
            <p className="text-xs text-muted mb-2">{p.sku}</p>
            <div className="mb-2">
              <StarRating rating={p.avg} count={p.reviewCount} />
            </div>
            <div className="h-2 rounded-full overflow-hidden flex mb-2">
              <div className="bg-success" style={{ width: `${(p.sentiments.positive / Math.max(1, p.reviewCount)) * 100}%` }} />
              <div className="bg-error" style={{ width: `${(p.sentiments.negative / Math.max(1, p.reviewCount)) * 100}%` }} />
              <div className="bg-muted" style={{ width: `${((p.sentiments.neutral + p.sentiments.mixed) / Math.max(1, p.reviewCount)) * 100}%` }} />
            </div>
            <p className="text-xs text-muted mb-1">Top complaint: <span className="capitalize text-text">{p.topComplaint}</span></p>
            <p className="text-sm font-bold mb-3">Total RAR: ₹{inr(p.rar)}</p>
            <Link href={`/admin/reviews?product=${p.id}`} className="text-xs text-accent hover:underline">
              View Reviews →
            </Link>
          </article>
        ))}
      {loading &&
        [0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-48 rounded-xl border border-border bg-surface animate-pulse" />
        ))}
    </div>
  );
}
