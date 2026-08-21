/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '400px',
      },
      fontFamily: {
        // 'cyber' is intentionally not listed here — it's already a working
        // hand-written utility in index.css; adding it here would just
        // generate a redundant, shadowed duplicate.
        rajdhani: ['Rajdhani', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
