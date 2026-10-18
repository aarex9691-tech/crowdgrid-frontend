import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

// The browser talks only to Vite; Vite forwards /api and /uploads to the
// Express server. Same origin = no CORS issues, and with `npm run dev:phone`
// (HTTPS) a phone on the same Wi-Fi can open the camera scanner.
const API_TARGET = process.env.API_TARGET || 'http://localhost:5000'

export default defineConfig(({ mode }) => ({
  // `npm run dev:phone` uses --mode phone: HTTPS with a self-signed certificate
  plugins: [react(), ...(mode === 'phone' ? [basicSsl()] : [])],
  server: {
    host: true,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
      '/uploads': { target: API_TARGET, changeOrigin: true },
      // Live updates (WebSocket)
      '/socket.io': { target: API_TARGET, changeOrigin: true, ws: true },
    },
  },
  preview: {
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
      '/uploads': { target: API_TARGET, changeOrigin: true },
      '/socket.io': { target: API_TARGET, changeOrigin: true, ws: true },
    },
  },
}))
