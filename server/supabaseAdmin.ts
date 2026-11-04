import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://rqifrrjdyvloygyhkwbo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_VjnGcmeiLLQcn1eF6CJYDg_263WuTu3';

// Use Service Role Key on the server for full administrative access and RLS bypass
// Falls back to Anon Key with a warning if Service Role Key is not configured yet
export const isServiceRoleConfigured = Boolean(SUPABASE_SERVICE_ROLE_KEY);

if (!isServiceRoleConfigured) {
  console.warn(
    '[Server Warning] SUPABASE_SERVICE_ROLE_KEY is not set. Privileged server operations will use Anon Key with limited permissions. Please configure SUPABASE_SERVICE_ROLE_KEY in .env.'
  );
}

export const supabaseAdmin: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

export const BUCKET_NAME = 'digital-downloads';

export interface ProductRecord {
  id: string;
  name: string;
  description: string;
  price_paise: number;
  image_url: string;
  file_path: string;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface OrderRecord {
  id: string;
  user_id: string | null;
  order_number: string;
  total_amount_paise: number;
  currency: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'partially_refunded' | 'refunded';
  refunded_amount_paise: number;
  purchased_at: string;
  paid_at: string | null;
  updated_at: string;
}

export interface OrderItemRecord {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price_paise: number;
  total_price_paise: number;
  created_at: string;
}

export interface PaymentEventRecord {
  id: string;
  provider: string;
  provider_event_id: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  event_type: string;
  processing_status: 'pending' | 'processed' | 'failed' | 'ignored';
  payload: any;
  created_at: string;
  processed_at: string | null;
}

export interface RefundRecord {
  id: string;
  order_id: string;
  razorpay_refund_id: string | null;
  amount_paise: number;
  status: 'pending' | 'processed' | 'failed';
  created_at: string;
}

