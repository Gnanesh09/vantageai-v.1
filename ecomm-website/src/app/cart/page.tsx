"use client";

import { useCartStore } from "@/store/useCartStore";
import Link from "next/link";
import { Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import Image from "next/image";

export default function CartPage() {
  const { items, updateQuantity, removeItem, getCartTotal } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-gray-300" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Link href="/" className="bg-brand hover:bg-brand-dark text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">Shopping Cart</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            {items.map(item => (
              <div key={item.id} className="flex flex-col sm:flex-row items-center gap-6 py-6 border-b border-gray-100 last:border-0 last:pb-0 first:pt-0">
                <div className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden shadow-sm flex items-center justify-center p-2 flex-shrink-0">
                  <Image src={item.images[0]} alt={item.name} width={80} height={80} className="object-contain mix-blend-multiply" />
                </div>
                
                <div className="flex-grow flex flex-col items-center sm:items-start text-center sm:text-left">
                  <Link href={`/product/${item.id}`} className="text-lg font-bold text-gray-900 hover:text-brand transition-colors line-clamp-1 mb-1">
                    {item.name}
                  </Link>
                  <span className="text-sm font-semibold text-gray-500 mb-4">{item.category}</span>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold transition-colors">-</button>
                      <span className="px-4 py-1 font-bold text-sm min-w-[40px] text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold transition-colors">+</button>
                    </div>
                    
                    <button onClick={() => removeItem(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col items-center sm:items-end flex-shrink-0">
                  <span className="text-xl font-black text-brand-dark mb-1">₹{(item.price * item.quantity).toFixed(2)}</span>
                  {item.quantity > 1 && (
                    <span className="text-xs text-gray-400 font-medium">₹{item.price.toFixed(2)} each</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <div className="bg-gray-50 rounded-3xl p-6 sticky top-28">
            <h2 className="text-xl font-black text-gray-900 mb-6">Order Summary</h2>
            
            <div className="flex flex-col gap-4 mb-6 text-sm font-semibold text-gray-600 border-b border-gray-200 pb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-gray-900">₹{getCartTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax</span>
                <span className="text-gray-900">₹{(getCartTotal() * 0.08).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-600 uppercase font-black tracking-wider">Free</span>
              </div>
            </div>
            
            <div className="flex justify-between items-end mb-8">
              <span className="text-base font-bold text-gray-900">Total</span>
              <span className="text-3xl font-black text-brand-dark">₹{(getCartTotal() * 1.08).toFixed(2)}</span>
            </div>
            
            <Link href="/checkout" className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 group">
              Proceed to Checkout
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
