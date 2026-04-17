"use client";

import { useEffect, useMemo, useState } from "react";
import nextDynamic from "next/dynamic";
import KPICard from "@/components/KPICard";
import { getInsights, getInsightsSummary, getProducts } from "@/lib/api";
import { computeFeatureHealth, groupByProduct, inr, sentimentColor } from "@/lib/compute";
import { InsightItem } from "@/types";
import { productNameById } from "@/lib/constants";
const SentimentDonut = nextDynamic(
  () => import("@/components/OverviewCharts").then((m) => m.SentimentDonut),
  { ssr: false }
);
const TopRarChart = nextDynamic(
  () => import("@/components/OverviewCharts").then((m) => m.TopRarChart),
  { ssr: false }
);

export default function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_reviews: 0,
    sentiment_breakdown: { positive: 0, negative: 0, neutral: 0, mixed: 0 },
    total_rar_inr: 0,
    avg_churn_risk: 0,
    high_churn_customers: 0,
    negative_pct: 0,
  });
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [lastCount, setLastCount] = useState(0);
  const [toast, setToast] = useState("");
  const [selected, setSelected] = useState<InsightItem | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [summaryRes, insightsRes] = await Promise.all([
      getInsightsSummary(),
      getInsights({ limit: 100, offset: 0 }),
      getProducts(),
    ]);

    const items = insightsRes.insights;
    if (summaryRes) setSummary(summaryRes);
    setInsights(items);
    if (lastCount > 0 && items.length > lastCount) {
      setToast(`${items.length - lastCount} new reviews since last sync`);
      setTimeout(() => setToast(""), 2500);
    }
    setLastCount(items.length);
    window.dispatchEvent(new CustomEvent("warroom-synced"));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const refresh = () => fetchData();
    window.addEventListener("warroom-refresh", refresh);
    const i = setInterval(fetchData, 60000);
    return () => {
      window.removeEventListener("warroom-refresh", refresh);
      clearInterval(i);
    };
  }, []);

  const donut = useMemo(
    () => [
      { name: "Positive", value: summary.sentiment_breakdown.positive, color: "#6daa45" },
      { name: "Negative", value: summary.sentiment_breakdown.negative, color: "#dd6974" },
      { name: "Neutral", value: summary.sentiment_breakdown.neutral, color: "#8a8885" },
      { name: "Mixed", value: summary.sentiment_breakdown.mixed, color: "#fdab43" },
    ],
    [summary]
  );

  const topRar = useMemo(() => {
    const grouped = groupByProduct(insights);
    return Object.entries(grouped)
      .map(([productId, v]) => ({
        name: productNameById(productId),
        rar: Math.round(v.rar),
      }))
      .sort((a, b) => b.rar - a.rar)
      .slice(0, 5);
  }, [insights]);

  const highRisk = useMemo(
    () =>
      [...insights]
        .filter((i) => (i.churn_risk || 0) > 0.5 || (i.rar_score || 0) > 1000)
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, 10),
    [insights]
  );

  const featureHealth = useMemo(() => computeFeatureHealth(insights), [insights]);

  return (
    <div className="space-y-4">
      {toast && <div className="rounded-lg bg-accent/20 border border-accent/40 text-accent px-3 py-2 text-sm">{toast}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard title="Total Reviews" value={summary.total_reviews} sub="+ live sync" color="safe" />
        <KPICard
          title="Revenue at Risk"
          value={summary.total_rar_inr}
          sub="Across all products"
          color={summary.total_rar_inr > 20000 ? "critical" : summary.total_rar_inr > 5000 ? "warning" : "safe"}
        />
        <KPICard
          title="Avg Churn Risk"
          value={summary.avg_churn_risk * 100}
          sub={`${summary.high_churn_customers} high-risk customers`}
          color={summary.avg_churn_risk > 0.5 ? "critical" : summary.avg_churn_risk > 0.3 ? "warning" : "safe"}
        />
        <KPICard
          title="Negative Reviews %"
          value={summary.negative_pct}
          sub={`${summary.sentiment_breakdown.negative} reviews need action`}
          color={summary.negative_pct > 40 ? "critical" : "warning"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <section className="rounded-xl border border-border bg-surface p-4 h-[320px]">
          <h3 className="text-sm font-bold mb-3">Sentiment</h3>
          <SentimentDonut donut={donut} />
        </section>

        <section className="rounded-xl border border-border bg-surface p-4 h-[320px]">
          <h3 className="text-sm font-bold mb-3">Top Products by RAR</h3>
          <TopRarChart rows={topRar} />
        </section>
      </div>

      <section className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-sm font-bold">Recent High-Risk Reviews</div>
        <table className="w-full text-xs">
          <thead className="text-muted">
            <tr>
              <th className="text-left px-3 py-2">Product</th>
              <th className="text-left px-3 py-2">Review</th>
              <th className="text-left px-3 py-2">Sentiment</th>
              <th className="text-left px-3 py-2">RAR ₹</th>
              <th className="text-left px-3 py-2">Churn %</th>
              <th className="text-left px-3 py-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {(loading ? [] : highRisk).map((r) => {
              const c = (r.churn_risk || 0) > 0.7 ? "bg-error" : (r.churn_risk || 0) > 0.4 ? "bg-warning" : "bg-success";
              return (
                <tr key={r.review_id} className="border-t border-border hover:bg-surface-2 cursor-pointer" onClick={() => setSelected(r)}>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-2">
                      <span className={`w-1.5 h-4 rounded ${c}`} />
                      {productNameById(r.product_id)}
                    </span>
                  </td>
                  <td className="px-3 py-2 max-w-[380px] truncate">{r.raw_text}</td>
                  <td className="px-3 py-2 capitalize">{r.overall_sentiment}</td>
                  <td className="px-3 py-2">{inr(r.rar_score || 0)}</td>
                  <td className="px-3 py-2">{((r.churn_risk || 0) * 100).toFixed(1)}%</td>
                  <td className="px-3 py-2">{r.created_at ? new Date(r.created_at).toLocaleString("en-IN") : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {featureHealth.map((f) => (
          <div key={f.name} className="rounded-xl border border-border bg-surface p-3">
            <p className="text-sm font-bold capitalize">{f.name}</p>
            <div className="mt-2 h-2 bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-2"
                style={{
                  width: `${Math.min(100, Math.max(0, ((f.avgScore + 1) / 2) * 100))}%`,
                  background: f.avgScore < -0.2 ? "#dd6974" : f.avgScore < 0.2 ? "#fdab43" : "#6daa45",
                }}
              />
            </div>
            <p className="text-xs text-muted mt-2">{f.negativePct.toFixed(1)}% negative · {f.mentions} mentions</p>
          </div>
        ))}
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-2xl rounded-xl border border-border bg-surface p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black mb-2">{productNameById(selected.product_id)}</h3>
            <p className="text-sm text-muted mb-2">{selected.created_at ? new Date(selected.created_at).toLocaleString("en-IN") : "-"}</p>
            <p className="text-sm mb-3">{selected.raw_text}</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-surface-2 rounded p-2">Sentiment: <b style={{ color: sentimentColor(selected.overall_sentiment) }}>{selected.overall_sentiment}</b></div>
              <div className="bg-surface-2 rounded p-2">RAR: ₹{inr(selected.rar_score || 0)}</div>
              <div className="bg-surface-2 rounded p-2">Churn: {((selected.churn_risk || 0) * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
