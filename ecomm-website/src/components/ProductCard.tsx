"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Heart } from "lucide-react";
import { Product } from "@/lib/api/products";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";

// Safe string formatting to avoid SSR mismatch 
const formatInr = (amount: number, isPrice = true) => {
  if (!isPrice) return amount.toString(); // simplified for review counts
  const [int, dec] = amount.toFixed(2).split('.');
  const lastThree = int.substring(int.length - 3);
  const otherNumbers = int.substring(0, int.length - 3);
  const val = otherNumbers !== '' ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + ',' + lastThree : lastThree;
  return val + '.' + dec;
};

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore(state => state.addItem);
  const { toggleItem, isInWishlist } = useWishlistStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isWished = mounted ? isInWishlist(product.id) : false;

  return (
    <div className="bg-white border text-left border-gray-50 rounded-3xl p-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03),0_10px_20px_-2px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full relative overflow-hidden backdrop-blur-xl">
      
      {/* Dynamic Background Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-light/0 to-brand-light/0 group-hover:from-brand-light/20 group-hover:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0 rounded-3xl pointer-events-none"></div>

      {/* Wishlist Toggle */}
      <button 
        onClick={(e) => { e.preventDefault(); toggleItem(product.id); }}
        className="absolute top-3 right-3 z-20 p-2.5 bg-white/60 hover:bg-white backdrop-blur-md rounded-full shadow-sm hover:scale-110 transition-all border border-gray-100/50"
      >
        <Heart className={`w-4 h-4 ${isWished ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`} />
      </button>

      <Link href={`/product/${product.id}`} className="flex flex-col flex-grow z-10 relative">
        {/* Responsive Image Container */}
        <div className="relative bg-gray-50/50 rounded-2xl aspect-square mb-5 overflow-hidden flex items-center justify-center">
          <Image 
            src={product.images[0]} 
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
          />
        </div>

        {/* Categories & Title */}
        <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-brand mb-1">
          {product.category}
        </span>
        <h3 className="text-xs md:text-sm font-bold text-gray-800 leading-snug line-clamp-2 mb-2 group-hover:text-brand-dark transition-colors">
          {product.name}
        </h3>
        
        {/* Granular Ratings */}
        <div className="flex items-center gap-1.5 mb-3 mt-auto">
          <div className="flex bg-yellow-50 rounded-md px-1.5 py-0.5 items-center gap-0.5">
            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            <span className="text-[11px] font-extrabold text-yellow-700">{product.rating}</span>
          </div>
          <span className="text-[10px] font-semibold text-gray-400">({formatInr(product.reviewCount, false)})</span>
        </div>
      </Link>
      
      {/* Pricing & Add To Cart */}
      <div className="mt-auto pt-3 flex items-center justify-between z-10 relative">
        <div className="flex flex-col flex-grow">
          {product.originalPrice > product.price && (
            <span className="text-[10px] text-gray-400 line-through font-semibold mb-0.5">₹{product.originalPrice.toFixed(2)}</span>
          )}
          <span className="text-[15px] md:text-base font-extrabold text-gray-900 tracking-tight leading-none">₹{formatInr(product.price, true)}</span>
        </div>
        
        <button 
          onClick={() => addItem(product)}
          className="flex items-center justify-center bg-brand/10 hover:bg-brand text-brand hover:text-white font-bold text-[10px] md:text-xs px-4 py-1.5 md:px-5 md:py-2 rounded-full shadow-sm transition-all duration-300 active:scale-95 flex-shrink-0"
        >
          <span>Add</span>
        </button>
      </div>

    </div>
  );
}
