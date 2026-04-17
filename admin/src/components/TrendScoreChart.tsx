"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function TrendScoreChart({
  lineData,
  linePositive,
}: {
  lineData: { day: string; score: number }[];
  linePositive: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height="90%">
      <LineChart data={lineData}>
        <XAxis dataKey="day" />
        <YAxis domain={[-1, 1]} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="score"
          stroke={linePositive ? "#6daa45" : "#dd6974"}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

