"use client";

import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function SentimentDonut({
  donut,
}: {
  donut: { name: string; value: number; color: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="90%">
      <PieChart>
        <Pie data={donut} dataKey="value" nameKey="name" innerRadius={64} outerRadius={95}>
          {donut.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TopRarChart({
  rows,
}: {
  rows: { name: string; rar: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="90%">
      <BarChart data={rows} layout="vertical">
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={140} />
        <Tooltip />
        <Bar dataKey="rar">
          {rows.map((x) => (
            <Cell key={x.name} fill={x.rar > 8000 ? "#dd6974" : x.rar > 3000 ? "#fdab43" : "#6daa45"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

