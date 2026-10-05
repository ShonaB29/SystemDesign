/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-bg': '#070B14',
        'brand-surface': '#111827',
        'brand-surface-2': '#151D2E',
        'brand-border': 'rgba(255,255,255,0.1)',
        'brand-primary': '#0ea5e9',
        'brand-success': '#10b981',
        'brand-warning': '#f59e0b',
        'brand-danger': '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
