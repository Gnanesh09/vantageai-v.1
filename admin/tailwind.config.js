/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        accent: "#4f98a3",
        bg: "#0f0f0e",
        surface: "#1a1918",
        "surface-2": "#222120",
        border: "rgba(255,255,255,0.08)",
        text: "#e8e6e3",
        muted: "#8a8885",
        success: "#6daa45",
        error: "#dd6974",
        warning: "#fdab43"
      }
    }
  },
  plugins: []
};
