"use client";

import { ShoppingCart, Zap } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";

export default function Navbar() {
  const router = useRouter();
  const { items } = useCart();
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);

  const count = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white ${scrolled ? "shadow-md" : "shadow-sm"}`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary inline-flex items-center justify-center">
              <Zap className="w-4 h-4 text-white fill-white" />
            </span>
            <span className="font-black text-lg tracking-tight text-text">SwiftCart</span>
          </Link>

          <form onSubmit={onSubmit} className="hidden md:block flex-1 max-w-xl">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search groceries, brands, categories"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </form>

          <Link href="/cart" className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ShoppingCart className="w-5 h-5 text-text" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        </div>

        <form onSubmit={onSubmit} className="md:hidden mt-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search groceries"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </form>
      </div>
    </header>
  );
}
