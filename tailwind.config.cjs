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
        void: '#050505',      // Softer black
        surface: '#0f0f0f',   // Rich dark grey
        elevated: '#1a1a1a',  // Card bg
        accent: {
          DEFAULT: '#6366f1', // Indigo 500 (SaaS Primary)
          hover: '#818cf8',   // Indigo 400
          muted: '#4338ca',   // Indigo 700
        },
        white: '#FAFAFA',
        gray: {
          100: '#F3F4F6',
          400: '#9CA3AF',
          600: '#4B5563',
          800: '#1F2937',
        },
        success: '#10B981',   // Emerald
        warning: '#F59E0B',   // Amber
        error: '#EF4444',     // Red
        text: {
          primary: '#F9FAFB',
          secondary: '#9CA3AF',
        },
        border: {
          subtle: '#27272a', // Gray 800
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'], // Modern tech mono
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(99, 102, 241, 0.3)',
      }
    },
  },
  plugins: [],
};