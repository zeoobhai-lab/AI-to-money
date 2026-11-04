import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://rqifrrjdyvloygyhkwbo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_VjnGcmeiLLQcn1eF6CJYDg_263WuTu3';

export const isServiceRoleConfigured = Boolean(SUPABASE_SERVICE_ROLE_KEY);

if (!isServiceRoleConfigured) {
  console.warn(
    '[Server Warning] SUPABASE_SERVICE_ROLE_KEY is not set. Privileged server operations will use Anon Key with limited permissions. Please configure SUPABASE_SERVICE_ROLE_KEY in .env.'
  );
}

export const supabaseAdmin = createClient(
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

