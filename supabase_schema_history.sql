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
