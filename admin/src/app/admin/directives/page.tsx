"use client";

import { useEffect, useMemo, useState } from "react";
import { getDirectives, getInsights, getProducts } from "@/lib/api";
import { generateDirectives } from "@/lib/compute";
import RiskBadge from "@/components/RiskBadge";
import { DirectiveItem, InsightItem } from "@/types";
import { productNameById } from "@/lib/constants";

export default function DirectivesPage() {
  const [items, setItems] = useState<DirectiveItem[]>([]);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [productNameMap, setProductNameMap] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<DirectiveItem | null>(null);
  const [sortBy, setSortBy] = useState("priority_desc");

  const load = async () => {
    const [d, i, p] = await Promise.all([getDirectives(), getInsights({ limit: 300, offset: 0 }), getProducts()]);
    const names: Record<string, string> = {};
    p.forEach((x) => {
      names[x.id] = x.name;
    });
    setProductNameMap(names);
    setInsights(i.insights);
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
  const typeCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const d of unresolved) {
      const k = d.directive_type || "other";
      m[k] = (m[k] || 0) + 1;
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [unresolved]);
  const reviewToProduct = useMemo(() => {
    const m: Record<string, string> = {};
    for (const i of insights) {
      if (i.review_id && i.product_id) m[i.review_id] = i.product_id;
    }
    return m;
  }, [insights]);

  const resolveProductId = (d: DirectiveItem) => d.product_id || (d.review_id ? reviewToProduct[d.review_id] : undefined);
  const resolveProductName = (d: DirectiveItem) => {
    const pid = resolveProductId(d);
    if (!pid) return "Unknown Product";
    return productNameMap[pid] || productNameById(pid);
  };
  const buildAiFollowups = (d: DirectiveItem): string[] => {
    if (d.recommended_actions && d.recommended_actions.length) return d.recommended_actions;
    const keys = d.feature_keys || [];
    if (keys.includes("packaging")) return ["Run packaging QA audit for current batch.", "Update handling SOP and retrain dispatch team."];
    if (keys.includes("delivery")) return ["Audit last-mile delays/damage zones.", "Add stricter handoff checklist for riders."];
    if (keys.includes("taste") || keys.includes("freshness")) return ["Check lot freshness and supplier batch quality.", "Pause low-performing batch until QA clearance."];
    if ((d.directive_type || "").includes("churn")) return ["Open retention ticket with SLA.", "Offer replacement/refund and capture follow-up feedback."];
    return ["Assign owner and root cause within 24h.", "Publish corrective action with ETA to Support and Ops."];
  };
  const getPriorityRank = (d: DirectiveItem) => {
    const p = String(d.priority || "info").toLowerCase();
    if (p === "critical") return 3;
    if (p === "warning") return 2;
    return 1;
  };
  const getPayloadNum = (d: DirectiveItem, key: string) => {
    const payload = (d.payload || {}) as Record<string, unknown>;
    const raw = payload[key];
    const n = typeof raw === "number" ? raw : Number(raw || 0);
    return Number.isFinite(n) ? n : 0;
  };
  const getCreatedAt = (d: DirectiveItem) =>
    new Date(String(d.created_at || ((d.payload as Record<string, unknown> | undefined)?.last_seen_at || 0))).getTime() || 0;

  const sortedUnresolved = useMemo(() => {
    const rows = [...unresolved];
    rows.sort((a, b) => {
      if (sortBy === "priority_desc") {
        const p = getPriorityRank(b) - getPriorityRank(a);
        if (p !== 0) return p;
        return getCreatedAt(b) - getCreatedAt(a);
      }
      if (sortBy === "newest") return getCreatedAt(b) - getCreatedAt(a);
      if (sortBy === "oldest") return getCreatedAt(a) - getCreatedAt(b);
      if (sortBy === "rar_desc") return getPayloadNum(b, "rar_score") - getPayloadNum(a, "rar_score");
      if (sortBy === "churn_desc") return getPayloadNum(b, "churn_risk") - getPayloadNum(a, "churn_risk");
      if (sortBy === "due_asc") {
        const ad = typeof a.due_hours === "number" ? a.due_hours : 9999;
        const bd = typeof b.due_hours === "number" ? b.due_hours : 9999;
        return ad - bd;
      }
      return 0;
    });
    return rows;
  }, [unresolved, sortBy]);

  const markResolved = (id?: string) => {
    if (!id) return;
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: "resolved" } : x)));
  };

  return (
    <div className="space-y-3">
      {unresolved.length > 0 && (
        <section className="rounded-xl border border-border bg-surface p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h3 className="text-sm font-bold">Alerts Coverage</h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs bg-surface-2 border border-border rounded px-2 py-1.5"
            >
              <option value="priority_desc">Sort: Priority (Critical First)</option>
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="rar_desc">Sort: Highest RAR</option>
              <option value="churn_desc">Sort: Highest Churn</option>
              <option value="due_asc">Sort: Earliest Due</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {typeCounts.map(([type, count]) => (
              <span key={type} className="text-xs px-2.5 py-1 rounded-full bg-surface-2 border border-border">
                {type}: <b>{count}</b>
              </span>
            ))}
          </div>
        </section>
      )}

      {unresolved.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="font-bold">All clear! No active directives.</p>
        </div>
      )}

      {sortedUnresolved.map((d) => {
        const level = (d.priority || "").toLowerCase();
        const risk = level === "critical" ? "critical" : level === "warning" ? "warning" : "safe";
        return (
          <article key={d.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="font-bold">{d.title || d.directive_type || "Directive"}</h3>
              <RiskBadge level={risk} />
            </div>
            <p className="text-sm text-muted mb-2">{d.description || d.action_text || d.reason || "Action required."}</p>
            {d.action_text && <p className="text-xs text-accent mb-2">Action: {d.action_text}</p>}
            <div className="text-xs text-muted mb-2 flex flex-wrap gap-3">
              <span>Product: {resolveProductName(d)}</span>
              {d.owner && <span>Owner: {d.owner}</span>}
              {typeof d.due_hours === "number" && <span>Due: {d.due_hours}h</span>}
            </div>
            {buildAiFollowups(d).length > 0 && (
              <div className="mb-3">
                <p className="text-[11px] uppercase tracking-wide text-muted mb-1">AI Follow-Ups</p>
                <ul className="space-y-1">
                  {buildAiFollowups(d).slice(0, 4).map((step, idx) => (
                    <li key={`${d.id}-step-${idx}`} className="text-xs text-text">
                      {idx + 1}. {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
              defaultValue={`Team,\n\nAction requested for: ${draft.title}\nProduct: ${resolveProductName(draft)}\nPriority: ${(draft.priority || "info").toUpperCase()}\nOwner: ${draft.owner || "Assign owner"}\nDue: ${typeof draft.due_hours === "number" ? `${draft.due_hours} hours` : "Set SLA"}\n\nPrimary Action:\n${draft.action_text || "Investigate and close loop."}\n\nPlan:\n1. ${(buildAiFollowups(draft)[0]) || "Investigate root cause immediately."}\n2. ${(buildAiFollowups(draft)[1]) || "Share corrective action with owner + ETA."}\n3. ${(buildAiFollowups(draft)[2]) || "Close loop with QA and Support."}\n\nRegards,\nVantageAI War Room`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
