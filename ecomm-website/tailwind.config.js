/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#d1fae5',    /* emerald-100 */
          DEFAULT: '#10b981',  /* emerald-500 */
          dark: '#047857',     /* emerald-700 */
        },
        background: '#f8f9fa',
        foreground: '#1f2937',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
