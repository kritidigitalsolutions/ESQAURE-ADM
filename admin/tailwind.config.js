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
        black: '#0A0A0C',
        surface: {
          0: '#0A0A0C',
          1: '#121216',
          2: '#18181E',
          4: '#1E1E26',
          8: '#24242E',
          16: '#2A2A35',
          24: '#30303D',
        },
        slate: {
          950: '#0A0A0C',
        },
        nodus: {
          bg: '#F3F4F7',
          card: '#FFFFFF',
          dark: '#0A0A0C',
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
