import { verifyPayment } from '../server/razorpay.js';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
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
    const result = verifyPayment(body || {});
    return res.status(result.status || 200).json(result.body || result);
  } catch (err) {
    console.error('API /api/verify-payment error:', err);
    return res.status(500).json({ error: err?.message || 'Server error verifying payment' });
  }
}
