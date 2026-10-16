import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Dos páginas: el panel de Alberto (index.html) y la página del jugador (scan.html).
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: { main: 'index.html', scan: 'scan.html' },
    },
  },
})
