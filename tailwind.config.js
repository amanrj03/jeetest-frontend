/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nta-blue': '#1e40af',
        'nta-green': '#16a34a',
        'nta-yellow': '#eab308',
        'nta-red': '#dc2626',
      },
      fontFamily: {
        'nta': ['Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}