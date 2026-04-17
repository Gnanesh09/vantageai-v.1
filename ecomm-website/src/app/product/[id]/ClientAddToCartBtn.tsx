"use client";

import { useCartStore } from "@/store/useCartStore";
import { Product } from "@/lib/api/products";
import { useWishlistStore } from "@/store/useWishlistStore";
import { Heart, ShoppingBag } from "lucide-react";

export default function ClientAddToCartBtn({ product }: { product: Product }) {
  const addItem = useCartStore(state => state.addItem);
  const { toggleItem, isInWishlist } = useWishlistStore();
  
  return (
    <div className="flex gap-4">
      <button 
        onClick={() => addItem(product)}
        disabled={!product.inStock}
        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-all ${
          product.inStock 
            ? 'bg-brand hover:bg-brand-dark text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5' 
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <ShoppingBag className="w-5 h-5" />
        Add to Cart
      </button>
      
      <button 
        onClick={() => toggleItem(product.id)}
        className="w-14 h-14 flex items-center justify-center bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-brand transition-colors group"
      >
        <Heart className={`w-6 h-6 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-brand'}`} />
      </button>
    </div>
  );
}
