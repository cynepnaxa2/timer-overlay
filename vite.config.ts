import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron([
      {
        // Main-process entry file of the Electron App.
        entry: 'main.js',
      },
      {
        entry: 'preload/overlayPreload.js',
        onstart(options) {
          // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete, 
          // instead of restarting the entire Electron App.
          options.reload()
        },
      },
      {
        entry: 'preload/todoPreload.js',
        onstart(options) {
          options.reload()
        },
      },
      {
        entry: 'preload/settingsPreload.js',
        onstart(options) {
          options.reload()
        },
      }
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        todo: resolve(__dirname, 'todo.html'),
        settings: resolve(__dirname, 'settings.html'),
      },
    },
  },
})
