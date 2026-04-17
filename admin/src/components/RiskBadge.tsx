export default function RiskBadge({ level }: { level: "critical" | "warning" | "safe" }) {
  if (level === "critical") {
    return <span className="px-2 py-1 rounded-full text-xs bg-error/20 text-error">🚨 CRITICAL</span>;
  }
  if (level === "warning") {
    return <span className="px-2 py-1 rounded-full text-xs bg-warning/20 text-warning">⚠️ WARNING</span>;
  }
  return <span className="px-2 py-1 rounded-full text-xs bg-success/20 text-success">✅ SAFE</span>;
}

