import { Star } from "lucide-react";

export default function StarRating({
  rating,
  count,
  size = "sm",
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md";
}) {
  const starSize = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[0, 1, 2, 3, 4].map((idx) => {
          const value = rating - idx;
          if (value >= 1) {
            return <Star key={idx} className={`${starSize} fill-yellow-400 text-yellow-400`} />;
          }
          if (value > 0) {
            return (
              <div key={idx} className="relative">
                <Star className={`${starSize} text-gray-300`} />
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${Math.round(value * 100)}%` }}>
                  <Star className={`${starSize} fill-yellow-400 text-yellow-400`} />
                </div>
              </div>
            );
          }
          return <Star key={idx} className={`${starSize} text-gray-300`} />;
        })}
      </div>
      {typeof count === "number" && <span className="text-xs text-muted">({count})</span>}
    </div>
  );
}
