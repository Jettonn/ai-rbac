import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import type { Connect } from 'vite'

// ─────────────────────────────────────────────────────────────────────────
// Tiny in-process API: POST /api/send-email → forwards via Resend.
// Keeps the demo single-process. RESEND_API_KEY in .env enables real send;
// without it, the route returns ok:false so the UI can fall back gracefully.
// ─────────────────────────────────────────────────────────────────────────
function emailApiPlugin() {
  return {
    name: 'email-api',
    configureServer(server: { middlewares: { use: (m: Connect.NextHandleFunction) => void } }) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== '/api/send-email' || req.method !== 'POST') return next()

        let body = ''
        req.on('data', (chunk: Buffer) => (body += chunk))
        req.on('end', async () => {
          try {
            const { to, subject, text } = JSON.parse(body || '{}')
            const apiKey = process.env.RESEND_API_KEY
            const forwardTo = process.env.FORWARD_TO || to

            if (!apiKey) {
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: false, error: 'RESEND_API_KEY not set — running in fake mode' }))
              return
            }

            const r = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                from: 'Lecture Demo <onboarding@resend.dev>',
                to: [forwardTo],
                subject: `[→ ${to}] ${subject}`,
                text: `(Demo) Original recipient: ${to}\n\n${text}`,
              }),
            })
            const data = await r.json()
            res.statusCode = r.ok ? 200 : 502
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(r.ok ? { ok: true, id: data.id, forwardedTo: forwardTo } : { ok: false, error: data?.message ?? 'Resend error' }))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), emailApiPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    strictPort: false,
  },
})
