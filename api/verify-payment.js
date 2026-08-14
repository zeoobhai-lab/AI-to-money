import { verifyPayment } from '../server/razorpay.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const result = verifyPayment(req.body);
  return res.status(result.status).json(result.body);
}
