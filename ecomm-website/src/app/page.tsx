import CategoryStrip from "@/components/CategoryStrip";
import ProductGrid from "@/components/ProductGrid";
import PromoBanner from "@/components/PromoBanner";
import { getProductRatings } from "@/lib/api";
import { fetchSwiftCartProducts } from "@/lib/data";
import { SwiftCartProduct } from "@/types";

const BRAND_ID = process.env.NEXT_PUBLIC_BRAND_ID || "";

function withRatings(
  products: SwiftCartProduct[],
  ratings: Record<string, { rating: number; reviewCount: number }>
): SwiftCartProduct[] {
  return products.map((product) => {
    const stat = ratings[product.id];
    if (!stat) return product;
    return { ...product, rating: stat.rating, reviewCount: stat.reviewCount };
  });
}

export default async function HomePage() {
  const [productsRaw, ratings] = await Promise.all([
    fetchSwiftCartProducts(BRAND_ID),
    getProductRatings(),
  ]);

  const products = withRatings(productsRaw, ratings);

  const trending = [...products].sort((a, b) => b.reviewCount - a.reviewCount);
  const snacks = products.filter((p) => p.category === "Snacks & Munchies");
  const dairy = products.filter((p) => p.category === "Dairy & Breakfast");
  const drinks = products.filter((p) => p.category === "Cold Drinks & Juices");
  const instant = products.filter((p) => p.category === "Instant & Frozen Food");
  const personalCare = products.filter((p) => p.category === "Personal Care");
  const chocolates = products.filter((p) => p.category === "Chocolates & Sweets");

  if (products.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  return (
    <div className="space-y-3">
      <PromoBanner />
      <CategoryStrip />

      {trending.length > 0 && <ProductGrid title="Trending Now 🔥" products={trending} />}
      {snacks.length > 0 && <ProductGrid title="Snacks & Munchies 🍿" products={snacks} />}
      {dairy.length > 0 && <ProductGrid title="Dairy & Breakfast 🥛" products={dairy} />}
      {drinks.length > 0 && <ProductGrid title="Cold Drinks & Juices 🧃" products={drinks} />}
      {instant.length > 0 && <ProductGrid title="Instant & Frozen 🍜" products={instant} />}
      {personalCare.length > 0 && <ProductGrid title="Personal Care 🧴" products={personalCare} />}
      {chocolates.length > 0 && <ProductGrid title="Chocolates & Sweets 🍫" products={chocolates} />}

      {products.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-sm text-muted">No products available right now.</p>
        </div>
      )}
    </div>
  );
}
