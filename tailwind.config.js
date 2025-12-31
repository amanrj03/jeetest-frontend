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
        'heading': ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'body': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
        'outfit': ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'system': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
        'nta': ['Arial', 'sans-serif'],
      },
      letterSpacing: {
        'tighter': '-0.025em',
        'tight': '-0.015em',
        'wide': '0.05em',
      }
    },
  },
  plugins: [],
}