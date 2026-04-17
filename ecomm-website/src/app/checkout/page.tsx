"use client";

import { useCartStore } from "@/store/useCartStore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, CreditCard, Lock } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { getCartTotal, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const total = (getCartTotal() * 1.08).toFixed(2);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      clearCart();
      router.push("/order-success");
    }, 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-gray-900 mb-8 text-center tracking-tight">Secure Checkout</h1>
      
      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-md">
        <form onSubmit={handleCheckout} className="flex flex-col gap-6">
          
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold">1</div>
            <h2 className="text-xl font-bold text-gray-800">Shipping Information</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <input required type="text" placeholder="First Name" className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none" />
            <input required type="text" placeholder="Last Name" className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none" />
            <input required type="text" placeholder="Address" className="col-span-2 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none" />
          </div>

          <hr className="my-4 border-gray-100" />

          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold">2</div>
            <h2 className="text-xl font-bold text-gray-800">Payment Details</h2>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-600 flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Mock Credit Card
              </span>
              <Lock className="w-4 h-4 text-green-600" />
            </div>
            <input required type="text" placeholder="Card Number (Any)" defaultValue="4242 4242 4242 4242" className="p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand outline-none font-mono text-sm" />
            <div className="grid grid-cols-2 gap-4">
              <input required type="text" placeholder="MM/YY" defaultValue="12/26" className="p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand outline-none font-mono text-sm" />
              <input required type="text" placeholder="CVC" defaultValue="123" className="p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand outline-none font-mono text-sm" />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
              <span className="font-bold text-gray-700">Total to Pay</span>
              <span className="text-2xl font-black text-brand-dark">₹{total}</span>
            </div>
            <button 
              type="submit" 
              disabled={isProcessing}
              className={`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all ${
                isProcessing ? 'bg-brand/70 cursor-not-allowed text-white' : 'bg-brand hover:bg-brand-dark text-white hover:shadow-lg'
              }`}
            >
              {isProcessing ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Pay ₹{total} Securely <Lock className="w-4 h-4" /></>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
