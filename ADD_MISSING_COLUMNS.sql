-- ============================================
-- FIX MISSING COLUMNS IN USERS TABLE
-- Run in Supabase SQL Editor
-- ============================================

-- Add ALL missing columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_photo TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'available';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS online BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

-- Verify all columns now exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Show result message
SELECT '✓ All columns added successfully!' as result;