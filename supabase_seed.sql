-- Database Seed script for Helix Admin User (admin@projectanalyser.com)
-- Run this in the Supabase SQL Editor to pre-feed the admin account into the database.

-- 1. Create or ensure pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Seed Admin User in Supabase Auth (auth.users)
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

-- 3. Seed Admin Profile in public.helix_profiles
INSERT INTO public.helix_profiles (
    id,
    email,
    role,
    plan,
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
    'active',
    TRUE,
    NOW(),
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    role = 'org_admin',
    plan = 'enterprise',
    subscription_status = 'active',
    email_verified = TRUE;

-- 4. Seed Admin Profile in public.profiles (if present)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        INSERT INTO public.profiles (
            id,
            email,
            role,
            email_verified,
            email_verified_at,
            created_at,
            updated_at
        )
        VALUES (
            '11111111-2222-3333-4444-444444444444',
            'admin@projectanalyser.com',
            'ADMIN',
            TRUE,
            NOW(),
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            role = 'ADMIN',
            email_verified = TRUE;
    END IF;
END $$;
