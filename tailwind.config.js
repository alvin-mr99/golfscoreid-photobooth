/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      aspectRatio: {
        'portrait': '9 / 16',
      },
      screens: {
        'portrait': { 'raw': '(orientation: portrait)' },
      },
    },
  },
  plugins: [],
}
