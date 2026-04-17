"use client";
import { useState, useEffect } from "react";
import { Search, ShoppingCart, User, Heart } from "lucide-react";
import Link from "next/link";
import { Api, Product } from "@/lib/api/products";
import { useCartStore } from "@/store/useCartStore";

export default function Header() {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const cartCount = useCartStore(state => state.getItemCount());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (search.length > 1) {
      Api.searchProducts(search).then(setSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [search]);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-6">
        
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <h1 className="text-3xl font-black text-brand tracking-tight">SWIFTCART</h1>
        </Link>

        {/* Search Bar with Suggestions */}
        <div className="flex-grow max-w-2xl relative hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand focus:border-brand sm:text-sm transition-colors duration-200"
            placeholder="Search for products, categories..."
          />
          
          {/* Autocomplete Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
              {suggestions.map(item => (
                <Link href={`/product/${item.id}`} key={item.id} onClick={() => setSearch("")} className="flex items-center gap-4 p-3 hover:bg-gray-50 transition-colors border-b last:border-0 border-gray-50">
                  <img src={item.images[0]} alt={item.name} className="w-10 h-10 object-cover rounded-md" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-800">{item.name}</span>
                    <span className="text-xs text-gray-500">{item.category}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-6 flex-shrink-0">
          <button className="hidden sm:flex flex-col items-center justify-center text-gray-700 hover:text-brand transition-colors">
            <User className="h-6 w-6" />
            <span className="text-[11px] font-bold mt-1">Sign In</span>
          </button>
          
          <Link href="/cart" className="flex flex-col items-center justify-center text-gray-700 hover:text-brand transition-colors relative">
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm z-10 transition-transform scale-in">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold mt-1 shadow-sm">Cart</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
