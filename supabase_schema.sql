-- DDL Schema script for Helix / projectAnalyser Subscriptions
-- Copy and paste this into the Supabase SQL Editor to initialize the database tables.

-- 1. Create Profiles Table (helix_profiles)
CREATE TABLE IF NOT EXISTS public.helix_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'trial',
    plan TEXT NOT NULL DEFAULT 'trial',
    trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW() + INTERVAL '14 days') NOT NULL,
    subscription_status TEXT DEFAULT 'trialing' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on Profiles
ALTER TABLE public.helix_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.helix_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.helix_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.helix_profiles
    FOR UPDATE USING (auth.uid() = id);


-- 2. Create Subscriptions Table (helix_subscriptions)
CREATE TABLE IF NOT EXISTS public.helix_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan TEXT NOT NULL,
    status TEXT NOT NULL,
    billing_cycle TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'usd' NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on Subscriptions
ALTER TABLE public.helix_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscriptions" ON public.helix_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.helix_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.helix_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);


-- 3. Create Usage Records Table (helix_usage_records)
CREATE TABLE IF NOT EXISTS public.helix_usage_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    repositories_analyzed INTEGER DEFAULT 0 NOT NULL,
    ai_chats INTEGER DEFAULT 0 NOT NULL,
    architecture_graphs INTEGER DEFAULT 0 NOT NULL,
    impact_reports INTEGER DEFAULT 0 NOT NULL,
    database_reports INTEGER DEFAULT 0 NOT NULL,
    exports INTEGER DEFAULT 0 NOT NULL,
    compare_reports INTEGER DEFAULT 0 NOT NULL,
    tokens_used INTEGER DEFAULT 0 NOT NULL,
    storage_used_mb NUMERIC DEFAULT 0.0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on Usage Records
ALTER TABLE public.helix_usage_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage records" ON public.helix_usage_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage records" ON public.helix_usage_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage records" ON public.helix_usage_records
    FOR UPDATE USING (auth.uid() = user_id);


-- 4. Create Payments Table (helix_payments)
CREATE TABLE IF NOT EXISTS public.helix_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    invoice_id TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'usd' NOT NULL,
    status TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on Payments
ALTER TABLE public.helix_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payments" ON public.helix_payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON public.helix_payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 5. Seed Default Admin Account (admin@projectanalyser.com)
-- Note: UUID '11111111-2222-3333-4444-444444444444' matches ADMIN_USER_ID used across frontend & backend

-- 5a. Seed into Supabase Auth Users
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud
)
VALUES (
    '11111111-2222-3333-4444-444444444444',
    '00000000-0000-0000-0000-000000000000',
    'admin@projectanalyser.com',
    crypt('Admin@Project2026!', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
)
ON CONFLICT (id) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = NOW(),
    updated_at = NOW();

-- 5b. Seed Profile for Admin in public.helix_profiles
INSERT INTO public.helix_profiles (
    id,
    email,
    role,
    plan,
    subscription_status,
    created_at,
    updated_at
)
VALUES (
    '11111111-2222-3333-4444-444444444444',
    'admin@projectanalyser.com',
    'org_admin',
    'enterprise',
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    role = 'org_admin',
    plan = 'enterprise',
    subscription_status = 'active';

-- 5c. Seed Profile for Admin in public.profiles (if profiles table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        INSERT INTO public.profiles (
            id,
            email,
            role,
            created_at,
            updated_at
        )
        VALUES (
            '11111111-2222-3333-4444-444444444444',
            'admin@projectanalyser.com',
            'ADMIN',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET role = 'ADMIN';
    END IF;
END $$;


-- 6. Email Verifications Table (email_verifications)
CREATE TABLE IF NOT EXISTS public.email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, email)
);

ALTER TABLE public.helix_profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.helix_profiles ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on email_verifications with fully permissive policy for all roles (anon, authenticated, service_role)
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role and users access email verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "Allow public access to email_verifications" ON public.email_verifications;

CREATE POLICY "Allow public access to email_verifications"
ON public.email_verifications
FOR ALL
TO public, anon, authenticated, service_role
USING (true)
WITH CHECK (true);


