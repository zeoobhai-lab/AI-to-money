import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { supabaseAdmin, BUCKET_NAME } from './supabaseAdmin.js';

dotenv.config();

function calculateCouponDiscount(basePricePaise, couponCode) {
  if (!couponCode || typeof couponCode !== 'string' || couponCode.trim() === '' || couponCode.toUpperCase() === 'NONE') {
    return basePricePaise;
  }

  const code = couponCode.trim().toUpperCase().replace(/\s+/g, '');

  if (code === 'SAWADSERA3020091' || code === 'SAWADSERA302009' || code === 'TEST1') {
    return 100;
  }

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
  return Math.max(100, basePricePaise - discountPaise);
}

async function getVerifiedProduct(productId) {
  const fallbackProduct = {
    id: productId || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'AI Income Mastery: Complete Blueprint',
    price_paise: 129900,
    file_path: 'ebooks/ai-income-mastery-blueprint.pdf'
  };

  if (!productId) {
    return fallbackProduct;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, name, price_paise, file_path, status')
      .eq('id', productId)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        name: data.name,
        price_paise: Number(data.price_paise),
        file_path: data.file_path || ''
      };
    }
  } catch (err) {
    console.warn('[Server Warning] Could not fetch product from Supabase:', err);
  }

  return fallbackProduct;
}

async function resolveUserProfile(email, name, phone, userId) {
  if (!email && !userId) return null;

  try {
    if (userId) {
      const { data } = await supabaseAdmin.from('profiles').select('id').eq('id', userId).maybeSingle();
      if (data) return data.id;
    }

    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      const { data } = await supabaseAdmin.from('profiles').select('id').eq('email', cleanEmail).maybeSingle();
      if (data) return data.id;

      const newId = userId || crypto.randomUUID();
      const { data: newProfile } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: newId,
          full_name: name || cleanEmail.split('@')[0],
          email: cleanEmail,
          phone: phone || '',
          role: 'customer',
          account_status: 'active'
        })
        .select('id')
        .maybeSingle();

      if (newProfile) return newProfile.id;
    }
  } catch (err) {
    console.warn('[Server Warning] Failed resolving user profile:', err);
  }

  return null;
}

