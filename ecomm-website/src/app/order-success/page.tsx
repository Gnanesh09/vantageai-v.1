"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, PackageSearch } from "lucide-react";

export default function OrderSuccessPage() {
  const [orderId, setOrderId] = useState<string>("Loading...");

  useEffect(() => {
    setOrderId("SWFT-" + Math.floor(Math.random() * 100000000));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 flex flex-col items-center text-center">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>
      
      <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Order Confirmed!</h1>
      <p className="text-lg text-gray-600 mb-2">Thank you for your purchase. Your order has been placed successfully.</p>
      
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 w-full my-8">
        <span className="text-sm font-semibold text-gray-500 block mb-1">Order Number</span>
        <span className="text-xl font-bold font-mono text-gray-800 tracking-wider">{orderId}</span>
      </div>

      <div className="flex gap-4 w-full">
        <Link href="/" className="flex-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-bold py-4 rounded-xl transition-all">
          Continue Shopping
        </Link>
        <button className="flex-1 bg-brand hover:bg-brand-dark text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all">
          <PackageSearch className="w-5 h-5" />
          Track Order
        </button>
      </div>
    </div>
  );
}
