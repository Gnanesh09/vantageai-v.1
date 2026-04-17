import CategoryStrip from "@/components/CategoryStrip";
import PromoBanners from "@/components/PromoBanners";
import ProductSection from "@/components/ProductSection";
import { Api } from "@/lib/api/products";

export default async function Home() {
  // Fetch from Mock API (will take 600ms simulating latency to show skeleton)
  const trendingProducts = await Api.getTrendingProducts();
  const allProducts = await Api.getProducts();
  
  // Sort reverse to fake entirely different categories
  const snacks = allProducts.filter(p => p.category === "Snacks & Munchies");

  return (
    <div className="min-h-screen bg-background pb-20">
      <CategoryStrip />
      
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-in-out">
        <PromoBanners />
        <ProductSection title="Trending Ranked 🔥" products={trendingProducts} />
        <ProductSection title="Snacks & Munchies 🍿" products={snacks} />
      </div>
      
    </div>
  );
}
