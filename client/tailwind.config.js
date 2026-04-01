/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#120d2a',
        surface: '#1e1640',
        card: '#251c4a',
        border: '#352a5e',
        purple: {
          400: '#a855f7',
          500: '#9333ea',
          600: '#7B2FBE',
          700: '#6d28d9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
