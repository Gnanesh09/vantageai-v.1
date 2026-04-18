"use client";

import { useEffect, useMemo, useState } from "react";
import nextDynamic from "next/dynamic";
import { getInsights, getTrends } from "@/lib/api";
import { computeTrendFallback, scoreByDay } from "@/lib/compute";
import { InsightItem, TrendItem } from "@/types";
const TrendScoreChart = nextDynamic(() => import("@/components/TrendScoreChart"), {
  ssr: false,
});

export default function TrendsPage() {
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [insights, setInsights] = useState<InsightItem[]>([]);

  const load = async () => {
    setLoading(true);
    const [t, i] = await Promise.all([getTrends(), getInsights({ limit: 200, offset: 0 })]);
    setTrends(t.trends || []);
    setInsights(i.insights || []);
    setLoading(false);
    window.dispatchEvent(new CustomEvent("warroom-synced"));
  };

  useEffect(() => {
    load();
    const r = () => load();
    window.addEventListener("warroom-refresh", r);
    return () => window.removeEventListener("warroom-refresh", r);
  }, []);

  const fallback = useMemo(() => computeTrendFallback(insights), [insights]);
  const lineData = useMemo(() => scoreByDay(insights), [insights]);
  const linePositive =
    lineData.length > 1 ? lineData[lineData.length - 1].score >= lineData[0].score : true;

  const normalizedTrends = useMemo(() => {
    if (trends.length === 0) return [];

    const keyed = new Map<
      string,
      {
        feature: string;
        direction: string;
        current: number;
        previous: number;
        mentions: number;
        detectedAt: number;
      }
    >();

    for (const t of trends) {
      const feature = String(t.feature || t.trend_name || t.trend_type || t.signal || "trend");
      const trendType = String(t.trend_type || "trend");
      const current = Number(t.current_percentage || 0);
      const previous = Number(t.previous_percentage || 0);
      const mentions = Number(t.review_count || 0);
      const diff = current - previous;
      const direction =
        diff > 3 ? "Declining ↓" : diff < -3 ? "Improving ↑" : "Stable →";
      const detectedAt = new Date(String(t.detected_at || 0)).getTime() || 0;
      const key = `${feature}-${trendType}`;
      const prev = keyed.get(key);

      if (!prev || detectedAt >= prev.detectedAt) {
        keyed.set(key, { feature, direction, current, previous, mentions, detectedAt });
      }
    }

    return [...keyed.values()]
      .sort((a, b) => b.detectedAt - a.detectedAt)
      .slice(0, 18);
  }, [trends]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {(trends.length > 0 ? normalizedTrends : fallback).map((x, idx) => (
          <div key={`${x.feature}-${x.direction}-${idx}`} className="rounded-xl border border-border bg-surface p-3">
            <p className="text-sm font-bold capitalize">{x.feature}</p>
            <p className={`text-xs mt-1 ${x.direction.includes("Improving") ? "text-success" : x.direction.includes("Declining") ? "text-error" : "text-muted"}`}>
              {x.direction}
            </p>
            <p className="text-xs text-muted mt-2">
              Current negative %: {Number(x.current).toFixed(1)}
              {"previous" in x ? ` (prev ${Number((x as { previous?: number }).previous || 0).toFixed(1)})` : ""}
            </p>
            <p className="text-xs text-muted">Mentions: {x.mentions}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-surface p-4 h-[330px]">
        <h3 className="text-sm font-bold mb-3">Overall Score Trend by Day</h3>
        <TrendScoreChart lineData={lineData} linePositive={linePositive} />
      </section>

      {loading && <p className="text-xs text-muted">Loading trends...</p>}
    </div>
  );
}
