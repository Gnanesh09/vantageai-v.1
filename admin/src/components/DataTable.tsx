"use client";

import { useMemo, useState } from "react";
import { InsightItem } from "@/types";
import { productNameById } from "@/lib/constants";

type SortKey =
  | "product"
  | "sentiment"
  | "score"
  | "confidence"
  | "rar"
  | "churn"
  | "date";

export default function DataTable({
  rows,
  loading,
  onRowClick,
}: {
  rows: InsightItem[];
  loading?: boolean;
  onRowClick: (item: InsightItem) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      if (sortKey === "product") return dir * productNameById(a.product_id).localeCompare(productNameById(b.product_id));
      if (sortKey === "sentiment") return dir * a.overall_sentiment.localeCompare(b.overall_sentiment);
      if (sortKey === "score") return dir * ((a.overall_score || 0) - (b.overall_score || 0));
      if (sortKey === "confidence") return dir * ((a.confidence_score || 0) - (b.confidence_score || 0));
      if (sortKey === "rar") return dir * ((a.rar_score || 0) - (b.rar_score || 0));
      if (sortKey === "churn") return dir * ((a.churn_risk || 0) - (b.churn_risk || 0));
      return dir * (new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    });
    return list;
  }, [rows, sortAsc, sortKey]);

  const toggle = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="overflow-auto thin-scrollbar max-h-[60vh]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-surface-2 z-10">
            <tr className="text-muted">
              <th className="text-left px-3 py-2">#</th>
              <th className="text-left px-3 py-2 cursor-pointer" onClick={() => toggle("product")}>Product</th>
              <th className="text-left px-3 py-2">Review</th>
              <th className="text-left px-3 py-2">Lang</th>
              <th className="text-left px-3 py-2 cursor-pointer" onClick={() => toggle("sentiment")}>Sentiment</th>
              <th className="text-left px-3 py-2 cursor-pointer" onClick={() => toggle("score")}>Score</th>
              <th className="text-left px-3 py-2 cursor-pointer" onClick={() => toggle("confidence")}>Confidence</th>
              <th className="text-left px-3 py-2 cursor-pointer" onClick={() => toggle("rar")}>RAR ₹</th>
              <th className="text-left px-3 py-2 cursor-pointer" onClick={() => toggle("churn")}>Churn %</th>
              <th className="text-left px-3 py-2">Sarcasm</th>
              <th className="text-left px-3 py-2">Bot</th>
              <th className="text-left px-3 py-2">Visual</th>
              <th className="text-left px-3 py-2 cursor-pointer" onClick={() => toggle("date")}>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              [0, 1, 2, 3, 4].map((i) => (
                <tr key={i} className="border-t border-border animate-pulse">
                  <td colSpan={13} className="px-3 py-3 text-muted">Loading...</td>
                </tr>
              ))}
            {!loading &&
              sorted.map((r, idx) => (
                <tr
                  key={r.review_id}
                  className="border-t border-border hover:bg-surface-2 cursor-pointer"
                  onClick={() => onRowClick(r)}
                >
                  <td className="px-3 py-2 text-muted">{idx + 1}</td>
                  <td className="px-3 py-2">{productNameById(r.product_id)}</td>
                  <td className="px-3 py-2 max-w-[260px] truncate">{r.raw_text}</td>
                  <td className="px-3 py-2">{r.detected_language || "-"}</td>
                  <td className="px-3 py-2 capitalize">{r.overall_sentiment}</td>
                  <td className="px-3 py-2">{(r.overall_score || 0).toFixed(2)}</td>
                  <td className="px-3 py-2">{((r.confidence_score || 0) * 100).toFixed(1)}%</td>
                  <td className="px-3 py-2">{(r.rar_score || 0).toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2">{((r.churn_risk || 0) * 100).toFixed(1)}%</td>
                  <td className="px-3 py-2">{r.is_sarcasm ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">{r.is_bot ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">{r.visual_defect_detected ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">{r.created_at ? new Date(r.created_at).toLocaleDateString("en-GB") : "-"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

