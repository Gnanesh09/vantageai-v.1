export function ProductSkeleton() {
  return (
    <div className="bg-white border text-left border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col h-full min-w-[200px] md:min-w-[240px] relative animate-pulse">
      
      {/* Image Skeleton */}
      <div className="bg-gray-200 rounded-xl aspect-square mb-4 w-full"></div>

      {/* Title Skeleton */}
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      
      {/* Rating Skeleton */}
      <div className="h-3 bg-gray-200 rounded w-1/4 mb-4"></div>

      <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
        <div className="flex flex-col gap-1 w-1/3">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        </div>
        <div className="h-9 w-16 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-4 md:gap-6 overflow-x-hidden pb-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}
