-- DDL script for Scan History & Comparison feature
-- Copy and paste this into the Supabase SQL Editor to initialize these tables.

-- 1. Scan Sessions Table
CREATE TABLE IF NOT EXISTS public.scan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id VARCHAR(255) UNIQUE NOT NULL,
  repo_name VARCHAR(255) NOT NULL,
  repo_path TEXT,
  total_files INTEGER DEFAULT 0,
  total_routes INTEGER DEFAULT 0,
  health_score INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'completed',
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on scan_sessions
ALTER TABLE public.scan_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scan sessions" ON public.scan_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan sessions" ON public.scan_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scan sessions" ON public.scan_sessions
    FOR DELETE USING (auth.uid() = user_id);


-- 2. Scan Snapshots Table
CREATE TABLE IF NOT EXISTS public.scan_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.scan_sessions(id) ON DELETE CASCADE,
  architecture JSONB,
  graph JSONB,
  static_analysis JSONB,
  files JSONB,
  routes JSONB,
  dependencies JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on scan_snapshots
ALTER TABLE public.scan_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scan snapshots" ON public.scan_snapshots
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.scan_sessions
        WHERE public.scan_sessions.id = session_id AND public.scan_sessions.user_id = auth.uid()
      )
    );

CREATE POLICY "Users can insert own scan snapshots" ON public.scan_snapshots
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.scan_sessions
        WHERE public.scan_sessions.id = session_id AND public.scan_sessions.user_id = auth.uid()
      )
    );


-- 3. Scan Comparisons Table
CREATE TABLE IF NOT EXISTS public.scan_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baseline_scan_id UUID NOT NULL REFERENCES public.scan_sessions(id) ON DELETE CASCADE,
  compare_scan_id UUID NOT NULL REFERENCES public.scan_sessions(id) ON DELETE CASCADE,
  diff_report JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(baseline_scan_id, compare_scan_id)
);

-- Enable RLS on scan_comparisons
ALTER TABLE public.scan_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own comparisons" ON public.scan_comparisons
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own comparisons" ON public.scan_comparisons
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comparisons" ON public.scan_comparisons
    FOR DELETE USING (auth.uid() = user_id);


-- 4. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_scan_sessions_user_id ON public.scan_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_job_id ON public.scan_sessions(job_id);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_scanned_at ON public.scan_sessions(scanned_at);
CREATE INDEX IF NOT EXISTS idx_scan_snapshots_session_id ON public.scan_snapshots(session_id);
CREATE INDEX IF NOT EXISTS idx_scan_comparisons_user_id ON public.scan_comparisons(user_id);
-- ============================================================
-- 5. Admin Scan Deletion & Soft Delete (Run this section last)
--    Idempotent - safe to run multiple times.
-- ============================================================

-- ── 5a. Add soft-delete columns to scan_sessions ─────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'scan_sessions' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.scan_sessions ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'scan_sessions' AND column_name = 'deleted_by'
  ) THEN
    ALTER TABLE public.scan_sessions ADD COLUMN deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index for soft-delete queries
CREATE INDEX IF NOT EXISTS idx_scan_sessions_deleted_at ON public.scan_sessions(deleted_at);

-- ── 5b. Profiles table (user roles: USER / ADMIN) ──────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
  );

-- Auto-create a profile row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'USER')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── 5c. Scan session soft-delete RLS policies ──────────────
-- Replace the original "read own" SELECT policy with one that
-- hides soft-deleted scans from normal users.
DROP POLICY IF EXISTS "Users can read own scan sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Users can view their own non-deleted scans" ON public.scan_sessions;
CREATE POLICY "Users can view their own non-deleted scans" ON public.scan_sessions
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Admins can view all scans (including soft-deleted)
DROP POLICY IF EXISTS "Admins can view all scans" ON public.scan_sessions;
CREATE POLICY "Admins can view all scans" ON public.scan_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
  );

-- Admins can soft-delete any scan
DROP POLICY IF EXISTS "Admins can soft delete any scan" ON public.scan_sessions;
CREATE POLICY "Admins can soft delete any scan" ON public.scan_sessions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
  ) WITH CHECK (deleted_at IS NOT NULL);
