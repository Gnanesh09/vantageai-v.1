import { Star } from "lucide-react";

export default function StarRating({
  rating,
  count,
}: {
  rating: number;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              i < Math.round(rating) ? "fill-warning text-warning" : "text-muted/40"
            }`}
          />
        ))}
      </div>
      {typeof count === "number" && <span className="text-xs text-muted">({count})</span>}
    </div>
  );
}

