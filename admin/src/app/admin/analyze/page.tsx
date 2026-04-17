"use client";

import { FormEvent, useMemo, useState } from "react";
import { analyzeReview } from "@/lib/api";
import { PRODUCT_MAP, productNameById } from "@/lib/constants";
import { AnalyzeResponse } from "@/types";
import SentimentBar from "@/components/SentimentBar";
import ChurnRing from "@/components/ChurnRing";
import FeatureCard from "@/components/FeatureCard";

type HistoryItem = { input: string; productId: string; result: AnalyzeResponse };

export default function AnalyzePage() {
  const [productId, setProductId] = useState(Object.keys(PRODUCT_MAP)[0]);
  const [text, setText] = useState("");
  const [rating, setRating] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const rarAction = useMemo(() => {
    const rar = result?.rar_score || 0;
    if (rar > 2000) return "QA Alert triggered";
    if (rar >= 500) return "Monitor";
    return "No action needed";
  }, [result]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    const res = await analyzeReview({
      product_id: productId,
      raw_text: text.trim(),
      star_rating: typeof rating === "number" ? rating : undefined,
    });
    setLoading(false);
    if (!res) return;
    setResult(res);
    setHistory((prev) => [{ input: text.trim(), productId, result: res }, ...prev].slice(0, 10));
    window.dispatchEvent(new CustomEvent("warroom-synced"));
  };

  return (
    <div className="space-y-3">
      <form onSubmit={onSubmit} className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className="bg-surface-2 border border-border rounded px-2 py-2 text-sm">
            {Object.keys(PRODUCT_MAP).map((id) => (
              <option key={id} value={id}>{productNameById(id)}</option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            max={5}
            value={rating}
            onChange={(e) => setRating(e.target.value ? Number(e.target.value) : "")}
            className="bg-surface-2 border border-border rounded px-2 py-2 text-sm"
            placeholder="Star rating (optional)"
          />
          <button disabled={loading} className="rounded bg-accent text-white px-3 py-2 text-sm font-bold">
            {loading ? "Analyzing..." : "Analyze →"}
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste any review text here..."
          className="w-full h-28 bg-surface-2 border border-border rounded p-2 text-sm"
        />
      </form>

      {result && (
        <section className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <p className="text-sm text-muted">Input: "{text}"</p>
          <p className="text-xs text-muted">Normalized: "{result.normalized_text}"</p>
          <p className="text-xs">Language: <span className="px-2 py-0.5 rounded bg-surface-2">{result.detected_language}</span></p>

          <div className="rounded-lg bg-surface-2 p-3">
            <p className="text-xs mb-2">Overall Sentiment: <b className="capitalize">{result.overall_sentiment}</b></p>
            <SentimentBar score={result.overall_score} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className={`rounded p-2 ${result.is_sarcasm ? "bg-warning/20 text-warning" : "bg-surface-2"}`}>Sarcasm</div>
            <div className={`rounded p-2 ${result.is_bot ? "bg-error/20 text-error" : "bg-surface-2"}`}>Bot</div>
            <div className={`rounded p-2 ${result.is_ambiguous ? "bg-warning/20 text-warning" : "bg-surface-2"}`}>Ambiguous</div>
            <div className={`rounded p-2 ${result.visual_defect_detected ? "bg-error/20 text-error" : "bg-surface-2"}`}>Visual Defect</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(result.feature_sentiments || {}).map(([name, feature]) => (
              <FeatureCard key={name} name={name} sentiment={feature.sentiment} score={feature.score} confidence={feature.confidence} excerpt={feature.excerpt} />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="rounded bg-surface-2 p-3">
              <p>RAR Score: ₹{result.rar_score.toLocaleString("en-IN")}</p>
              <p className="text-muted mt-1">{rarAction}</p>
            </div>
            <div className="rounded bg-surface-2 p-3 flex items-center gap-3">
              <ChurnRing value={result.churn_risk} />
              <p>{(result.churn_risk * 100).toFixed(1)}% chance this customer churns</p>
            </div>
            <div className="rounded bg-surface-2 p-3">SVI Score: {result.svi_score.toFixed(2)}</div>
          </div>

          <button onClick={() => setShowRaw((v) => !v)} className="text-xs text-accent hover:underline">
            {showRaw ? "Hide" : "Show"} raw API response
          </button>
          {showRaw && (
            <pre className="text-[11px] bg-black/40 rounded p-3 overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          )}
        </section>
      )}

      <section className="rounded-xl border border-border bg-surface p-4">
        <h3 className="text-sm font-bold mb-2">Recent Analyses</h3>
        <div className="space-y-2">
          {history.map((h, i) => (
            <div key={`${h.result.review_id}-${i}`} className="text-xs rounded bg-surface-2 p-2">
              <p className="font-semibold">{productNameById(h.productId)} · {h.result.overall_sentiment}</p>
              <p className="text-muted truncate">{h.input}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
