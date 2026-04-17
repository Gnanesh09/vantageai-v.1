import { ProductCard } from "./ProductCard";
import { ChevronRight } from "lucide-react";
import { Product } from "@/lib/api/products";

interface ProductSectionProps {
  title: string;
  products: Product[];
}

export default function ProductSection({ title, products }: ProductSectionProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      <div className="flex items-center justify-between mb-8 group cursor-pointer border-b border-gray-100 pb-4">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight group-hover:bg-gradient-to-r group-hover:from-brand-dark group-hover:to-brand group-hover:bg-clip-text group-hover:text-transparent transition-all">
          {title}
        </h2>
        <button className="flex items-center text-brand font-bold text-sm tracking-wide hover:text-brand-dark bg-brand-light/20 px-4 py-2 rounded-full transition-all group-hover:pr-3">
          Explore All 
          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

    </div>
  );
}
