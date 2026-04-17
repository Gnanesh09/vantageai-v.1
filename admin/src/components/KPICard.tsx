"use client";

import { useEffect, useMemo, useState } from "react";

export default function KPICard({
  title,
  value,
  sub,
  color = "safe",
}: {
  title: string;
  value: number;
  sub?: string;
  color?: "safe" | "warning" | "critical";
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 600;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(value * t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const topColor = useMemo(() => {
    if (color === "critical") return "border-error";
    if (color === "warning") return "border-warning";
    return "border-success";
  }, [color]);

  return (
    <div className={`bg-surface border border-border border-t-2 ${topColor} rounded-xl p-4`}>
      <p className="text-xs text-muted mb-1">{title}</p>
      <p className="text-2xl font-black countup">{Math.round(display).toLocaleString("en-IN")}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}

