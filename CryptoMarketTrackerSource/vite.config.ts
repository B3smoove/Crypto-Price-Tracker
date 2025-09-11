import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/v3': {
        target: 'https://api.coingecko.com',
        changeOrigin: true,
        secure: true,
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
