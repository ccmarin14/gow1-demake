import { defineConfig } from 'vite';

export default defineConfig({
  base: '/gow1-demake/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    // Permite el dominio de prueba de Cloudflare Tunnel (URLs aleatorias *.trycloudflare.com)
    allowedHosts: ['.trycloudflare.com'],
  },
});
