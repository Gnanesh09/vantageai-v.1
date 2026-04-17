export default function SkeletonCard() {
  return (
    <div className="bg-surface rounded-2xl p-3 border border-gray-100 shadow-sm skeleton-shimmer">
      <div className="h-32 bg-gray-100 rounded-xl mb-3" />
      <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
      <div className="h-8 bg-gray-100 rounded-xl" />
    </div>
  );
}
