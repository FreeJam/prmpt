import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * PRMPT собирается с base='/prmpt/', потому что прод-адрес — freejam.online/prmpt/.
 * В dev-режиме ассеты берутся с того же префикса — это позволяет тестировать
 * ровно тот путь, что и в проде.
 */
export default defineConfig({
  base: '/prmpt/',
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared')
    }
  },
  server: {
    port: 5140,
    fs: { allow: [path.resolve(__dirname, '..')] },
    proxy: {
      '/prmpt/api': { target: 'http://127.0.0.1:8030', changeOrigin: true },
      '/api': { target: 'http://127.0.0.1:8030', changeOrigin: true }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900
  }
});
