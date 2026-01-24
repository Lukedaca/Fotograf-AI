/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './contexts/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#000000',
        surface: '#0d0d0d',
        elevated: '#1a1a1a',
        accent: {
          DEFAULT: '#FF0040',
          hover: '#FF3366',
          muted: '#990033',
        },
        white: '#FFFFFF',
        gray: {
          100: '#F5F5F5',
          400: '#9CA3AF',
          600: '#4B5563',
          800: '#1F1F1F',
        },
        success: '#00FF88',
        warning: '#FFCC00',
        error: '#FF0040',
        text: {
          primary: '#FFFFFF',
          secondary: '#9CA3AF',
        },
        border: {
          subtle: '#1F1F1F',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        display: ['"Space Grotesk"', '"IBM Plex Mono"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
