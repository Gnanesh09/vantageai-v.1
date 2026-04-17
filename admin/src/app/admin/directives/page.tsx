"use client";

import { useEffect, useMemo, useState } from "react";
import { getDirectives, getInsights } from "@/lib/api";
import { generateDirectives } from "@/lib/compute";
import RiskBadge from "@/components/RiskBadge";
import { DirectiveItem } from "@/types";
import { productNameById } from "@/lib/constants";

export default function DirectivesPage() {
  const [items, setItems] = useState<DirectiveItem[]>([]);
  const [draft, setDraft] = useState<DirectiveItem | null>(null);

  const load = async () => {
    const [d, i] = await Promise.all([getDirectives(), getInsights({ limit: 200, offset: 0 })]);
    const generated = d.directives.length > 0 ? d.directives : generateDirectives(i.insights);
    setItems(generated);
    window.dispatchEvent(new CustomEvent("warroom-synced"));
  };

  useEffect(() => {
    load();
    const r = () => load();
    window.addEventListener("warroom-refresh", r);
    return () => window.removeEventListener("warroom-refresh", r);
  }, []);

  const unresolved = useMemo(() => items.filter((x) => x.status !== "resolved"), [items]);

  const markResolved = (id?: string) => {
    if (!id) return;
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: "resolved" } : x)));
  };

  return (
    <div className="space-y-3">
      {unresolved.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="font-bold">All clear! No active directives.</p>
        </div>
      )}

      {unresolved.map((d) => {
        const level = (d.priority || "").toLowerCase();
        const risk = level === "critical" ? "critical" : level === "warning" ? "warning" : "safe";
        return (
          <article key={d.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="font-bold">{d.title || d.directive_type || "Directive"}</h3>
              <RiskBadge level={risk} />
            </div>
            <p className="text-sm text-muted mb-3">{d.description || d.action_text || d.reason || "Action required."}</p>
            <p className="text-xs text-muted mb-3">Product: {productNameById(d.product_id)}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => markResolved(d.id)} className="px-3 py-1.5 rounded bg-success/20 text-success text-xs">
                Mark Resolved
              </button>
              <button onClick={() => setDraft(d)} className="px-3 py-1.5 rounded bg-accent/20 text-accent text-xs">
                Draft Response
              </button>
            </div>
          </article>
        );
      })}

      {draft && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setDraft(null)}>
          <div className="w-full max-w-xl rounded-xl border border-border bg-surface p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black mb-2">Draft Response</h3>
            <textarea
              className="w-full h-44 rounded-lg border border-border bg-surface-2 p-2 text-sm"
              defaultValue={`Team,\n\nAction requested for: ${draft.title}\nProduct: ${productNameById(draft.product_id)}\nPriority: ${(draft.priority || "info").toUpperCase()}\n\nPlan:\n1. Investigate root cause within 24h.\n2. Share corrective action and owner.\n3. Close loop with QA and Support.\n\nRegards,\nVantageAI War Room`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
