-- ============================================
-- FIX MISSING COLUMNS (SIMPLE)
-- Run in Supabase SQL Editor
-- ============================================

-- Fix users table columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_photo TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'available';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS online BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;

-- Fix RLS policies
DROP POLICY IF EXISTS "users_read" ON public.users;
CREATE POLICY "users_read" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "users_insert" ON public.users;
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "users_update" ON public.users;
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (auth.uid() = id);

SELECT '✓ Columns and RLS fixed!' as result;