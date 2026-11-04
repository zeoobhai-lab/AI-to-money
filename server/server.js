import http from 'http';
import dotenv from 'dotenv';
import {
  createOrder,
  verifyPayment,
  handleWebhook,
  processRefund,
  generateSignedDownloadUrl
} from './razorpay.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Razorpay-Signature, x-razorpay-signature, X-Razorpay-Event-Id'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Razorpay-Signature, x-razorpay-signature, X-Razorpay-Event-Id'
    });
    res.end();
    return;
  }

  const url = req.url ? req.url.split('?')[0] : '';

  // 1. Create Order
  if (req.method === 'POST' && url === '/api/create-order') {
    try {
      const raw = await parseRequestBody(req);
      const body = raw ? JSON.parse(raw) : {};
      const result = await createOrder(body);
      sendJson(res, result.status, result.body);
    } catch (err) {
      sendJson(res, 400, { success: false, error: 'Invalid JSON in request body: ' + err.message });
    }
    return;
  }

  // 2. Verify Payment
  if (req.method === 'POST' && url === '/api/verify-payment') {
    try {
      const raw = await parseRequestBody(req);
      const body = raw ? JSON.parse(raw) : {};
      const result = await verifyPayment(body);
      sendJson(res, result.status, result.body);
    } catch (err) {
      sendJson(res, 400, { success: false, error: 'Invalid JSON in request body: ' + err.message });
    }
    return;
  }

  // 3. Razorpay Webhook
  if (req.method === 'POST' && (url === '/api/razorpay-webhook' || url === '/api/webhook')) {
    try {
      const rawBody = await parseRequestBody(req);
      const signature = (req.headers['x-razorpay-signature'] || req.headers['X-Razorpay-Signature'] || '').toString();
      const eventId = (req.headers['x-razorpay-event-id'] || '').toString();
      const result = await handleWebhook(rawBody, signature, eventId);
      sendJson(res, result.status, result.body);
    } catch (err) {
      console.error('Webhook error:', err);
      sendJson(res, 500, { success: false, error: 'Webhook processing error: ' + err.message });
    }
    return;
  }

  // 4. Download Product (Secured with Entitlement Check)
  if (req.method === 'POST' && url === '/api/download-product') {
    try {
      const raw = await parseRequestBody(req);
      const body = raw ? JSON.parse(raw) : {};
      const result = await generateSignedDownloadUrl(body);
      sendJson(res, result.status, result.body);
    } catch (err) {
      sendJson(res, 400, { success: false, error: 'Invalid request: ' + err.message });
    }
    return;
  }

  // 5. Admin Refund
  if (req.method === 'POST' && url === '/api/admin/refund') {
    try {
      const raw = await parseRequestBody(req);
      const body = raw ? JSON.parse(raw) : {};
      const result = await processRefund(body);
      sendJson(res, result.status, result.body);
    } catch (err) {
      sendJson(res, 400, { success: false, error: 'Invalid request: ' + err.message });
    }
    return;
  }

  // Health Check
  if (req.method === 'GET' && url === '/api/health') {
    sendJson(res, 200, {
      status: 'ok',
      service: 'Razorpay & Supabase Backend Server',
      timestamp: new Date().toISOString()
    });
    return;
  }

  sendJson(res, 404, { error: 'Endpoint Not Found' });
});

server.listen(PORT, () => {
  console.log(`Razorpay & Supabase Backend API Server running on port ${PORT}`);
  console.log(`- POST http://localhost:${PORT}/api/create-order`);
  console.log(`- POST http://localhost:${PORT}/api/verify-payment`);
  console.log(`- POST http://localhost:${PORT}/api/razorpay-webhook`);
  console.log(`- POST http://localhost:${PORT}/api/download-product`);
  console.log(`- POST http://localhost:${PORT}/api/admin/refund`);
});
