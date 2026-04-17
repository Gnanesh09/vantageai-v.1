"use client";

import { useMemo } from "react";
import { useCart } from "@/lib/cart";
import { SwiftCartProduct } from "@/types";

export default function ProductActions({ product }: { product: SwiftCartProduct }) {
  const { items, addItem, updateQty } = useCart();

  const qty = useMemo(() => items.find((i) => i.product.id === product.id)?.qty || 0, [items, product.id]);

  return (
    <div className="space-y-3">
      {qty === 0 ? (
        <button
          onClick={() => addItem(product)}
          className="w-full rounded-xl bg-primary text-white py-3 font-bold text-sm hover:bg-primary-hover"
        >
          + Add to Cart
        </button>
      ) : (
        <div className="w-full flex items-center justify-center gap-3 rounded-xl bg-primary text-white py-2">
          <button onClick={() => updateQty(product.id, qty - 1)} className="w-8 h-8 rounded-full bg-white/20">-</button>
          <span className="font-bold">{qty}</span>
          <button onClick={() => updateQty(product.id, qty + 1)} className="w-8 h-8 rounded-full bg-white/20">+</button>
        </div>
      )}
    </div>
  );
}