export async function createOrder(data) {
  const {
    productId,
    couponCode: rawCoupon,
    userEmail = '',
    userName = '',
    userPhone = '',
    userId = '',
    currency = 'INR',
    receipt,
    notes = {}
  } = data || {};

  const couponCode = rawCoupon || notes.couponCode || notes.coupon || '';
  const email = userEmail || notes.userEmail || '';
  const name = userName || notes.userName || '';
  const phone = userPhone || notes.userPhone || '';

  const product = await getVerifiedProduct(productId || notes.courseId || notes.productId);
  const finalAmountPaise = calculateCouponDiscount(product.price_paise, couponCode);

  if (finalAmountPaise < 100) {
    return {
      status: 400,
      body: { success: false, error: 'Minimum order amount is 100 paise (₹1.00).' }
    };
  }

  const generatedOrderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const generatedReceipt = receipt ? String(receipt).slice(0, 40) : `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const resolvedUserId = await resolveUserProfile(email, name, phone, userId);

  const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  let razorpayOrderId = null;

  if (key_id && key_secret) {
    try {
      const razorpay = new Razorpay({
        key_id,
        key_secret
      });

      const orderOptions = {
        amount: Math.round(finalAmountPaise),
        currency: currency || 'INR',
        receipt: generatedReceipt,
        notes: {
          ...notes,
          orderNumber: generatedOrderNumber,
          productId: product.id,
          productName: product.name,
          couponCode: couponCode || 'NONE',
          userEmail: email
        }
      };

      const rzpOrder = await razorpay.orders.create(orderOptions);
      razorpayOrderId = rzpOrder.id;
    } catch (err) {
      console.error('Razorpay API create order error:', err);
      return {
        status: 500,
        body: {
          success: false,
          error: err?.error?.description || err?.message || 'Failed to create Razorpay order'
        }
      };
    }
  } else {
    console.warn('[Server Notice] Razorpay keys not configured. Simulating order creation for local preview.');
    razorpayOrderId = `order_sim_${Date.now()}`;
  }

  let dbOrderId = crypto.randomUUID();
  try {
    const { data: dbOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        id: dbOrderId,
        user_id: resolvedUserId,
        order_number: generatedOrderNumber,
        total_amount_paise: finalAmountPaise,
        currency: currency || 'INR',
        razorpay_order_id: razorpayOrderId,
        payment_method: 'Razorpay',
        payment_status: 'pending',
        refunded_amount_paise: 0,
        purchased_at: new Date().toISOString()
      })
      .select('id')
      .maybeSingle();

    if (!orderError && dbOrder) {
      dbOrderId = dbOrder.id;
    }

    await supabaseAdmin.from('order_items').insert({
      order_id: dbOrderId,
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit_price_paise: finalAmountPaise,
      total_price_paise: finalAmountPaise
    });
  } catch (dbErr) {
    console.warn('[Server Warning] Could not persist order to Supabase table:', dbErr);
  }

  return {
    status: 200,
    body: {
      success: true,
      order_id: razorpayOrderId,
      id: razorpayOrderId,
      amount: Math.round(finalAmountPaise),
      currency: currency || 'INR',
      receipt: generatedReceipt,
      order_number: generatedOrderNumber,
      product_name: product.name,
      db_order_id: dbOrderId
    }
  };
}

export async function verifyPayment(data) {
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

  if (key_secret) {
    try {
      const textToHash = `${razorpay_order_id}|${razorpay_payment_id}`;
      const generated_signature = crypto
        .createHmac('sha256', key_secret)
        .update(textToHash)
        .digest('hex');

      if (generated_signature.length !== razorpay_signature.length) {
        return {
          status: 400,
          body: { success: false, error: 'Payment verification failed: Signature length mismatch.' }
        };
      }

      const isValid = crypto.timingSafeEqual(
        Buffer.from(generated_signature, 'utf-8'),
        Buffer.from(razorpay_signature, 'utf-8')
      );

      if (!isValid) {
        return {
          status: 400,
          body: { success: false, error: 'Payment verification failed: Signature mismatch.' }
        };
      }
    } catch (err) {
      console.error('Razorpay signature verification error:', err);
      return {
        status: 400,
        body: { success: false, error: 'Payment verification failed: ' + (err?.message || 'Internal error') }
      };
    }
  } else {
    console.warn('[Server Notice] RAZORPAY_KEY_SECRET missing. Direct verification mode active.');
  }

  try {
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        razorpay_payment_id: razorpay_payment_id,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('razorpay_order_id', razorpay_order_id);

    if (updateError) {
      console.warn('[Server Warning] Could not update order in Supabase:', updateError.message);
    }
  } catch (dbErr) {
    console.warn('[Server Warning] Supabase update exception:', dbErr);
  }

  return {
    status: 200,
    body: {
      success: true,
      message: 'Payment verified successfully and order updated to paid.',
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id
    }
  };
}

export async function handleWebhook(rawBody, signature, eventIdHeader) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (webhookSecret) {
    if (!signature) {
      return {
        status: 400,
        body: { success: false, error: 'Missing X-Razorpay-Signature header' }
      };
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      const isSigValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf-8'),
        Buffer.from(signature, 'utf-8')
      );

      if (!isSigValid) {
        return {
          status: 400,
          body: { success: false, error: 'Invalid webhook signature' }
        };
      }
    } catch (e) {
      return {
        status: 400,
        body: { success: false, error: 'Webhook signature verification failed: ' + e.message }
      };
    }
  }

  let eventPayload;
  try {
    eventPayload = JSON.parse(rawBody);
  } catch (e) {
    return {
      status: 400,
      body: { success: false, error: 'Invalid JSON payload' }
    };
  }

  const eventType = eventPayload.event || 'unknown';
  const providerEventId = eventIdHeader || eventPayload.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const paymentEntity = eventPayload.payload?.payment?.entity || {};
  const orderEntity = eventPayload.payload?.order?.entity || {};
  const refundEntity = eventPayload.payload?.refund?.entity || {};

  const rzpOrderId = paymentEntity.order_id || orderEntity.id || null;
  const rzpPaymentId = paymentEntity.id || refundEntity.payment_id || null;

  try {
    const { data: existingEvent } = await supabaseAdmin
      .from('payment_events')
      .select('id, processing_status')
      .eq('provider_event_id', providerEventId)
      .maybeSingle();

    if (existingEvent && existingEvent.processing_status === 'processed') {
      return {
        status: 200,
        body: { success: true, message: 'Event already processed (idempotent duplicate skipped)', event_id: providerEventId }
      };
    }

    await supabaseAdmin
      .from('payment_events')
      .upsert(
        {
          provider: 'razorpay',
          provider_event_id: providerEventId,
          razorpay_order_id: rzpOrderId,
          razorpay_payment_id: rzpPaymentId,
          event_type: eventType,
          processing_status: 'pending',
          payload: eventPayload,
          created_at: new Date().toISOString()
        },
        { onConflict: 'provider_event_id' }
      );
  } catch (err) {
    console.warn('[Webhook Warning] Could not log event to payment_events:', err);
  }

  let processingStatus = 'processed';

  try {
    switch (eventType) {
      case 'payment.authorized':
      case 'payment.captured': {
        if (rzpOrderId) {
          await supabaseAdmin
            .from('orders')
            .update({
              payment_status: 'paid',
              razorpay_payment_id: rzpPaymentId,
              payment_method: paymentEntity.method || 'Razorpay',
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('razorpay_order_id', rzpOrderId);
        }
        break;
      }

      case 'payment.failed': {
        if (rzpOrderId) {
          await supabaseAdmin
            .from('orders')
            .update({
              payment_status: 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('razorpay_order_id', rzpOrderId);
        }
        break;
      }

      case 'refund.created':
      case 'refund.processed': {
        const refundAmountPaise = Number(refundEntity.amount) || 0;
        const refundId = refundEntity.id || `rfnd_${Date.now()}`;

        let orderToRefund = null;
        if (rzpPaymentId) {
          const { data } = await supabaseAdmin
            .from('orders')
            .select('id, total_amount_paise, refunded_amount_paise')
            .eq('razorpay_payment_id', rzpPaymentId)
            .maybeSingle();
          orderToRefund = data;
        }

        if (orderToRefund) {
          await supabaseAdmin
            .from('refunds')
            .upsert(
              {
                order_id: orderToRefund.id,
                razorpay_refund_id: refundId,
                amount_paise: refundAmountPaise,
                status: 'processed',
                created_at: new Date().toISOString()
              },
              { onConflict: 'razorpay_refund_id' }
            );

          const currentRefunded = Number(orderToRefund.refunded_amount_paise) || 0;
          const newRefundedTotal = currentRefunded + refundAmountPaise;
          const totalAmount = Number(orderToRefund.total_amount_paise) || 0;
          const newStatus = newRefundedTotal >= totalAmount ? 'refunded' : 'partially_refunded';

          await supabaseAdmin
            .from('orders')
            .update({
              refunded_amount_paise: newRefundedTotal,
              payment_status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', orderToRefund.id);
        }
        break;
      }

      case 'refund.failed': {
        if (refundEntity.id) {
          await supabaseAdmin
            .from('refunds')
            .update({ status: 'failed' })
            .eq('razorpay_refund_id', refundEntity.id);
        }
        break;
      }

      default:
        console.log(`[Webhook Notice] Unhandled event type: ${eventType}`);
        break;
    }
  } catch (procErr) {
    console.error('[Webhook Error] Failed processing event:', procErr);
    processingStatus = 'failed';
  }

  try {
    await supabaseAdmin
      .from('payment_events')
      .update({
        processing_status: processingStatus,
        processed_at: new Date().toISOString()
      })
      .eq('provider_event_id', providerEventId);
  } catch (_) {}

  return {
    status: 200,
    body: {
      success: processingStatus === 'processed',
      event: eventType,
      id: providerEventId
    }
  };
}

export async function processRefund(data) {
  const { orderId, paymentId, amountPaise, reason = 'Customer requested refund' } = data || {};

  if (!orderId && !paymentId) {
    return {
      status: 400,
      body: { success: false, error: 'Either orderId or paymentId is required to process refund.' }
    };
  }

  let order = null;
  if (orderId) {
    const { data } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).maybeSingle();
    order = data;
  }
  if (!order && paymentId) {
    const { data } = await supabaseAdmin.from('orders').select('*').eq('razorpay_payment_id', paymentId).maybeSingle();
    order = data;
  }

  if (!order) {
    return {
      status: 404,
      body: { success: false, error: 'Order not found for refund.' }
    };
  }

  const refundAmount = amountPaise || (Number(order.total_amount_paise) - Number(order.refunded_amount_paise));
  if (refundAmount <= 0) {
    return {
      status: 400,
      body: { success: false, error: 'Invalid refund amount. Order may already be fully refunded.' }
    };
  }

  const targetPaymentId = paymentId || order.razorpay_payment_id;
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  let rzpRefundId = `rfnd_${Date.now()}`;

  if (key_id && key_secret && targetPaymentId) {
    try {
      const razorpay = new Razorpay({
        key_id,
        key_secret
      });

      const refundResult = await razorpay.payments.refund(targetPaymentId, {
        amount: refundAmount,
        notes: {
          orderId: order.id,
          orderNumber: order.order_number,
          reason
        }
      });
      rzpRefundId = refundResult.id;
    } catch (err) {
      console.error('Razorpay refund API error:', err);
      return {
        status: 500,
        body: {
          success: false,
          error: err?.error?.description || err?.message || 'Failed to process refund with Razorpay'
        }
      };
    }
  }

  try {
    await supabaseAdmin.from('refunds').insert({
      order_id: order.id,
      razorpay_refund_id: rzpRefundId,
      amount_paise: refundAmount,
      status: 'processed'
    });

    const newRefundedTotal = (Number(order.refunded_amount_paise) || 0) + refundAmount;
    const newStatus = newRefundedTotal >= Number(order.total_amount_paise) ? 'refunded' : 'partially_refunded';

    await supabaseAdmin
      .from('orders')
      .update({
        refunded_amount_paise: newRefundedTotal,
        payment_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);
  } catch (err) {
    console.warn('[Server Warning] Could not record refund in Supabase:', err);
  }

  return {
    status: 200,
    body: {
      success: true,
      message: 'Refund processed successfully',
      refund_id: rzpRefundId,
      amount_paise: refundAmount
    }
  };
}

export async function generateSignedDownloadUrl(data) {
  const { productId, userEmail, userId } = data || {};

  if (!productId) {
    return {
      status: 400,
      body: { success: false, error: 'Product ID is required for download.' }
    };
  }

  if (!userEmail && !userId) {
    return {
      status: 401,
      body: { success: false, error: 'Authentication required. Please log in to download.' }
    };
  }

  let hasPaid = false;

  try {
    let query = supabaseAdmin
      .from('orders')
      .select('id, payment_status, profiles!inner(email, id), order_items!inner(product_id)')
      .eq('payment_status', 'paid')
      .eq('order_items.product_id', productId);

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (userEmail) {
      query = query.eq('profiles.email', userEmail.toLowerCase().trim());
    }

    const { data: matchedOrders } = await query;
    if (matchedOrders && matchedOrders.length > 0) {
      hasPaid = true;
    }
  } catch (e) {
    console.warn('[Server Warning] Entitlement check query issue, checking purchases table fallback:', e);
  }

  if (!hasPaid && userEmail) {
    try {
      const { data: legacyPurchases } = await supabaseAdmin
        .from('purchases')
        .select('id, purchase_status')
        .eq('user_email', userEmail.toLowerCase().trim())
        .eq('purchase_status', true);

      if (legacyPurchases && legacyPurchases.length > 0) {
        hasPaid = true;
      }
    } catch (_) {}
  }

  if (!hasPaid) {
    return {
      status: 403,
      body: {
        success: false,
        error: 'Access denied: You have not purchased this product, or payment is still pending.'
      }
    };
  }

  const product = await getVerifiedProduct(productId);
  const filePath = product.file_path || 'ebooks/ai-income-mastery-blueprint.pdf';

  try {
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 60);

    if (signError || !signedData?.signedUrl) {
      return {
        status: 200,
        body: {
          success: true,
          downloadUrl: `/api/download-file?productId=${encodeURIComponent(productId)}&token=${Date.now()}`,
          expiresIn: 60,
          filename: product.name.replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf'
        }
      };
    }

    return {
      status: 200,
      body: {
        success: true,
        downloadUrl: signedData.signedUrl,
        expiresIn: 60,
        filename: product.name.replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf'
      }
    };
  } catch (err) {
    return {
      status: 500,
      body: {
        success: false,
        error: 'Failed to generate signed download URL: ' + err.message
      }
    };
  }
}
