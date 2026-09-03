-- ==============================================================================
-- HELIX / PROJECT ANALYSER - COMPREHENSIVE DATABASE MIGRATION V2
-- This script migrates all static/hardcoded features to database-driven tables.
-- Run this in the Supabase SQL Editor.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. SUBSCRIPTION PLANS TABLE (subscription_plans)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id TEXT PRIMARY KEY, -- 'free', 'pro', 'enterprise'
    name TEXT NOT NULL,
    monthly_scan_limit INT NOT NULL, -- -1 for unlimited
    rate_limit_per_min INT NOT NULL DEFAULT 150,
    price_usd NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    features JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on subscription_plans" ON public.subscription_plans;
CREATE POLICY "Allow public read on subscription_plans"
ON public.subscription_plans FOR SELECT TO public, anon, authenticated, service_role
USING (true);

-- Seed Default Subscription Plans
INSERT INTO public.subscription_plans (id, name, monthly_scan_limit, rate_limit_per_min, price_usd, features)
VALUES
    ('free', 'Free Starter', 2, 60, 0.00, '["2 repository scans/mo", "Basic dependency graph", "Community support"]'::jsonb),
    ('pro', 'Professional', 50, 300, 29.00, '["50 repository scans/mo", "Full interactive subway map", "AI Codebase Q&A", "Architecture diffing", "Priority email support"]'::jsonb),
    ('enterprise', 'Enterprise Unlimited', -1, 1000, 199.00, '["Unlimited repository scans", "Deep static analysis & AST parsing", "Custom framework rules", "Team collaboration & org admin", "Dedicated Slack support", "24/7 SLA"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    monthly_scan_limit = EXCLUDED.monthly_scan_limit,
    rate_limit_per_min = EXCLUDED.rate_limit_per_min,
    price_usd = EXCLUDED.price_usd,
    features = EXCLUDED.features,
    updated_at = NOW();

-- ==============================================================================
-- 2. HELIX PROFILES UPDATES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.helix_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    plan TEXT NOT NULL DEFAULT 'free',
    plan_id TEXT REFERENCES public.subscription_plans(id) DEFAULT 'free',
    scan_limit INT DEFAULT 2,
    scans_used INT DEFAULT 0,
    scan_limit_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW() + INTERVAL '14 days'),
    subscription_status TEXT DEFAULT 'active' NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure all columns exist on helix_profiles if table was already created
ALTER TABLE public.helix_profiles ADD COLUMN IF NOT EXISTS plan_id TEXT REFERENCES public.subscription_plans(id) DEFAULT 'free';
ALTER TABLE public.helix_profiles ADD COLUMN IF NOT EXISTS scan_limit INT DEFAULT 2;
ALTER TABLE public.helix_profiles ADD COLUMN IF NOT EXISTS scans_used INT DEFAULT 0;
ALTER TABLE public.helix_profiles ADD COLUMN IF NOT EXISTS scan_limit_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days');
ALTER TABLE public.helix_profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.helix_profiles ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.helix_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.helix_profiles;
CREATE POLICY "Users can read own profile" ON public.helix_profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.helix_profiles;
CREATE POLICY "Admins can view all profiles" ON public.helix_profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.helix_profiles WHERE id = auth.uid() AND (role = 'org_admin' OR role = 'admin'))
);

