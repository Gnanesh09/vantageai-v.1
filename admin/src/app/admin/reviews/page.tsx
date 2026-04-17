"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import DataTable from "@/components/DataTable";
import FeatureCard from "@/components/FeatureCard";
import SentimentBar from "@/components/SentimentBar";
import { getInsights } from "@/lib/api";
import { toCsv } from "@/lib/compute";
import { productNameById } from "@/lib/constants";
import { InsightItem } from "@/types";

const PAGE_SIZE = 20;

export default function ReviewsPage() {
  const params = useSearchParams();
  const initialProduct = params.get("product") || "all";
  const [rows, setRows] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<InsightItem | null>(null);

  const [product, setProduct] = useState(initialProduct);
  const [sentiment, setSentiment] = useState("all");
  const [bot, setBot] = useState("all");
  const [sarcasm, setSarcasm] = useState("all");
  const [risk, setRisk] = useState("all");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await getInsights({ limit: 100, offset: 0 });
    setRows(res.insights.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()));
    setLoading(false);
    window.dispatchEvent(new CustomEvent("warroom-synced"));
  };

  useEffect(() => {
    load();
    const r = () => load();
    window.addEventListener("warroom-refresh", r);
    return () => window.removeEventListener("warroom-refresh", r);
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (product !== "all" && r.product_id !== product) return false;
      if (sentiment !== "all" && r.overall_sentiment !== sentiment) return false;
      if (bot === "hide" && r.is_bot) return false;
      if (bot === "only" && !r.is_bot) return false;
      if (sarcasm === "flag" && !r.is_sarcasm) return false;
      if (risk === "rar" && (r.rar_score || 0) <= 2000) return false;
      if (risk === "churn" && (r.churn_risk || 0) <= 0.7) return false;
      if (from && new Date(r.created_at || 0) < new Date(from)) return false;
      if (to && new Date(r.created_at || 0) > new Date(to + "T23:59:59")) return false;
      if (search && !r.raw_text.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [rows, product, sentiment, bot, sarcasm, risk, from, to, search]);

  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const stats = useMemo(() => {
    const positive = filtered.filter((x) => x.overall_sentiment === "positive").length;
    const negative = filtered.filter((x) => x.overall_sentiment === "negative").length;
    const bots = filtered.filter((x) => x.is_bot).length;
    const rar = filtered.reduce((a, b) => a + (b.rar_score || 0), 0);
    return { positive, negative, bots, rar };
  }, [filtered]);

  const exportCsv = () => {
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vantageai_reviews.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const productOptions = Array.from(new Set(rows.map((x) => x.product_id))).filter(Boolean);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-surface p-3 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-2 text-xs">
        <select value={product} onChange={(e) => setProduct(e.target.value)} className="bg-surface-2 border border-border rounded px-2 py-1.5">
          <option value="all">All products</option>
          {productOptions.map((id) => (
            <option key={id} value={id}>{productNameById(id)}</option>
          ))}
        </select>
        <select value={sentiment} onChange={(e) => setSentiment(e.target.value)} className="bg-surface-2 border border-border rounded px-2 py-1.5">
          <option value="all">All sentiments</option>
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
          <option value="neutral">Neutral</option>
          <option value="mixed">Mixed</option>
        </select>
        <select value={bot} onChange={(e) => setBot(e.target.value)} className="bg-surface-2 border border-border rounded px-2 py-1.5">
          <option value="all">Show all bots</option>
          <option value="hide">Hide bots</option>
          <option value="only">Bots only</option>
        </select>
        <select value={sarcasm} onChange={(e) => setSarcasm(e.target.value)} className="bg-surface-2 border border-border rounded px-2 py-1.5">
          <option value="all">All sarcasm</option>
          <option value="flag">Flag sarcasm</option>
        </select>
        <select value={risk} onChange={(e) => setRisk(e.target.value)} className="bg-surface-2 border border-border rounded px-2 py-1.5">
          <option value="all">All risk</option>
          <option value="rar">High RAR {">"} ₹2000</option>
          <option value="churn">High Churn {">"} 0.7</option>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-surface-2 border border-border rounded px-2 py-1.5" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-surface-2 border border-border rounded px-2 py-1.5" />
      </div>

      <div className="rounded-xl border border-border bg-surface p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div>
          Showing <b>{filtered.length}</b> of <b>{rows.length}</b> reviews ·
          {" "}Positive <b>{stats.positive}</b> · Negative <b>{stats.negative}</b> · Bots <b>{stats.bots}</b> · ₹<b>{stats.rar.toLocaleString("en-IN")}</b> at risk
        </div>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search text"
            className="bg-surface-2 border border-border rounded px-2 py-1.5"
          />
          <button onClick={exportCsv} className="px-3 py-1.5 rounded bg-accent text-white">Export CSV</button>
        </div>
      </div>

      <DataTable rows={paged} loading={loading} onRowClick={setSelected} />

      <div className="flex items-center justify-end gap-2 text-xs">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 rounded border border-border disabled:opacity-40">Prev</button>
        <span>{page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 rounded border border-border disabled:opacity-40">Next</button>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-4xl bg-surface border border-border rounded-xl p-4 max-h-[90vh] overflow-y-auto thin-scrollbar" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black mb-2">{productNameById(selected.product_id)}</h3>
            <p className="text-sm mb-2">{selected.raw_text}</p>
            {selected.normalized_text && selected.normalized_text !== selected.raw_text && (
              <p className="text-xs text-muted mb-2">Normalized: {selected.normalized_text}</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-3">
              <div className="bg-surface-2 rounded p-2">Language: <b>{selected.detected_language || "-"}</b></div>
              <div className="bg-surface-2 rounded p-2">RAR: ₹<b>{(selected.rar_score || 0).toLocaleString("en-IN")}</b></div>
              <div className="bg-surface-2 rounded p-2">Churn: <b>{((selected.churn_risk || 0) * 100).toFixed(1)}%</b></div>
              <div className="bg-surface-2 rounded p-2">SVI: <b>{(selected.svi_score || 0).toFixed(2)}</b></div>
            </div>
            <SentimentBar score={selected.overall_score || 0} />
            <p className="text-xs text-muted mt-2">
              Flags: {selected.is_sarcasm ? "Sarcasm " : ""}{selected.is_bot ? "Bot " : ""}{selected.is_ambiguous ? "Ambiguous " : ""}{selected.visual_defect_detected ? "Visual Defect" : ""}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
              {Object.entries(selected.feature_sentiments || {}).map(([name, f]) => (
                <FeatureCard key={name} name={name} sentiment={f.sentiment} score={f.score} confidence={f.confidence} excerpt={f.excerpt} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
