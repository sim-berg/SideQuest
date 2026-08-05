import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `npm run dev` talks to the backend the same way the nginx build does:
// same-origin /api and /socket.io, proxied to the local Nest server. Override
// the target with BACKEND_URL when the backend runs elsewhere.
const backend = process.env.BACKEND_URL || 'http://localhost:3000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target: backend, changeOrigin: true },
      '/uploads': { target: backend, changeOrigin: true },
      '/socket.io': { target: backend, ws: true },
    },
  },
})
