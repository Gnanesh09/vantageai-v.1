/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0f8a4f",
          hover: "#0a6b3c",
        },
        delivery: "#ff6b00",
        background: "#f4f4f4",
        surface: "#ffffff",
        text: "#1a1a1a",
        muted: "#6b7280",
        error: "#ef4444",
        success: "#22c55e",
      },
      fontFamily: {
        sans: ["Satoshi", "Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 8px 24px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
