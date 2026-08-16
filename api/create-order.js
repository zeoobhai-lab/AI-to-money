import { createOrder } from '../server/razorpay.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    const result = await createOrder(body || {});
    return res.status(result.status || 200).json(result.body || result);
  } catch (err) {
    console.error('API /api/create-order error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Payment service is temporarily unavailable.' });
  }
}
