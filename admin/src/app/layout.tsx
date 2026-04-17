import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VantageAI War Room",
  description: "SwiftCart internal intelligence console",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

