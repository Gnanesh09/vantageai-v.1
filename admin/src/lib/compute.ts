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

    if (g.rar > 5000) {
      out.push({
        id: `rar-${productId}`,
        product_id: productId,
        title: `Revenue at Risk: ₹${inr(g.rar)} from ${productNameById(productId)} complaints`,
        priority: g.rar > 20000 ? "critical" : "warning",
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
