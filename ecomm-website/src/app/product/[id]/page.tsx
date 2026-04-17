import { Api } from "@/lib/api/products";
import { Star, ShieldCheck, Truck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ClientAddToCartBtn from "./ClientAddToCartBtn";
import Reviews from "@/components/Reviews";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const product = await Api.getProductById(id);

  if (!product) {
    return (
      <div className="flex flex-col flex-grow items-center justify-center p-20">
        <h1 className="text-3xl font-bold">Product not found</h1>
        <Link href="/" className="mt-4 text-brand hover:underline">Return home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-brand mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Shopping
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div className="flex flex-col gap-4">
          <div className="bg-gray-50 rounded-3xl aspect-square relative flex items-center justify-center p-8 overflow-hidden shadow-sm">
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-4">
              {product.images.map((img, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl w-24 h-24 p-2 cursor-pointer border-2 hover:border-brand transition-colors">
                  <img src={img} className="w-full h-full object-contain mix-blend-multiply" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <span className="text-sm font-bold text-brand uppercase tracking-wider mb-2">{product.category}</span>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-4">{product.name}</h1>
          
          {/* Ratings */}
          <div className="flex items-center gap-2 mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
              ))}
            </div>
            <span className="text-sm font-bold text-gray-800">{product.rating}</span>
            <span className="text-sm text-gray-400">({product.reviewCount} Reviews)</span>
          </div>

          {/* Pricing */}
          <div className="mb-8">
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-black text-brand-dark">₹{product.price.toFixed(2)}</span>
              {product.originalPrice > product.price && (
                <span className="text-lg text-gray-400 line-through mb-1 font-medium">₹{product.originalPrice.toFixed(2)}</span>
              )}
            </div>
            <p className="text-sm text-gray-500 font-medium">{product.weight}</p>
          </div>

          <p className="text-gray-600 text-base leading-relaxed mb-8">{product.description}</p>

          {/* Action Area */}
          <div className="bg-gray-50 p-6 rounded-2xl mb-8">
            <div className={`text-sm font-bold flex items-center gap-2 mb-4 ${product.inStock ? 'text-green-600' : 'text-red-500'}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${product.inStock ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              {product.inStock ? 'In Stock & Ready to Ship' : 'Currently Out of Stock'}
            </div>
            
            <ClientAddToCartBtn product={product} />

            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                <Truck className="w-4 h-4 text-gray-400" />
                Delivery: <span className="font-bold text-gray-900">{product.deliveryTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                <ShieldCheck className="w-4 h-4 text-gray-400" />
                SwiftCart Authenticity Guarantee
              </div>
            </div>
          </div>
          
          {/* Reviews Component Injection */}
          <Reviews productId={product.id} />

        </div>
      </div>
    </div>
  );
}
