/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Urbanist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        urbanist: ['Urbanist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        black: '#080B08',
        slate: {
          950: '#080B08',
        },
        nodus: {
          bg: '#F3F4F7',
          card: '#FFFFFF',
          dark: '#080B08',
          subtle: '#64748B',
          border: '#E2E8F0',
          accent: '#FEF08A',
          accentLight: '#FDE047',
          neon: '#8FFE01',
          gold: '#E5A93C',
          crimson: '#E50914',
        }
      }
    },
  },
  plugins: [],
}
