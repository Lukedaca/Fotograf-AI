import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const detectApiKeys = () => ({
  name: 'detect-api-keys',
  transform(code: string, id: string) {
    if (id.includes('node_modules')) return null;
    if (code.includes('AIzaSy')) {
      // eslint-disable-next-line no-console
      console.error('⚠️ WARNING: Possible hardcoded API key detected in', id);
    }
    return null;
  },
});

export default defineConfig(({ mode }) => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), detectApiKeys()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        sourcemap: false,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              motion: ['framer-motion'],
            },
          },
        },
      },
    };
});
