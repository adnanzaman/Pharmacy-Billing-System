import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react()
  ],

  // Important for Electron production build
  // Allows assets to load using relative paths:
  // ./assets/...
  base: './',

  server: {
    host: 'localhost',
    port: 5173
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});