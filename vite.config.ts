import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import dotenv from 'dotenv'

dotenv.config()

import { createOrder, verifyPayment } from './server/razorpay.ts'

function razorpayApiPlugin(): Plugin {
  const handler = async (req: any, res: any, next: any) => {
    const url = req.url ? req.url.split('?')[0] : ''

    if (url === '/api/create-order' && req.method === 'POST') {
      let body = ''
      req.on('data', (chunk: any) => {
        body += chunk
      })
      req.on('end', async () => {
        try {
          const parsed = body ? JSON.parse(body) : {}
          const result = await createOrder(parsed)
          res.statusCode = result.status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result.body))
        } catch (err: any) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Invalid JSON body: ' + err.message }))
        }
      })
      return
    }

    if (url === '/api/verify-payment' && req.method === 'POST') {
      let body = ''
      req.on('data', (chunk: any) => {
        body += chunk
      })
      req.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {}
          const result = verifyPayment(parsed)
          res.statusCode = result.status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result.body))
        } catch (err: any) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Invalid JSON body: ' + err.message }))
        }
      })
      return
    }

    next()
  }

  return {
    name: 'vite-plugin-razorpay-api',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), razorpayApiPlugin()],
  server: {
    port: 3000,
    watch: {
      ignored: ['**/dist/**', '**/node_modules/**']
    }
  }
})
