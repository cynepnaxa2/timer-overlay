import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: '/', // Changed from ./ to / for dev stability
  build: {
    outDir: 'dist-renderer',
    rollupOptions: {
      input: {
        todo: path.resolve(__dirname, 'todo.html'),
        settings: path.resolve(__dirname, 'settings.html'),
        overlay: path.resolve(__dirname, 'index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      overlay: true,
    },
  },
});
