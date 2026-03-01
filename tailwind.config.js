/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f6f7f6',
          100: '#e3e7e3',
          200: '#c7d0c7',
          300: '#9eb09e',
          400: '#728a72',
          500: '#526d52',
          600: '#3d523d',
          700: '#324132',
          800: '#293429',
          900: '#222b22',
          950: '#121712',
        },
      },
    },
  },
  plugins: [],
}
