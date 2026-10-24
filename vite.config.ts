/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true, // Expose to local network (Wi-Fi) for mobile testing
    port: 5173,
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
