import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { CartProvider } from "@/lib/cart";

export const metadata: Metadata = {
  title: "SwiftCart",
  description: "10-minute grocery delivery",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Navbar />
          <main className="pt-24 md:pt-20 pb-12">{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}
