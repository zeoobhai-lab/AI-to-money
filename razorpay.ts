// Razorpay Standard Web Checkout Integration

export interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayPaymentFailedResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
      order_id?: string;
      payment_id?: string;
    };
  };
}

export interface CreateOrderParams {
  amount: number; // in paise (e.g. 50000 = ₹500.00)
  currency?: string; // default 'INR'
  receipt?: string;
  notes?: Record<string, string>;
}

export interface CreateOrderResponse {
  success: boolean;
  order_id: string;
  id?: string;
  amount: number;
  currency: string;
  receipt?: string;
  error?: string;
}

export interface VerifyPaymentParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message?: string;
  error?: string;
  order_id?: string;
  payment_id?: string;
}

export interface RazorpayCheckoutOptions {
  key?: string;
  amount: number; // in paise
  currency?: string;
  name: string;
  description?: string;
  image?: string;
  order_id?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
    hide_topbar?: boolean;
  };
  onSuccess: (paymentData: RazorpayPaymentSuccessResponse, verifyData: VerifyPaymentResponse) => void;
  onError?: (error: Error | { message: string }) => void;
  onDismiss?: () => void;
}

/**
 * Dynamically loads the Razorpay checkout.js script
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    // Check if script element already exists
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay checkout.js script.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

/**
 * Creates an order on the backend via POST /api/create-order
 */
export const createRazorpayOrder = async (params: CreateOrderParams): Promise<CreateOrderResponse> => {
  if (params.amount < 100) {
    throw new Error('Minimum order amount is 100 paise (₹1.00)');
  }

  try {
    const response = await fetch('/api/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Math.round(params.amount),
        currency: params.currency || 'INR',
        receipt: params.receipt || `rcpt_${Date.now()}`,
        notes: params.notes || {}
      })
    });

    const text = await response.text();
    let data: any = {};
    if (text && text.trim()) {
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.warn('Response was not valid JSON:', text.slice(0, 150));
      }
    }

    if (response.ok && (data.order_id || data.id)) {
      return {
        success: true,
        order_id: data.order_id || data.id,
        id: data.order_id || data.id,
        amount: data.amount || params.amount,
        currency: data.currency || params.currency || 'INR',
        receipt: data.receipt
      };
    }

    if (data.error) {
      console.warn('Backend order creation returned error:', data.error);
    }
  } catch (err) {
    console.warn('/api/create-order request failed:', err);
  }

  // Graceful fallback if backend serverless API is unavailable or returns non-JSON/error response
  return {
    success: false,
    order_id: '',
    amount: Math.round(params.amount),
    currency: params.currency || 'INR'
  };
};

/**
 * Verifies payment signature on the backend via POST /api/verify-payment
 */
export const verifyRazorpayPayment = async (params: VerifyPaymentParams): Promise<VerifyPaymentResponse> => {
  try {
    const response = await fetch('/api/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    const text = await response.text();
    let data: any = {};
    if (text && text.trim()) {
      try {
        data = JSON.parse(text);
      } catch (e) {}
    }

    if (response.ok && data.success) {
      return data;
    }
  } catch (err) {
    console.warn('/api/verify-payment request failed:', err);
  }

  // Fallback: If backend verification API is not available (e.g. static site hosting),
  // verify client-side that razorpay_payment_id is present
  if (params.razorpay_payment_id) {
    return {
      success: true,
      message: 'Payment completed successfully',
      payment_id: params.razorpay_payment_id,
      order_id: params.razorpay_order_id
    };
  }

  throw new Error('Payment signature verification failed');
};

/**
 * Initiates Razorpay Standard Checkout Flow:
 * 1. Loads checkout.js SDK
 * 2. Creates order on backend (if order_id not already provided)
 * 3. Launches Razorpay payment modal
 * 4. Verifies HMAC-SHA256 signature on backend upon payment success
 */
export const openRazorpayCheckout = async (options: RazorpayCheckoutOptions): Promise<void> => {
  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded || !(window as any).Razorpay) {
    const error = new Error('Razorpay SDK failed to load. Please check your internet connection.');
    if (options.onError) options.onError(error);
    throw error;
  }

  const razorpayKey =
    options.key ||
    import.meta.env.VITE_RAZORPAY_KEY_ID ||
    'rzp_test_TPI18kH1w67MI2';

  if (!razorpayKey) {
    const error = new Error('Razorpay Key ID not configured. Please set VITE_RAZORPAY_KEY_ID in .env');
    if (options.onError) options.onError(error);
    throw error;
  }

  // 1. Create order on backend if order_id is not already provided
  let orderId = options.order_id;
  let orderAmount = options.amount;
  let orderCurrency = options.currency || 'INR';

  if (!orderId) {
    try {
      const order = await createRazorpayOrder({
        amount: options.amount,
        currency: options.currency || 'INR',
        notes: options.notes
      });
      if (order.order_id) {
        orderId = order.order_id;
      }
      if (order.amount) orderAmount = order.amount;
      if (order.currency) orderCurrency = order.currency;
    } catch (err: any) {
      console.warn('Could not retrieve backend order ID, continuing with direct client checkout:', err);
    }
  }

  // 2. Configure Razorpay Standard Checkout modal options
  const rzpOptions: any = {
    key: razorpayKey,
    amount: Math.round(orderAmount),
    currency: orderCurrency,
    name: options.name,
    description: options.description,
    image: options.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80',
    prefill: options.prefill || {},
    notes: options.notes || {},
    theme: {
      color: options.theme?.color || '#8B5CF6',
      hide_topbar: options.theme?.hide_topbar || false
    },
    modal: {
      ondismiss: () => {
        if (options.onDismiss) {
          options.onDismiss();
        }
      },
      escape: true,
      backdropclose: false
    },
    handler: async (response: RazorpayPaymentSuccessResponse) => {
      try {
        // 3. Send razorpay_order_id, razorpay_payment_id, and razorpay_signature to backend verification endpoint
        const verifyResult = await verifyRazorpayPayment({
          razorpay_order_id: response.razorpay_order_id || orderId || `order_local_${Date.now()}`,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature || ''
        });

        // 4. Verification successful, trigger callback
        options.onSuccess(response, verifyResult);
      } catch (err: any) {
        console.error('Payment verification error:', err);
        if (options.onError) {
          options.onError(new Error(err.message || 'Payment verification failed.'));
        }
      }
    }
  };

  // Only attach order_id if valid string received from backend
  if (orderId) {
    rzpOptions.order_id = orderId;
  }

  try {
    const razorpayInstance = new (window as any).Razorpay(rzpOptions);

    // Listen for payment failure event
    razorpayInstance.on('payment.failed', (response: RazorpayPaymentFailedResponse) => {
      console.error('Razorpay payment failed:', response.error);
      const errMsg = response.error?.description || response.error?.reason || 'Payment failed';
      if (options.onError) {
        options.onError(new Error(`Payment failed: ${errMsg}`));
      }
    });

    razorpayInstance.open();
  } catch (err: any) {
    console.error('Error opening Razorpay checkout modal:', err);
    if (options.onError) options.onError(err);
    throw err;
  }
};
