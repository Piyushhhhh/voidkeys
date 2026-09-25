import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Respect an externally assigned port (e.g. preview harnesses); 5173 default.
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 5173,
    allowedHosts: ['unreclaimable-leonarda-unpartisan.ngrok-free.dev'],
  },
  // Lightning CSS (vite 8 default) minifies filter lists without spaces
  // ("url(#x)blur(12px)") which chrome rejects — every backdrop-filter
  // silently dropped in prod. the css is ~9 kB; ship it unminified.
  build: { cssMinify: false },
})
