import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'x-black':   '#000000',
        'x-bg':      '#000000',
        'x-surface': '#16181c',
        'x-border':  '#2f3336',
        'x-gray':    '#71767b',
        'x-light':   '#e7e9ea',
        'x-blue':    '#1d9bf0',
        'x-blue-hover': '#1a8cd8',
        'x-green':   '#00ba7c',
        'x-pink':    '#f91880',
        'x-orange':  '#ff7008',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease',
        'slide-up':   'slideUp 0.25s ease',
        'pop':        'pop 0.15s ease',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pop:     { '0%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.3)' }, '100%': { transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}

export default config
