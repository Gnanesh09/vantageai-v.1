import { DirectiveItem, InsightItem, Sentiment } from "@/types";
import { productNameById } from "@/lib/constants";

export function inr(value: number): string {
  return value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function sentimentColor(sentiment: Sentiment): string {
  if (sentiment === "positive") return "#6daa45";
  if (sentiment === "negative") return "#dd6974";
  if (sentiment === "mixed") return "#fdab43";
  return "#8a8885";
}

export function groupByProduct(insights: InsightItem[]) {
  const map: Record<
    string,
    {
      reviews: number;
      stars: number;
      rar: number;
      sentiments: Record<Sentiment, number>;
      features: Record<string, { total: number; neg: number; mentions: number }>;
    }
  > = {};

  for (const it of insights) {
    const key = it.product_id || "unknown";
    if (!map[key]) {
      map[key] = {
        reviews: 0,
        stars: 0,
        rar: 0,
        sentiments: { positive: 0, negative: 0, neutral: 0, mixed: 0 },
        features: {},
      };
    }
    map[key].reviews += 1;
    map[key].stars += it.star_rating || 0;
    map[key].rar += it.rar_score || 0;
    map[key].sentiments[it.overall_sentiment] += 1;

    Object.entries(it.feature_sentiments || {}).forEach(([feature, v]) => {
      if (!map[key].features[feature]) {
        map[key].features[feature] = { total: 0, neg: 0, mentions: 0 };
      }
      map[key].features[feature].total += v.score || 0;
      map[key].features[feature].mentions += 1;
      if ((v.sentiment || "").toLowerCase() === "negative") {
        map[key].features[feature].neg += 1;
      }
    });
  }
  return map;
}

export function computeFeatureHealth(insights: InsightItem[]) {
  const features: Record<string, { score: number; mentions: number; neg: number }> = {};
  for (const it of insights) {
    Object.entries(it.feature_sentiments || {}).forEach(([k, v]) => {
      if (!features[k]) features[k] = { score: 0, mentions: 0, neg: 0 };
      features[k].score += v.score || 0;
      features[k].mentions += 1;
      if ((v.sentiment || "").toLowerCase() === "negative") features[k].neg += 1;
    });
  }
  return Object.entries(features).map(([name, d]) => ({
    name,
    avgScore: d.mentions ? d.score / d.mentions : 0,
    negativePct: d.mentions ? (d.neg / d.mentions) * 100 : 0,
    mentions: d.mentions,
  }));
}

export function computeTrendFallback(insights: InsightItem[]) {
  const sorted = [...insights].sort(
    (a, b) =>
      new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
  );
  const mid = Math.floor(sorted.length / 2);
  const oldHalf = sorted.slice(0, mid);
  const newHalf = sorted.slice(mid);

  const avgFeature = (arr: InsightItem[]) => {
    const m: Record<string, { total: number; count: number }> = {};
    arr.forEach((x) => {
      Object.entries(x.feature_sentiments || {}).forEach(([k, v]) => {
        if (!m[k]) m[k] = { total: 0, count: 0 };
        m[k].total += v.score || 0;
        m[k].count += 1;
      });
    });
    return m;
  };

  const oldMap = avgFeature(oldHalf);
  const newMap = avgFeature(newHalf);
  const keys = Array.from(new Set([...Object.keys(oldMap), ...Object.keys(newMap)]));

  return keys.map((k) => {
    const oldAvg = oldMap[k]?.count ? oldMap[k].total / oldMap[k].count : 0;
    const newAvg = newMap[k]?.count ? newMap[k].total / newMap[k].count : 0;
    const diff = newAvg - oldAvg;
    const direction =
      diff > 0.02 ? "Improving ↑" : diff < -0.02 ? "Declining ↓" : "Stable →";
    return {
      feature: k,
      oldAvg,
      newAvg,
      current: newAvg,
      mentions: (newMap[k]?.count || 0) + (oldMap[k]?.count || 0),
      direction,
    };
  });
}

export function scoreByDay(insights: InsightItem[]) {
  const m: Record<string, { total: number; count: number }> = {};
  insights.forEach((i) => {
    const d = new Date(i.created_at || Date.now());
    const key = d.toISOString().slice(0, 10);
    if (!m[key]) m[key] = { total: 0, count: 0 };
    m[key].total += i.overall_score || 0;
    m[key].count += 1;
  });
  return Object.entries(m)
    .map(([day, v]) => ({ day, score: v.count ? v.total / v.count : 0 }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

export function generateDirectives(insights: InsightItem[]): DirectiveItem[] {
  const grouped = groupByProduct(insights);
  const out: DirectiveItem[] = [];

  Object.entries(grouped).forEach(([productId, g]) => {
    const packaging = g.features["packaging"];
    if (packaging && packaging.mentions > 0 && packaging.neg / packaging.mentions > 0.3) {
      out.push({
        id: `qa-${productId}`,
        product_id: productId,
        title: `QA Alert: ${productNameById(productId)} packaging complaints above threshold`,
        description: "Packaging negatives crossed 30%.",
        priority: "critical",
        status: "pending",
      });
    }

    const churns = insights
      .filter((x) => x.product_id === productId)
      .map((x) => x.churn_risk || 0);
    const churnAvg = churns.length ? churns.reduce((a, b) => a + b, 0) / churns.length : 0;
    if (churnAvg > 0.6) {
      out.push({
        id: `churn-${productId}`,
        product_id: productId,
        title: `Retention Alert: ${productNameById(productId)} high churn risk customers`,
        description: `Average churn risk ${(churnAvg * 100).toFixed(1)}%`,
        priority: "warning",
        status: "pending",
      });
    }

    const bots = insights.filter((x) => x.product_id === productId && x.is_bot).length;
    if (bots > 2) {
      out.push({
        id: `bot-${productId}`,
        product_id: productId,
        title: `Bot Activity: ${productNameById(productId)} ${bots} reviews flagged`,
        priority: "warning",
        status: "pending",
      });
    }

    const total = insights.filter((x) => x.product_id === productId).length || 1;
    const botPct = (bots / total) * 100;
    if (botPct >= 15) {
      out.push({
        id: `bot-surge-${productId}`,
        product_id: productId,
        directive_type: "bot_activity",
        title: `Bot Surge: ${productNameById(productId)} suspicious pattern rising`,
        description: `${botPct.toFixed(1)}% of reviews flagged as bot-like`,
        action_text: "Run moderation sweep and exclude suspicious entries from KPI rollups.",
        owner: "Trust & Safety",
        priority: "critical",
        status: "pending",
      });
    }

    const sarcasm = insights.filter((x) => x.product_id === productId && x.is_sarcasm).length;
    if (sarcasm > 1) {
      out.push({
        id: `sarcasm-${productId}`,
        product_id: productId,
        title: `Sarcasm Detected: ${productNameById(productId)} quality check needed`,
        priority: "info",
        status: "pending",
      });
    }

    const lowConfidence = insights.filter((x) => x.product_id === productId && (x.confidence_score || 0) < 0.45).length;
    if (lowConfidence >= 3) {
      out.push({
        id: `lowconf-${productId}`,
        product_id: productId,
        directive_type: "low_confidence",
        title: `Model Confidence Watch: ${productNameById(productId)}`,
        description: `${lowConfidence} low-confidence analyses need human validation`,
        action_text: "Send flagged reviews to analyst queue before operational actions.",
        owner: "Data Analyst",
        priority: "warning",
        status: "pending",
      });
    }

    const visual = insights.some(
      (x) => x.product_id === productId && x.visual_defect_detected
    );
    if (visual) {
      out.push({
        id: `visual-${productId}`,
        product_id: productId,
        title: `Visual Defect: ${productNameById(productId)} image analysis flagged damage`,
        priority: "critical",
        status: "pending",
      });
    }

    const severeNegative = insights.filter(
      (x) => x.product_id === productId && ((x.overall_score || 0) <= -0.75 || (x.star_rating || 5) <= 2)
    ).length;
    if (severeNegative >= 2) {
      out.push({
        id: `cx-${productId}`,
        product_id: productId,
        directive_type: "cx_recovery",
        title: `Customer Recovery Needed: ${productNameById(productId)}`,
        description: `${severeNegative} severe dissatisfaction reviews detected`,
        action_text: "Trigger refund/replacement workflow for impacted customers.",
        owner: "Customer Support",
        priority: "critical",
        status: "pending",
      });
    }

    if (g.rar > 5000) {
      out.push({
        id: `rar-${productId}`,
        product_id: productId,
        title: `Revenue at Risk: ₹${inr(g.rar)} from ${productNameById(productId)} complaints`,
        priority: g.rar > 20000 ? "critical" : "warning",
        status: "pending",
      });
    }

    if (g.sentiments.negative / Math.max(1, g.reviews) > 0.45) {
      out.push({
        id: `sentiment-crisis-${productId}`,
        product_id: productId,
        directive_type: "sentiment_crisis",
        title: `Sentiment Crisis: ${productNameById(productId)} negative rate is critical`,
        description: `Negative share ${(100 * g.sentiments.negative / Math.max(1, g.reviews)).toFixed(1)}%`,
        action_text: "Open cross-functional war-room and deploy 7-day corrective plan.",
        owner: "War Room Lead",
        priority: "critical",
        status: "pending",
      });
    }
  });

  return out;
}

export function toCsv(rows: InsightItem[]) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = [
    "date",
    "product",
    "review_text",
    "language",
    "sentiment",
    "score",
    "rar_inr",
    "churn_risk",
    "is_sarcasm",
    "is_bot",
    "feature_sentiments_json",
  ];
  const lines = rows.map((r) =>
    [
      r.created_at,
      productNameById(r.product_id),
      r.raw_text,
      r.detected_language,
      r.overall_sentiment,
      r.overall_score,
      r.rar_score,
      r.churn_risk,
      r.is_sarcasm,
      r.is_bot,
      JSON.stringify(r.feature_sentiments || {}),
    ]
      .map(esc)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

const FEATURE_ACTIONS: Record<string, string[]> = {
  packaging: [
    "Run packaging QA audit on latest batch and tighten seal validation.",
    "Increase dispatch-side random QC for this SKU."
  ],
  delivery: [
    "Audit delayed/damaged deliveries by zone and fix last-mile SOP.",
    "Add rider handling checklist for fragile items."
  ],
  taste: [
    "Validate supplier lot quality and perform batch tasting test.",
    "Pause low-scoring lot and switch to verified batch."
  ],
  freshness: [
    "Enforce stricter FIFO checks in dark stores.",
    "Increase freshness audits for the next 7 days."
  ],
  quality: [
    "Open QA CAPA with owner and 24h root-cause deadline.",
    "Track complaint recurrence daily until stabilized."
  ],
  missing_items: [
    "Audit pick-pack flow and enable double-scan for this SKU.",
    "Monitor short-shipment incidents daily."
  ],
};

export type ProductTrendAction = {
  productId: string;
  feature: string;
  direction: "worsening" | "improving" | "stable";
  severity: "critical" | "warning" | "info";
  currentNegativePct: number;
  previousNegativePct: number;
  delta: number;
  mentions: number;
  actions: string[];
};

export function computeProductTrendActions(insights: InsightItem[]): ProductTrendAction[] {
  const byProduct: Record<string, InsightItem[]> = {};
  for (const row of insights) {
    if (!row.product_id) continue;
    if (!byProduct[row.product_id]) byProduct[row.product_id] = [];
    byProduct[row.product_id].push(row);
  }

  const out: ProductTrendAction[] = [];
  for (const [productId, rows] of Object.entries(byProduct)) {
    const sorted = [...rows].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    if (sorted.length < 8) continue;

    const mid = Math.floor(sorted.length / 2);
    const oldHalf = sorted.slice(0, mid);
    const newHalf = sorted.slice(mid);

    const featureKeys = Array.from(
      new Set(sorted.flatMap((r) => Object.keys(r.feature_sentiments || {})))
    );

    for (const feature of featureKeys) {
      const oldMentions = oldHalf.filter((r) => r.feature_sentiments?.[feature]).length;
      const newMentions = newHalf.filter((r) => r.feature_sentiments?.[feature]).length;
      const mentions = oldMentions + newMentions;
      if (mentions < 3) continue;

      const oldNeg = oldHalf.filter((r) => {
        const f = r.feature_sentiments?.[feature];
        return f && (f.sentiment === "negative" || f.sentiment === "mixed");
      }).length;
      const newNeg = newHalf.filter((r) => {
        const f = r.feature_sentiments?.[feature];
        return f && (f.sentiment === "negative" || f.sentiment === "mixed");
      }).length;

      const oldPct = oldNeg / Math.max(oldHalf.length, 1);
      const newPct = newNeg / Math.max(newHalf.length, 1);
      const delta = newPct - oldPct;

      let direction: ProductTrendAction["direction"] = "stable";
      if (delta >= 0.06) direction = "worsening";
      if (delta <= -0.06) direction = "improving";

      let severity: ProductTrendAction["severity"] = "info";
      if (direction === "worsening" && (newPct >= 0.35 || delta >= 0.15)) severity = "critical";
      else if (direction === "worsening" && (newPct >= 0.2 || delta >= 0.08)) severity = "warning";

      if (direction === "stable" && newPct < 0.15) continue;

      const defaultActions = [
        `Investigate ${feature} complaints for ${productNameById(productId)} within 24h.`,
        "Assign product owner and track daily until trend improves."
      ];

      out.push({
        productId,
        feature,
        direction,
        severity,
        currentNegativePct: newPct * 100,
        previousNegativePct: oldPct * 100,
        delta: delta * 100,
        mentions,
        actions: FEATURE_ACTIONS[feature] || defaultActions,
      });
    }
  }

  return out.sort((a, b) => {
    const sev = { critical: 3, warning: 2, info: 1 };
    const s = sev[b.severity] - sev[a.severity];
    if (s !== 0) return s;
    return b.delta - a.delta;
  });
}
