import { handleWebhook } from '../server/razorpay.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Razorpay-Signature, x-razorpay-signature, X-Razorpay-Event-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const signature = req.headers['x-razorpay-signature'] || req.headers['X-Razorpay-Signature'] || '';
    const eventId = req.headers['x-razorpay-event-id'] || '';

    const result = await handleWebhook(rawBody, signature, eventId);
    return res.status(result.status || 200).json(result.body || result);
  } catch (err) {
    console.error('API /api/razorpay-webhook error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Webhook processing failed.' });
  }
}

