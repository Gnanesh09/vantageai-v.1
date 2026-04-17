import { ProductGridSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 mt-20">
      <div className="animate-pulse flex flex-col gap-8">
        <div className="h-20 bg-gray-200 rounded-2xl w-full mb-8"></div>
        <div className="h-64 bg-gray-200 rounded-3xl w-full mb-8"></div>
        
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded-lg mb-6"></div>
          <ProductGridSkeleton count={4} />
        </div>
      </div>
    </div>
  );
}
