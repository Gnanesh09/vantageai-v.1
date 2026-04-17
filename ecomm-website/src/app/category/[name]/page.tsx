import { Api } from "@/lib/api/products";
import ProductSection from "@/components/ProductSection";
import Link from "next/link";
import { ArrowLeft, PackageSearch } from "lucide-react";

export default async function CategoryPage({ params }: { params: { name: string } }) {
  const decodedName = decodeURIComponent(params.name);
  // Re-capitalize correctly for aesthetics if needed, but the search ignores case
  
  // Search the mock DB for products that belong to this category
  // Using the search function since it already filters intelligently
  const products = await Api.searchProducts(decodedName);

  return (
    <div className="min-h-screen bg-background pb-20 pt-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto px-4 mb-4">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-brand transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>
      </div>

      {products.length > 0 ? (
        <ProductSection title={`Explore ${decodedName}`} products={products} />
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <PackageSearch className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">No products found</h1>
          <p className="text-gray-500 mb-8 max-w-md">We couldn't find any products in the "{decodedName}" category yet. Check back soon!</p>
          <Link href="/" className="bg-brand hover:bg-brand-dark text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all hover:-translate-y-0.5">
            Browse All Categories
          </Link>
        </div>
      )}
    </div>
  );
}
