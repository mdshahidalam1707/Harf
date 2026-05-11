-- ============================================
-- FIX RLS FOR USERS TABLE - Run in Supabase SQL
-- ============================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "users_all" ON public.users;
DROP POLICY IF EXISTS "users_read" ON public.users;

-- Create permissive read policy
CREATE POLICY "users_read" ON public.users
FOR SELECT USING (true);

-- Create insert policy
CREATE POLICY "users_insert" ON public.users
FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'authenticated');

-- Create update policy
CREATE POLICY "users_update" ON public.users
FOR UPDATE USING (auth.uid() = id);

-- Verify
SELECT '✓ RLS fixed for users table' as result;