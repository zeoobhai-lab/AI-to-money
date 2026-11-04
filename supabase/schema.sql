-- =============================================================================
-- SUPABASE DATABASE SCHEMA MIGRATION: E-COMMERCE & DIGITAL PRODUCTS PLATFORM
-- Tables: profiles, products, orders, order_items, payment_events, refunds
-- Storage: private bucket for digital downloads
-- Security: Row Level Security (RLS) policies & triggers
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. PROFILES TABLE (Customer Registrations)
-- Every successful registration automatically creates a customer profile.
-- Linked to auth.users.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL UNIQUE,
    phone TEXT DEFAULT '',
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'student')),
    account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'blocked', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for lightning-fast lookups and sorting
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on Supabase Auth Signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT := 'customer';
    user_name TEXT := '';
    user_phone TEXT := '';
BEGIN
    -- Extract full name from user_metadata if available
    IF NEW.raw_user_meta_data->>'full_name' IS NOT NULL THEN
        user_name := NEW.raw_user_meta_data->>'full_name';
    ELSIF NEW.raw_user_meta_data->>'name' IS NOT NULL THEN
        user_name := NEW.raw_user_meta_data->>'name';
    ELSE
        user_name := split_part(NEW.email, '@', 1);
    END IF;

    -- Extract phone if available
    IF NEW.raw_user_meta_data->>'phone' IS NOT NULL THEN
        user_phone := NEW.raw_user_meta_data->>'phone';
    END IF;

    -- Assign admin role if email matches known master admin or has admin flag in metadata
    IF NEW.email = 'rathoreaadarsh084@gmail.com' OR NEW.raw_user_meta_data->>'role' = 'admin' THEN
        user_role := 'admin';
    END IF;

    INSERT INTO public.profiles (id, full_name, email, phone, role, account_status, created_at, updated_at)
    VALUES (
        NEW.id,
        user_name,
        LOWER(TRIM(NEW.email)),
        user_phone,
        user_role,
        'active',
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 2. PRODUCTS TABLE (Digital Products & Ebooks)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price_paise BIGINT NOT NULL CHECK (price_paise >= 0),
    image_url TEXT DEFAULT '',
    file_path TEXT DEFAULT '', -- Path inside private Supabase Storage bucket
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 3. ORDERS TABLE (Customer Purchases)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_number TEXT NOT NULL UNIQUE,
    total_amount_paise BIGINT NOT NULL CHECK (total_amount_paise >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    razorpay_order_id TEXT UNIQUE,
    razorpay_payment_id TEXT UNIQUE,
    payment_method TEXT DEFAULT 'Razorpay',
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'partially_refunded', 'refunded')),
    refunded_amount_paise BIGINT NOT NULL DEFAULT 0 CHECK (refunded_amount_paise >= 0),
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    paid_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_purchased_at ON public.orders(purchased_at DESC);

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 4. ORDER_ITEMS TABLE (Snapshot of Purchased Items)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price_paise BIGINT NOT NULL CHECK (unit_price_paise >= 0),
    total_price_paise BIGINT NOT NULL CHECK (total_price_paise >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- =============================================================================
-- 5. PAYMENT_EVENTS TABLE (Razorpay Webhook Events & Idempotency)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL DEFAULT 'razorpay',
    provider_event_id TEXT NOT NULL UNIQUE,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    event_type TEXT NOT NULL,
    processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed', 'ignored')),
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payment_events_provider_event_id ON public.payment_events(provider_event_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_order_id ON public.payment_events(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_payment_id ON public.payment_events(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_created_at ON public.payment_events(created_at DESC);

-- =============================================================================
-- 6. REFUNDS TABLE (Refund Tracking)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    razorpay_refund_id TEXT UNIQUE,
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('pending', 'processed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON public.refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_razorpay_refund_id ON public.refunds(razorpay_refund_id);
CREATE INDEX IF NOT EXISTS idx_refunds_created_at ON public.refunds(created_at DESC);

-- =============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Security Model:
-- - Customers can read/update only their own profile.
-- - Customers can read only their own orders and order items.
-- - Customers cannot update payment statuses or create fake paid orders.
-- - Admins can read/manage all records.
-- - Service role can perform all trusted operations.
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- PROFILES POLICIES ---
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        -- Prevent customer from changing their role to admin
        AND (role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR public.is_admin())
    );

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- Allow initial insert from signup trigger (security definer) or authenticated user
DROP POLICY IF EXISTS "Allow insert on registration" ON public.profiles;
CREATE POLICY "Allow insert on registration"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id OR public.is_admin());

-- --- PRODUCTS POLICIES ---
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products"
    ON public.products FOR SELECT
    USING (status = 'active' OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
    ON public.products FOR ALL
    USING (public.is_admin());

-- --- ORDERS POLICIES ---
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Customers can create pending orders" ON public.orders;
CREATE POLICY "Customers can create pending orders"
    ON public.orders FOR INSERT
    WITH CHECK (
        (auth.uid() = user_id AND payment_status = 'pending')
        OR public.is_admin()
    );

-- Only admins or server-side service role can update order payment status
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
    ON public.orders FOR UPDATE
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders"
    ON public.orders FOR DELETE
    USING (public.is_admin());

-- --- ORDER_ITEMS POLICIES ---
DROP POLICY IF EXISTS "Customers can view own order items" ON public.order_items;
CREATE POLICY "Customers can view own order items"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;
CREATE POLICY "Admins can manage order items"
    ON public.order_items FOR ALL
    USING (public.is_admin());

-- --- PAYMENT_EVENTS POLICIES ---
DROP POLICY IF EXISTS "Admins can view payment events" ON public.payment_events;
CREATE POLICY "Admins can view payment events"
    ON public.payment_events FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage payment events" ON public.payment_events;
CREATE POLICY "Admins can manage payment events"
    ON public.payment_events FOR ALL
    USING (public.is_admin());

-- --- REFUNDS POLICIES ---
DROP POLICY IF EXISTS "Customers can view own refunds" ON public.refunds;
CREATE POLICY "Customers can view own refunds"
    ON public.refunds FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = refunds.order_id
            AND orders.user_id = auth.uid()
        )
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Admins can manage refunds" ON public.refunds;
CREATE POLICY "Admins can manage refunds"
    ON public.refunds FOR ALL
    USING (public.is_admin());

-- =============================================================================
-- 8. STORAGE BUCKET CONFIGURATION & POLICIES
-- Bucket: 'digital-downloads' (Private)
-- Paid customers receive short-lived signed URLs generated server-side.
-- =============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('digital-downloads', 'digital-downloads', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Admins have full access to digital-downloads
DROP POLICY IF EXISTS "Admins have full access to digital-downloads" ON storage.objects;
CREATE POLICY "Admins have full access to digital-downloads"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'digital-downloads' AND public.is_admin());

-- =============================================================================
-- 9. INITIAL SEED DATA (Flagship Ebook / Digital Product)
-- =============================================================================
INSERT INTO public.products (id, name, description, price_paise, image_url, file_path, status)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'AI Income Mastery: Complete Blueprint',
    '7 Full Modules, Master Prompt Library, Cold Pitch Script Database, and Automation Workflows for building high-ticket income using modern AI.',
    129900, -- ₹1,299.00
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    'ebooks/ai-income-mastery-blueprint.pdf',
    'active'
)
ON CONFLICT (id) DO NOTHING;

