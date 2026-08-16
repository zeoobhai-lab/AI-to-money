import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

export interface CreateOrderInput {
  amount?: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface HandlerResult {
  status: number;
  body: Record<string, any>;
}

export interface VerifyPaymentInput {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

/**
 * Creates a Razorpay Order
 * @param data { amount, currency, receipt, notes }
 */
export async function createOrder(data: CreateOrderInput): Promise<HandlerResult> {
  const { amount: inputAmount, currency = 'INR', receipt, notes = {} } = data || {};

  let amount = inputAmount;

  if (amount === undefined || amount === null) {
    amount = 129900; // Fallback default
  }

  // Validate amount (in paise, must be >= 100 paise)
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

  const generatedReceipt = receipt ? String(receipt).slice(0, 40) : `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (!key_id || !key_secret) {
    console.warn('Razorpay credentials missing. Using fallback test order for checkout.');
    const fallbackOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      status: 200,
      body: {
        success: true,
        order_id: fallbackOrderId,
        id: fallbackOrderId,
        amount: Math.round(amount),
        currency: currency || 'INR',
        receipt: generatedReceipt,
        status: 'created',
        is_fallback: true
      }
    };
  }

  try {
    const razorpay = new (Razorpay as any)({
      key_id,
      key_secret
    });

    const orderOptions = {
      amount: Math.round(amount),
      currency: currency || 'INR',
      receipt: generatedReceipt,
      notes: notes || {}
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
  } catch (err: any) {
    console.error('Razorpay createOrder API error:', err);
    // In test mode or when using test credentials, return fallback order if API fails
    if (key_id?.startsWith('rzp_test_')) {
      console.warn('Razorpay API error in test mode. Falling back to test order ID.');
      const fallbackOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      return {
        status: 200,
        body: {
          success: true,
          order_id: fallbackOrderId,
          id: fallbackOrderId,
          amount: Math.round(amount),
          currency: currency || 'INR',
          receipt: generatedReceipt,
          status: 'created',
          is_fallback: true
        }
      };
    }

    const statusCode = err?.statusCode === 401 || err?.status === 401 ? 401 : (err?.statusCode || (err?.error?.code === 'BAD_REQUEST_ERROR' ? 400 : 500));
    return {
      status: statusCode,
      body: {
        success: false,
        error: err?.error?.description || err?.message || 'Failed to create Razorpay order',
        code: err?.error?.code || 'ORDER_CREATION_FAILED'
      }
    };
  }
}

/**
 * Verifies Razorpay Payment Signature
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * @param data { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export function verifyPayment(data: VerifyPaymentInput): HandlerResult {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data || {};

  // Check for required fields
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
    console.error('Razorpay secret missing. RAZORPAY_KEY_SECRET is not set.');
    return {
      status: 401,
      body: {
        success: false,
        error: 'Server configuration error: RAZORPAY_KEY_SECRET is missing.'
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
  } catch (err: any) {
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
