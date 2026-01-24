/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#0a0a0b',
        surface: '#111113',
        elevated: '#1a1a1d',
        accent: {
          primary: '#ff6b35',
          secondary: '#00d4aa',
          warning: '#ffd23f',
        },
        text: {
          primary: '#fafafa',
          secondary: '#888888',
        },
        border: {
          subtle: '#2a2a2d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['"Clash Display"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
