/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Warm Paper Palette
        alabaster: '#FAF8F5',
        'stone-surface': '#F3EFEA',
        'stone-border': '#E6E1DA',
        'charcoal': '#1C1B18',
        'warm-grey': '#78736A',
        'warm-light': '#A8A298',
        'terracotta': {
          DEFAULT: '#C85A32',
          hover: '#B54F2B',
          light: '#F8ECE7',
          dark: '#9E3E1C',
        },
        'sage': {
          DEFAULT: '#4A6B53',
          hover: '#3F5B47',
          light: '#EDF3EE',
          dark: '#314737',
        },
        // Cast Iron Cooking Theme
        'cast-iron': {
          DEFAULT: '#141413',
          surface: '#1E1D1B',
          card: '#252421',
          border: '#33312C',
        },
        'cream': {
          DEFAULT: '#F5F2EB',
          muted: '#C7C2B6',
          dim: '#8C877D',
        },
        'amber-glow': {
          DEFAULT: '#E06B43',
          bright: '#F3835C',
          soft: '#FFB299',
        }
      },
      fontFamily: {
        serif: ['Newsreader', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'tactile': '0 1px 3px rgba(28, 27, 24, 0.05), 0 1px 2px rgba(28, 27, 24, 0.03)',
        'tactile-hover': '0 4px 12px rgba(28, 27, 24, 0.08), 0 2px 4px rgba(28, 27, 24, 0.04)',
        'dock': '0 -8px 24px rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
};
