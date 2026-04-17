import { OverallSentiment } from "@/types";

const MAP: Record<OverallSentiment, { text: string; cls: string }> = {
  positive: { text: "😊 Positive", cls: "bg-green-100 text-green-700" },
  negative: { text: "😞 Negative", cls: "bg-red-100 text-red-700" },
  neutral: { text: "😐 Neutral", cls: "bg-gray-100 text-gray-700" },
  mixed: { text: "🤔 Mixed", cls: "bg-yellow-100 text-yellow-700" },
};

export default function SentimentBadge({ sentiment }: { sentiment: OverallSentiment }) {
  const item = MAP[sentiment];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.cls}`}>{item.text}</span>;
}
