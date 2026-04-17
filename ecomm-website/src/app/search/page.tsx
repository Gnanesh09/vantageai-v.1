import ProductGrid from "@/components/ProductGrid";
import { getProductRatings } from "@/lib/api";
import { fetchSwiftCartProducts } from "@/lib/data";
import { SwiftCartProduct } from "@/types";

const BRAND_ID = process.env.NEXT_PUBLIC_BRAND_ID || "";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const [products, ratings] = await Promise.all([
    fetchSwiftCartProducts(BRAND_ID),
    getProductRatings(),
  ]);

  const merged: SwiftCartProduct[] = products.map((p) => ({
    ...p,
    rating: ratings[p.id]?.rating || 0,
    reviewCount: ratings[p.id]?.reviewCount || 0,
  }));

  const filtered = query
    ? merged.filter(
        (p) => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)
      )
    : merged;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black text-text mb-4">Search</h1>
      {filtered.length > 0 ? (
        <ProductGrid title={`Results for "${q}"`} products={filtered} />
      ) : (
        <p className="text-sm text-muted">No products found for &apos;{q}&apos;</p>
      )}
    </div>
  );
}
