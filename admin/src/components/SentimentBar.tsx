export default function SentimentBar({ score }: { score: number }) {
  const clamped = Math.max(-1, Math.min(1, score));
  const left = ((clamped + 1) / 2) * 100;
  return (
    <div>
      <div className="relative h-2 rounded-full overflow-hidden bg-gradient-to-r from-error via-muted to-success">
        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border border-border" style={{ left: `calc(${left}% - 6px)` }} />
      </div>
      <p className="text-xs text-muted mt-1">{score.toFixed(2)}</p>
    </div>
  );
}

