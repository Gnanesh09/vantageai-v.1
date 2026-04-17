import { CATEGORIES } from "@/lib/data";

export default function CategoryStrip() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-3 overflow-x-auto no-scrollbar">
      <div className="flex gap-2 min-w-max">
        {CATEGORIES.map((category) => (
          <span
            key={category}
            className="px-4 py-1.5 rounded-full bg-surface border border-gray-200 text-xs font-semibold text-gray-700"
          >
            {category}
          </span>
        ))}
      </div>
    </div>
  );
}
