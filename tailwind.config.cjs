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
                                      // Transparent palette for glassmorphism
                                      glass: {
                                        100: 'rgba(255, 255, 255, 0.1)',
                                        200: 'rgba(255, 255, 255, 0.2)',
                                        300: 'rgba(255, 255, 255, 0.3)',
                                      },
                                      dark: {
                                        900: '#0f172a',
                                        800: '#1e293b',
                                      },
                                      accent: {
                                        DEFAULT: '#8b5cf6', // Violet
                                        hover: '#7c3aed',
                                        secondary: '#ec4899', // Pink
                                      },
                                      white: '#FFFFFF',
                                      slate: {
                                        50: '#f8fafc',
                                        100: '#f1f5f9',
                                        200: '#e2e8f0',
                                        300: '#cbd5e1',
                                        400: '#94a3b8',
                                        500: '#64748b',
                                        600: '#475569',
                                        700: '#334155',
                                        800: '#1e293b',
                                        900: '#0f172a',
                                        950: '#020617',
                                      },
                                      success: '#10b981',
                                      warning: '#f59e0b',
                                      error: '#ef4444',
                                      text: {
                                        primary: '#ffffff',
                                        secondary: '#94a3b8',
                                      },
                                      border: {
                                        subtle: 'rgba(255, 255, 255, 0.1)',
                                      },
                                    },
                                    fontFamily: {
                                      sans: ['"Inter"', 'sans-serif'],
                                    },
                                  },
                                },  plugins: [],
};
