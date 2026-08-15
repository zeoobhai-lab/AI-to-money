import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Server-side price calculation and coupon validation (Requirement 7: DO NOT TRUST FRONTEND PRICE)
 * Course base price: ₹1,299.00 = 129900 paise
 */
function calculateServerPrice(courseId, couponCode) {
  const basePricePaise = 129900; // ₹1,299.00 (AI Income Mastery Flagship)

  if (!couponCode || typeof couponCode !== 'string' || couponCode.trim() === '' || couponCode.toUpperCase() === 'NONE') {
    return basePricePaise;
  }

  const code = couponCode.trim().toUpperCase();
  let discountPercent = 0;

  if (code === 'AI50' || code === 'WELCOME50') {
    discountPercent = 50;
  } else if (code === 'SAWADH30') {
    discountPercent = 30;
  } else if (code === 'EARLYBIRD' || code === 'LAUNCH40') {
    discountPercent = 40;
  } else if (code === 'SUPER20') {
    discountPercent = 20;
  }

  const discountPaise = Math.round((basePricePaise * discountPercent) / 100);
  const finalPricePaise = Math.max(100, basePricePaise - discountPaise); // Minimum 100 paise (₹1.00)
  return finalPricePaise;
}

/**
 * Creates a Razorpay Order
 * @param {Object} data { courseId, couponCode, receipt, notes }
 * @returns {Promise<{ status: number, body: Object }>}
 */
export async function createOrder(data) {
  const { amount: inputAmount, currency = 'INR', courseId = 'course_income_from_ai', couponCode, receipt, notes = {} } = data || {};

  let amount = inputAmount;

  if (amount === undefined || amount === null) {
    const couponToValidate = couponCode || notes.couponCode || notes.coupon || '';
    amount = calculateServerPrice(courseId, couponToValidate);
  }

  if (typeof amount !== 'number' || isNaN(amount)) {
    return {
      status: 400,
      body: { success: false, error: 'Invalid amount. Amount must be a valid number in paise.' }
    };
  }

  if (amount < 100) {
    return {
      status: 400,
      body: { success: false, error: 'Minimum order amount is 100 paise (₹1.00).' }
    };
  }

  const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    console.error('Razorpay credentials missing. RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set in environment.');
    return {
      status: 401,
      body: { success: false, error: 'Missing Razorpay configuration on server.' }
    };
  }

  try {
    const razorpay = new Razorpay({
      key_id,
      key_secret
    });

    const orderOptions = {
      amount: Math.round(amount),
      currency: currency || 'INR',
      receipt: receipt ? String(receipt).slice(0, 40) : `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      notes: {
        ...notes,
        courseId,
        serverCalculatedAmount: amount,
        couponApplied: couponCode || notes.couponCode || 'NONE'
      }
    };

    const order = await razorpay.orders.create(orderOptions);

    return {
      status: 200,
      body: {
        success: true,
        order_id: order.id,
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status
      }
    };
  } catch (err) {
    console.error('Razorpay createOrder API error:', err);
    const statusCode = err?.statusCode === 401 || err?.status === 401 ? 401 : (err?.statusCode || (err?.error?.code === 'BAD_REQUEST_ERROR' ? 400 : 500));
    return {
      status: statusCode,
      body: {
        success: false,
        error: err?.error?.description || err?.message || 'Failed to create Razorpay order on server.',
        code: err?.error?.code || 'ORDER_CREATION_FAILED'
      }
    };
  }
}

/**
 * Verifies Razorpay Payment Signature
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * @param {Object} data { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * @returns {{ status: number, body: Object }}
 */
export function verifyPayment(data) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return {
      status: 400,
      body: {
        success: false,
        error: 'Missing required parameters: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.'
      }
    };
  }

  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_secret) {
    console.error('Razorpay secret missing. RAZORPAY_KEY_SECRET is not set in environment.');
    return {
      status: 401,
      body: {
        success: false,
        error: 'Missing Razorpay configuration on server.'
      }
    };
  }

  try {
    const textToHash = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(textToHash)
      .digest('hex');

    if (generated_signature.length !== razorpay_signature.length) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Payment verification failed: Signature mismatch.'
        }
      };
    }

    const isValid = crypto.timingSafeEqual(
      Buffer.from(generated_signature, 'utf-8'),
      Buffer.from(razorpay_signature, 'utf-8')
    );

    if (isValid) {
      return {
        status: 200,
        body: {
          success: true,
          message: 'Payment verified successfully.',
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id
        }
      };
    } else {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Payment verification failed: Signature mismatch.'
        }
      };
    }
  } catch (err) {
    console.error('Razorpay signature verification error:', err);
    return {
      status: 400,
      body: {
        success: false,
        error: 'Payment verification failed: ' + (err?.message || 'Internal error')
      }
    };
  }
}
