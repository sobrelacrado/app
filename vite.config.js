import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Dos páginas: el panel de Alberto (index.html, instalable) y la página del jugador (scan.html, sin instalar).
export default defineConfig({
  define: { __BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // avisa de la versión nueva y deja decidir cuándo actualizar
      injectRegister: false, // el registro se hace a mano desde el panel (src/lib/pwa.js)
      manifest: false, // el manifiesto está en public/ y solo se enlaza desde index.html (no desde scan.html)
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,webmanifest}'],
        // La página del jugador y las rutas de acceso de Firebase nunca pasan por el service worker.
        globIgnores: ['scan.html', 'assets/scan-*'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/s\//, /^\/__\//],
        importScripts: ['sw-extra.js'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: { main: 'index.html', scan: 'scan.html' },
    },
  },
})
