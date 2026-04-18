"use client";

import { useEffect, useMemo, useState } from "react";
import nextDynamic from "next/dynamic";
import { getInsights, getProducts, getTrends } from "@/lib/api";
import { computeProductTrendActions, computeTrendFallback, scoreByDay } from "@/lib/compute";
import { InsightItem, TrendItem } from "@/types";
import { productNameById } from "@/lib/constants";
const TrendScoreChart = nextDynamic(() => import("@/components/TrendScoreChart"), {
  ssr: false,
});

export default function TrendsPage() {
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [productFilter, setProductFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    const [t, i, p] = await Promise.all([getTrends(), getInsights({ limit: 400, offset: 0 }), getProducts()]);
    const names: Record<string, string> = {};
    p.forEach((x) => {
      names[x.id] = x.name;
    });
    setProductNames(names);
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
  const productActions = useMemo(() => computeProductTrendActions(insights), [insights]);
  const productIds = useMemo(
    () => Array.from(new Set(insights.map((x) => x.product_id).filter(Boolean))) as string[],
    [insights]
  );

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

  const actionRows = useMemo(() => {
    const rows = productActions.filter((x) => productFilter === "all" || x.productId === productFilter);
    const sorted = [...rows].sort((a, b) => b.currentNegativePct - a.currentNegativePct);
    return sorted.slice(0, 36);
  }, [productActions, productFilter]);

  const productRanking = useMemo(() => {
    const rank: Record<string, { risk: number; opportunities: number; issues: number; actions: number }> = {};
    for (const row of productActions) {
      if (!rank[row.productId]) rank[row.productId] = { risk: 0, opportunities: 0, issues: 0, actions: 0 };
      rank[row.productId].actions += 1;
      rank[row.productId].risk += Math.max(0, row.currentNegativePct + row.delta);
      if (row.direction === "worsening") rank[row.productId].issues += 1;
      if (row.direction === "improving") rank[row.productId].opportunities += 1;
    }
    return Object.entries(rank)
      .map(([productId, x]) => ({ productId, ...x }))
      .sort((a, b) => b.risk - a.risk);
  }, [productActions]);

  const booming = useMemo(
    () =>
      actionRows
        .filter((x) => x.direction === "improving" && x.currentNegativePct < x.previousNegativePct)
        .sort((a, b) => (b.previousNegativePct - b.currentNegativePct) - (a.previousNegativePct - a.currentNegativePct))
        .slice(0, 6),
    [actionRows]
  );

  const painPoints = useMemo(
    () =>
      actionRows
        .filter((x) => x.direction === "worsening")
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 8),
    [actionRows]
  );

  const needs = useMemo(() => {
    const list: { need: string; confidence: number; impact: "high" | "medium" | "low" }[] = [];
    const pushNeed = (need: string, confidence: number, impact: "high" | "medium" | "low") => {
      list.push({ need, confidence, impact });
    };
    for (const x of painPoints) {
      const pName = productNames[x.productId] || productNameById(x.productId);
      if (x.feature.includes("packaging")) {
        pushNeed(`${pName}: customers need stronger packaging integrity and leak-proof handling.`, Math.min(95, 70 + Math.round(x.delta)), "high");
      } else if (x.feature.includes("delivery")) {
        pushNeed(`${pName}: customers need faster and safer delivery with reduced handling damage.`, Math.min(92, 68 + Math.round(x.delta)), "high");
      } else if (x.feature.includes("taste") || x.feature.includes("freshness")) {
        pushNeed(`${pName}: customers need fresher stock and more consistent product quality.`, Math.min(90, 65 + Math.round(x.delta)), "high");
      } else {
        pushNeed(`${pName}: customers need improvement in ${x.feature} experience consistency.`, Math.min(88, 60 + Math.round(x.delta)), "medium");
      }
    }
    return list.slice(0, 8);
  }, [painPoints, productNames]);

  const badge = (sev: string) =>
    sev === "critical"
      ? "bg-error/20 text-error"
      : sev === "warning"
      ? "bg-warning/20 text-warning"
      : "bg-surface-2 text-muted";

  const productLabel = (id: string) => productNames[id] || productNameById(id);

  return (
    <div className="space-y-3">
      <section className="rounded-xl border border-border bg-surface p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-sm">Product Intelligence Trends</h3>
          <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="text-xs bg-surface-2 border border-border rounded px-2 py-1.5">
            <option value="all">All products</option>
            {productIds.map((id) => (
              <option key={id} value={id}>{productLabel(id)}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-muted mt-1">
          AI-ranked trend actions by product, built from feature-level sentiment shift, mention volume, and direction change.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-surface p-3">
        <h3 className="text-sm font-bold mb-2">All Products Trend Ranking</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
          {productRanking.map((p) => (
            <button
              key={p.productId}
              onClick={() => setProductFilter(p.productId)}
              className={`text-left rounded-lg border p-3 ${productFilter === p.productId ? "border-accent bg-accent/10" : "border-border bg-surface-2"}`}
            >
              <p className="text-xs font-semibold">{productLabel(p.productId)}</p>
              <p className="text-[11px] text-muted mt-1">Risk Index: {p.risk.toFixed(1)}</p>
              <p className="text-[11px] text-muted">Issues: {p.issues} · Opportunities: {p.opportunities}</p>
              <p className="text-[11px] text-muted">Action Signals: {p.actions}</p>
            </button>
          ))}
        </div>
        {productFilter !== "all" && (
          <div className="mt-2">
            <button onClick={() => setProductFilter("all")} className="text-xs text-accent hover:underline">
              Clear product filter
            </button>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface p-3">
          <h4 className="text-sm font-bold mb-2">About To Boom (Positive Momentum)</h4>
          {booming.length === 0 && <p className="text-xs text-muted">No strong positive inflections yet.</p>}
          <div className="space-y-2">
            {booming.map((x, idx) => (
              <div key={`${x.productId}-${x.feature}-boom-${idx}`} className="rounded-lg border border-border bg-surface-2 p-2">
                <p className="text-xs font-semibold">{productLabel(x.productId)} · <span className="capitalize">{x.feature}</span></p>
                <p className="text-[11px] text-success">Improving: {x.previousNegativePct.toFixed(1)}% → {x.currentNegativePct.toFixed(1)}%</p>
                <p className="text-[11px] text-muted mt-1">Scale marketing message around this improving attribute.</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-3">
          <h4 className="text-sm font-bold mb-2">What Customers Need Next</h4>
          {needs.length === 0 && <p className="text-xs text-muted">Not enough high-signal data yet.</p>}
          <div className="space-y-2">
            {needs.map((n, idx) => (
              <div key={`need-${idx}`} className="rounded-lg border border-border bg-surface-2 p-2">
                <p className="text-xs">{n.need}</p>
                <p className="text-[11px] text-muted mt-1">Confidence: {n.confidence}% · Impact: {n.impact}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-3">
        <h3 className="text-sm font-bold mb-2">Actionable Product Trend Playbook</h3>
        <div className="space-y-2">
          {actionRows.map((x, idx) => (
            <article key={`${x.productId}-${x.feature}-${idx}`} className="rounded-lg border border-border bg-surface-2 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <p className="text-sm font-semibold">{productLabel(x.productId)} · <span className="capitalize">{x.feature}</span></p>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${badge(x.severity)}`}>{x.severity.toUpperCase()}</span>
              </div>
              <p className="text-xs text-muted mb-2">
                Trend: {x.direction} · Negative mentions {x.previousNegativePct.toFixed(1)}% → {x.currentNegativePct.toFixed(1)}% · Delta {x.delta >= 0 ? "+" : ""}{x.delta.toFixed(1)} pts · Mentions {x.mentions}
              </p>
              <ul className="space-y-1">
                {x.actions.slice(0, 3).map((step, stepIdx) => (
                  <li key={`${x.productId}-${x.feature}-step-${stepIdx}`} className="text-xs">{stepIdx + 1}. {step}</li>
                ))}
              </ul>
            </article>
          ))}
          {!loading && actionRows.length === 0 && <p className="text-xs text-muted">No product-level trend actions available yet.</p>}
        </div>
      </section>

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
