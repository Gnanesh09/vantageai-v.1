export default function ChurnRing({ value }: { value: number }) {
  const v = Math.max(0, Math.min(1, value));
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * (1 - v);
  const color = v > 0.6 ? "#dd6974" : v > 0.3 ? "#fdab43" : "#6daa45";

  return (
    <div className="relative w-16 h-16">
      <svg className="w-16 h-16 -rotate-90">
        <circle cx="32" cy="32" r={radius} stroke="#333" strokeWidth="6" fill="none" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
        {(v * 100).toFixed(0)}%
      </span>
    </div>
  );
}