DROP POLICY IF EXISTS "Users can update own profile" ON public.helix_profiles;
CREATE POLICY "Users can update own profile" ON public.helix_profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role full access on helix_profiles" ON public.helix_profiles;
CREATE POLICY "Service role full access on helix_profiles" ON public.helix_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ==============================================================================
-- 3. SCAN SESSIONS & SNAPSHOTS (Full Job History in DB)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.scan_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    job_id TEXT NOT NULL UNIQUE,
    repo_name TEXT NOT NULL,
    repo_path TEXT,
    total_files INT DEFAULT 0,
    total_routes INT DEFAULT 0,
    health_score NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'completed',
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_scan_sessions_user_id ON public.scan_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_job_id ON public.scan_sessions(job_id);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_scanned_at ON public.scan_sessions(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_deleted_at ON public.scan_sessions(deleted_at);

ALTER TABLE public.scan_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read scan_sessions" ON public.scan_sessions;
CREATE POLICY "Allow read scan_sessions" ON public.scan_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write scan_sessions" ON public.scan_sessions;
CREATE POLICY "Allow write scan_sessions" ON public.scan_sessions FOR ALL TO public, anon, authenticated, service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.scan_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.scan_sessions(id) ON DELETE CASCADE,
    architecture JSONB DEFAULT '{}'::jsonb,
    graph JSONB DEFAULT '{}'::jsonb,
    static_analysis JSONB DEFAULT '{}'::jsonb,
    files JSONB DEFAULT '[]'::jsonb,
    routes JSONB DEFAULT '[]'::jsonb,
    dependencies JSONB DEFAULT '[]'::jsonb,
    env_vars JSONB DEFAULT '[]'::jsonb,
    features JSONB DEFAULT '[]'::jsonb,
    ai_summary JSONB DEFAULT NULL,
    onboarding JSONB DEFAULT NULL,
    tree JSONB DEFAULT NULL,
    frameworks JSONB DEFAULT '[]'::jsonb,
    graph_issues JSONB DEFAULT '[]'::jsonb,
    subway JSONB DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.scan_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read scan_snapshots" ON public.scan_snapshots;
CREATE POLICY "Allow read scan_snapshots" ON public.scan_snapshots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write scan_snapshots" ON public.scan_snapshots;
CREATE POLICY "Allow write scan_snapshots" ON public.scan_snapshots FOR ALL TO public, anon, authenticated, service_role USING (true) WITH CHECK (true);

-- ==============================================================================
-- 4. EMAIL TEMPLATES TABLE (email_templates)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.email_templates (
    template_key TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read email_templates" ON public.email_templates;
CREATE POLICY "Allow read email_templates" ON public.email_templates FOR SELECT TO public, anon, authenticated, service_role USING (true);

-- Seed Default Email Templates
INSERT INTO public.email_templates (template_key, subject, description, html_body)
VALUES
(
    'otp_verification',
    'Verify your email - {{appName}}',
    'Email OTP verification code sent upon registration or login',
    '<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0f172a;color:#f8fafc;padding:30px;"><div style="max-width:560px;margin:0 auto;background:#1e293b;border-radius:12px;padding:32px;border:1px solid #334155;"><h2 style="color:#38bdf8;margin-bottom:16px;">Verify Your Email</h2><p style="color:#94a3b8;font-size:15px;line-height:1.5;">Use the one-time verification code below to verify your account in {{appName}}:</p><div style="background:#0f172a;padding:20px;border-radius:8px;text-align:center;margin:24px 0;letter-spacing:8px;font-size:32px;font-weight:bold;color:#38bdf8;border:1px dashed #0284c7;">{{otp}}</div><p style="color:#64748b;font-size:13px;">This code will expire in {{expiryMinutes}} minutes. If you did not request this code, you can safely ignore this email.</p></div></body></html>'
),
(
    'welcome',
    'Welcome to {{appName}}!',
    'Welcome email sent after initial email verification',
    '<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0f172a;color:#f8fafc;padding:30px;"><div style="max-width:560px;margin:0 auto;background:#1e293b;border-radius:12px;padding:32px;border:1px solid #334155;"><h2 style="color:#38bdf8;margin-bottom:16px;">Welcome aboard!</h2><p style="color:#94a3b8;font-size:15px;line-height:1.5;">Your email is verified. You can now analyze repositories, visualize architecture subway maps, trace execution flows, and run AI codebase diagnostics.</p><div style="margin:28px 0;"><a href="{{dashboardUrl}}" style="background:#0284c7;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Open Dashboard</a></div></div></body></html>'
),
(
    'password_reset',
    'Password Reset Request - {{appName}}',
    'Email containing reset link or OTP for account password recovery',
    '<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0f172a;color:#f8fafc;padding:30px;"><div style="max-width:560px;margin:0 auto;background:#1e293b;border-radius:12px;padding:32px;border:1px solid #334155;"><h2 style="color:#38bdf8;margin-bottom:16px;">Reset Your Password</h2><p style="color:#94a3b8;font-size:15px;line-height:1.5;">We received a request to reset your password. Use the following code:</p><div style="background:#0f172a;padding:20px;border-radius:8px;text-align:center;margin:24px 0;letter-spacing:8px;font-size:32px;font-weight:bold;color:#f59e0b;border:1px dashed #d97706;">{{otp}}</div><p style="color:#64748b;font-size:13px;">If you did not request a password reset, please secure your account immediately.</p></div></body></html>'
),
(
    'scan_completed',
    'Repository Scan Completed: {{repoName}}',
    'Notification sent when background analysis finishes',
    '<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0f172a;color:#f8fafc;padding:30px;"><div style="max-width:560px;margin:0 auto;background:#1e293b;border-radius:12px;padding:32px;border:1px solid #334155;"><h2 style="color:#38bdf8;margin-bottom:16px;">Scan Completed Successfully</h2><p style="color:#94a3b8;font-size:15px;line-height:1.5;">Analysis for <strong>{{repoName}}</strong> is finished. {{totalFiles}} files and {{totalRoutes}} routes detected with health score <strong>{{healthScore}}/100</strong>.</p><div style="margin:28px 0;"><a href="{{reportUrl}}" style="background:#0284c7;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">View Analysis Report</a></div></div></body></html>'
)
ON CONFLICT (template_key) DO UPDATE SET
    subject = EXCLUDED.subject,
    html_body = EXCLUDED.html_body,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ==============================================================================
-- 5. DETECTION RULES CATALOG (detection_rules)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.detection_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- 'orm', 'database', 'framework', 'secret_pattern', 'connection_trigger'
    name TEXT NOT NULL,
    patterns JSONB NOT NULL,
    version TEXT DEFAULT '1.0.0',
    enabled BOOLEAN DEFAULT true,
    priority INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.detection_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read detection_rules" ON public.detection_rules;
CREATE POLICY "Allow read detection_rules" ON public.detection_rules FOR SELECT TO public, anon, authenticated, service_role USING (true);

-- Seed Initial Detection Rules
INSERT INTO public.detection_rules (category, name, patterns, priority)
VALUES
    ('orm', 'Prisma', '{"packages": ["@prisma/client"], "triggers": ["new PrismaClient"]}'::jsonb, 10),
    ('orm', 'Mongoose', '{"packages": ["mongoose"], "triggers": ["mongoose.connect", "mongoose.createConnection"]}'::jsonb, 10),
    ('orm', 'Drizzle', '{"packages": ["drizzle-orm"], "triggers": ["drizzle"]}'::jsonb, 10),
    ('orm', 'Sequelize', '{"packages": ["sequelize"], "triggers": ["new Sequelize"]}'::jsonb, 10),
    ('orm', 'TypeORM', '{"packages": ["typeorm"], "triggers": ["new DataSource", "createConnection"]}'::jsonb, 10),
    ('orm', 'Supabase', '{"packages": ["@supabase/supabase-js"], "triggers": ["createClient"]}'::jsonb, 10),
    ('orm', 'Firebase', '{"packages": ["firebase", "firebase-admin"], "triggers": ["initializeApp", "getFirestore"]}'::jsonb, 10),
    ('database', 'PostgreSQL', '{"packages": ["pg", "pg-promise", "postgres"]}'::jsonb, 5),
    ('database', 'MySQL', '{"packages": ["mysql2", "mysql"]}'::jsonb, 5),
    ('database', 'SQLite', '{"packages": ["sqlite3", "better-sqlite3"]}'::jsonb, 5),
    ('database', 'MongoDB', '{"packages": ["mongodb"]}'::jsonb, 5),
    ('database', 'Redis', '{"packages": ["ioredis", "redis"]}'::jsonb, 5),
    ('secret_pattern', 'API Key & Token Rules', '{"patterns": ["api[_-]?key", "secret", "password", "token", "private[_-]?key", "auth", "jwt[_-]?secret"]}'::jsonb, 1)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 6. SEED ADMIN ACCOUNT (admin@projectanalyser.com)
-- ==============================================================================
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
    '{"name": "System Administrator", "role": "org_admin"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
)
ON CONFLICT (id) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = NOW(),
    updated_at = NOW();

INSERT INTO public.helix_profiles (
    id,
    email,
    role,
    plan,
    plan_id,
    scan_limit,
    scans_used,
    subscription_status,
    email_verified,
    email_verified_at,
    created_at,
    updated_at
)
VALUES (
    '11111111-2222-3333-4444-444444444444',
    'admin@projectanalyser.com',
    'org_admin',
    'enterprise',
    'enterprise',
    -1,
    0,
    'active',
    TRUE,
    NOW(),
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    role = 'org_admin',
    plan = 'enterprise',
    plan_id = 'enterprise',
    scan_limit = -1,
    subscription_status = 'active',
    email_verified = TRUE,
    updated_at = NOW();
