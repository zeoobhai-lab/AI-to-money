import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import dotenv from 'dotenv'

dotenv.config()

import {
  createOrder,
  verifyPayment,
  handleWebhook,
  processRefund,
  generateSignedDownloadUrl
} from './server/razorpay.ts'

function razorpayApiPlugin(): Plugin {
  const handler = async (req: any, res: any, next: any) => {
    const url = req.url ? req.url.split('?')[0] : ''

    // Helper to read raw request body
    const readBody = (): Promise<string> => {
      return new Promise((resolve) => {
        let body = ''
        req.on('data', (chunk: any) => {
          body += chunk
        })
        req.on('end', () => {
          resolve(body)
        })
      })
    }

    const sendResponse = (status: number, data: any) => {
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Razorpay-Signature, x-razorpay-signature, X-Razorpay-Event-Id')
      res.end(JSON.stringify(data))
    }

    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Razorpay-Signature, x-razorpay-signature, X-Razorpay-Event-Id')
      res.end()
      return
    }

    // 1. Create Order
    if (url === '/api/create-order' && req.method === 'POST') {
      try {
        const raw = await readBody()
        const parsed = raw ? JSON.parse(raw) : {}
        const result = await createOrder(parsed)
        sendResponse(result.status, result.body)
      } catch (err: any) {
        sendResponse(400, { success: false, error: 'Invalid JSON body: ' + err.message })
      }
      return
    }

    // 2. Verify Payment
    if (url === '/api/verify-payment' && req.method === 'POST') {
      try {
        const raw = await readBody()
        const parsed = raw ? JSON.parse(raw) : {}
        const result = await verifyPayment(parsed)
        sendResponse(result.status, result.body)
      } catch (err: any) {
        sendResponse(400, { success: false, error: 'Invalid JSON body: ' + err.message })
      }
      return
    }

    // 3. Razorpay Webhook
    if ((url === '/api/razorpay-webhook' || url === '/api/webhook') && req.method === 'POST') {
      try {
        const rawBody = await readBody()
        const signature = (req.headers['x-razorpay-signature'] || req.headers['X-Razorpay-Signature'] || '').toString()
        const eventId = (req.headers['x-razorpay-event-id'] || '').toString()
        const result = await handleWebhook(rawBody, signature, eventId)
        sendResponse(result.status, result.body)
      } catch (err: any) {
        sendResponse(500, { success: false, error: 'Webhook processing error: ' + err.message })
      }
      return
    }

    // 4. Download Product
    if (url === '/api/download-product' && req.method === 'POST') {
      try {
        const raw = await readBody()
        const parsed = raw ? JSON.parse(raw) : {}
        const result = await generateSignedDownloadUrl(parsed)
        sendResponse(result.status, result.body)
      } catch (err: any) {
        sendResponse(400, { success: false, error: 'Invalid request: ' + err.message })
      }
      return
    }

    // 5. Admin Refund
    if (url === '/api/admin/refund' && req.method === 'POST') {
      try {
        const raw = await readBody()
        const parsed = raw ? JSON.parse(raw) : {}
        const result = await processRefund(parsed)
        sendResponse(result.status, result.body)
      } catch (err: any) {
        sendResponse(400, { success: false, error: 'Invalid request: ' + err.message })
      }
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
