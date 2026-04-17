import ProductCard from "@/components/ProductCard";
import { SwiftCartProduct } from "@/types";

export default function ProductGrid({ title, products }: { title: string; products: SwiftCartProduct[] }) {
  return (
    <section className="max-w-7xl mx-auto px-4 py-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-black text-text">{title}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
