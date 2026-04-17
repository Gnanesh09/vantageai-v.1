"use client";

import { useState } from "react";
import CartDrawer from "@/components/CartDrawer";

export default function CartPage() {
  const [open, setOpen] = useState(true);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black text-text mb-4">Cart</h1>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-primary text-white px-4 py-2 font-bold"
      >
        Open Cart Drawer
      </button>
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
