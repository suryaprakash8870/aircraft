import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env, .env.<mode>, .env.local for the current mode (without the
  // default VITE_ prefix filter so we can read VITE_BACKEND_PROXY_TARGET).
  const env = loadEnv(mode, process.cwd(), '')

  const proxyTarget = env.VITE_BACKEND_PROXY_TARGET || 'http://localhost:8000'

  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: true,          // bind to 0.0.0.0 so LAN devices can reach the dev server
      strictPort: true,
      proxy: {
        '/api':     { target: proxyTarget, changeOrigin: true },
        '/uploads': { target: proxyTarget, changeOrigin: true },
      },
    },
    preview: {
      port: 3000,
      host: true,
    },
  }
})
