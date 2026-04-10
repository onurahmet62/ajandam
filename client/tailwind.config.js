/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'pastel-pink': '#F8C8DC',
        'pastel-blue': '#A7C7E7',
        'pastel-green': '#B5EAD7',
        'pastel-lavender': '#C3B1E1',
        'pastel-peach': '#FFDAB9',
        'pastel-mint': '#B2F2BB',
        'pastel-yellow': '#FFF3B0',
        'pastel-coral': '#FFB5A7',
      },
    },
  },
  plugins: [],
}
