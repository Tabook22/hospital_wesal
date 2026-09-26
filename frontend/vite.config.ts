import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/wesal/',
  server: {
    port: 9901,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:9900',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
