import SentimentBar from "@/components/SentimentBar";

export default function FeatureCard({
  name,
  sentiment,
  score,
  confidence,
  excerpt,
}: {
  name: string;
  sentiment: string;
  score: number;
  confidence: number;
  excerpt: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold capitalize">{name}</p>
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">{sentiment}</span>
      </div>
      <SentimentBar score={score} />
      <p className="text-xs text-muted mt-1">Confidence: {(confidence * 100).toFixed(1)}%</p>
      <p className="text-xs italic text-muted mt-1">"{excerpt}"</p>
    </div>
  );
}

