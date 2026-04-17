"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SwiftCartProduct } from "@/types";
import StarRating from "@/components/StarRating";
import { useCart } from "@/lib/cart";

export default function ProductCard({ product }: { product: SwiftCartProduct }) {
  const { items, addItem, updateQty } = useCart();
  const [imgError, setImgError] = useState(false);

  const item = useMemo(() => items.find((i) => i.product.id === product.id), [items, product.id]);
  const qty = item?.qty || 0;

  const discount =
    product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  return (
    <article className="bg-surface rounded-2xl border border-gray-100 p-3 shadow-sm hover:shadow-card transition-all">
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative mb-3">
          <span className="absolute top-2 left-2 z-10 text-[10px] font-bold bg-delivery text-white px-2 py-1 rounded-full">
            ⚡ {product.deliveryTime}
          </span>
          {discount > 0 && (
            <span className="absolute top-2 right-2 z-10 text-[10px] font-bold bg-red-500 text-white px-2 py-1 rounded-full">
              {discount}% OFF
            </span>
          )}
          {imgError ? (
            <div className="aspect-square rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-400">
              Image unavailable
            </div>
          ) : (
            <img
              src={product.image}
              alt={product.name}
              onError={() => setImgError(true)}
              className="aspect-square w-full object-cover rounded-xl"
            />
          )}
        </div>

        <h3 className="text-sm font-bold text-text line-clamp-2 min-h-10">{product.name}</h3>
        <p className="text-xs text-muted mt-0.5">{product.weight}</p>

        {product.reviewCount > 0 ? (
          <div className="mt-2">
            <StarRating rating={product.rating} count={product.reviewCount} />
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted">New</p>
        )}
      </Link>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-base font-black text-text">₹{product.price}</p>
          {product.originalPrice > product.price && (
            <p className="text-xs text-muted line-through">₹{product.originalPrice}</p>
          )}
        </div>

        {qty === 0 ? (
          <button
            onClick={() => addItem(product)}
            className="h-9 w-9 rounded-full bg-primary text-white font-black hover:bg-primary-hover"
          >
            +
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-primary text-white rounded-full px-2 py-1">
            <button
              onClick={() => updateQty(product.id, qty - 1)}
              className="h-6 w-6 rounded-full bg-white/20"
            >
              -
            </button>
            <span className="text-sm font-bold w-4 text-center">{qty}</span>
            <button
              onClick={() => updateQty(product.id, qty + 1)}
              className="h-6 w-6 rounded-full bg-white/20"
            >
              +
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
