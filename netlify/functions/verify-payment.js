import { verifyPayment } from '../../server/razorpay.js';

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed. Use POST.' })
    };
  }

  try {
    let body = event.body ? JSON.parse(event.body) : {};
    const result = verifyPayment(body);
    return {
      statusCode: result.status || 200,
      headers,
      body: JSON.stringify(result.body || result)
    };
  } catch (err) {
    console.error('Netlify function verify-payment error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Payment verification failed on server.' })
    };
  }
}
