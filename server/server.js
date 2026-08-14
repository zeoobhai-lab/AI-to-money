import http from 'http';
import dotenv from 'dotenv';
import { createOrder, verifyPayment } from './razorpay.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        if (!body) {
          resolve({});
        } else {
          resolve(JSON.parse(body));
        }
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const url = req.url ? req.url.split('?')[0] : '';

  if (req.method === 'POST' && url === '/api/create-order') {
    try {
      const body = await parseRequestBody(req);
      const result = await createOrder(body);
      sendJson(res, result.status, result.body);
    } catch (err) {
      sendJson(res, 400, { error: 'Invalid JSON in request body' });
    }
    return;
  }

  if (req.method === 'POST' && url === '/api/verify-payment') {
    try {
      const body = await parseRequestBody(req);
      const result = verifyPayment(body);
      sendJson(res, result.status, result.body);
    } catch (err) {
      sendJson(res, 400, { error: 'Invalid JSON in request body' });
    }
    return;
  }

  if (req.method === 'GET' && url === '/api/health') {
    sendJson(res, 200, {
      status: 'ok',
      service: 'Razorpay API Server',
      timestamp: new Date().toISOString()
    });
    return;
  }

  sendJson(res, 404, { error: 'Endpoint Not Found' });
});

server.listen(PORT, () => {
  console.log(`Razorpay Backend API Server running on port ${PORT}`);
  console.log(`- POST http://localhost:${PORT}/api/create-order`);
  console.log(`- POST http://localhost:${PORT}/api/verify-payment`);
});
