-- ============================================
-- FIX ALL MISSING COLUMNS
-- Run in Supabase SQL Editor
-- ============================================

-- Fix users table columns (ADD all missing)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_photo TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'available';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS online BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

-- Ensure email column exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;

-- Verify columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' ORDER BY ordinal_position;

-- Fix RLS policies
DROP POLICY IF EXISTS "users_read" ON public.users;
CREATE POLICY "users_read" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "users_insert" ON public.users;
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "users_update" ON public.users;
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;

SELECT '✓ All fixes applied!' as result;