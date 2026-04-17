"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, total, updateQty, removeItem } = useCart();
  const [notice, setNotice] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black">Your Cart</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {items.length === 0 && <p className="text-sm text-muted">Your cart is empty.</p>}
          {items.map((item) => (
            <div key={item.product.id} className="border border-gray-100 rounded-xl p-3 flex gap-3">
              <img
                src={item.product.image}
                alt={item.product.name}
                className="w-16 h-16 rounded-lg object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.src =
                    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400";
                }}
              />
              <div className="flex-1">
                <p className="text-sm font-bold line-clamp-2">{item.product.name}</p>
                <p className="text-xs text-muted">₹{item.product.price}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button className="px-2 py-0.5 rounded bg-gray-100" onClick={() => updateQty(item.product.id, item.qty - 1)}>
                    -
                  </button>
                  <span className="text-sm font-bold">{item.qty}</span>
                  <button className="px-2 py-0.5 rounded bg-gray-100" onClick={() => updateQty(item.product.id, item.qty + 1)}>
                    +
                  </button>
                  <button
                    className="text-xs text-error ml-auto"
                    onClick={() => removeItem(item.product.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted">Subtotal</span>
            <span className="text-lg font-black">₹{total.toFixed(2)}</span>
          </div>
          <button
            onClick={() => setNotice("Checkout coming soon!")}
            className="w-full rounded-xl bg-primary text-white py-2.5 font-bold hover:bg-primary-hover"
          >
            Proceed to Checkout
          </button>
          {notice && <p className="text-xs text-success mt-2 font-semibold">{notice}</p>}
        </div>
      </aside>
    </div>
  );
}
