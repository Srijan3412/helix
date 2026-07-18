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
