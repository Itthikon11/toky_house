import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Content-Security-Policy ใส่เฉพาะตอน build (ตอน dev Vite ต้องใช้ inline script สำหรับ HMR)
function cspPlugin(env) {
  const supabase = env.VITE_SUPABASE_URL ? new URL(env.VITE_SUPABASE_URL).host : '*.supabase.co'
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' data: blob: https://${supabase}`,
    `connect-src 'self' https://${supabase} wss://${supabase}`,
    'frame-src https://www.google.com',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
  return {
    name: 'tokyo-house-csp',
    apply: 'build',
    transformIndexHtml: (html) =>
      html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`),
  }
}

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), cspPlugin(env)],
    server: { port: 5173, host: true, headers: securityHeaders },
    preview: { port: 4173, host: true, headers: securityHeaders },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            motion: ['framer-motion'],
            charts: ['recharts'],
          },
        },
      },
    },
  }
})
