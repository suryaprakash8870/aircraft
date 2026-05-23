import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// The frontend talks to the backend directly via VITE_API_BASE_URL
// (see frontend/.env.development), so no dev-server proxy is needed.
// In production the Docker image's nginx serves the built bundle and
// proxies /api to the backend container — see frontend/nginx.conf.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,          // bind to 0.0.0.0 so LAN devices can reach the dev server
    strictPort: true,
  },
  preview: {
    port: 3000,
    host: true,
  },
})
