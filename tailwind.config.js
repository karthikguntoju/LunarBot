/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lunar: {
          950: '#060709',
          900: '#0d0f14',
          850: '#12151c',
          800: '#181c24',
          700: '#232936',
          600: '#343c4e',
          500: '#4e5a74',
          400: '#7b8ba5',
          300: '#a7b4c9',
          200: '#d0d8e4',
          100: '#f0f3f8',
        },
        telemetry: {
          cyan: '#00f0ff',
          amber: '#ffb703',
          red: '#ff3366',
          emerald: '#00f59b',
          blue: '#3a86ff',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Menlo', 'Monaco', 'Consolas', '"Courier New"', 'monospace'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
