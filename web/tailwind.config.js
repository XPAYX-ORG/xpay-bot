/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00ffa3',
        secondary: '#03e1ff',
        background: '#0a0a0a',
        surface: '#111111',
      },
    },
  },
  plugins: [],
}