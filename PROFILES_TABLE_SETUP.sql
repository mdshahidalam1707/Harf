-- ============================================
-- PROFILES TABLE SETUP
-- Run in Supabase SQL Editor
-- ============================================

-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    name TEXT,
    avatar_url TEXT,
    profession TEXT,
    skills TEXT,
    availability TEXT DEFAULT 'available',
    rating INTEGER DEFAULT 0,
    online BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

-- Create permissive policies
CREATE POLICY "profiles_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'authenticated');
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Add some test data (optional - removes existing first)
-- DELETE FROM public.profiles;

-- Insert sample profiles (replace with your actual user IDs as needed)
-- INSERT INTO public.profiles (id, username, name, profession, skills, availability, rating)
-- VALUES 
--   ('user-uuid-1', 'john_dev', 'John Developer', 'Developer', 'react,nodejs,javascript', 'available', 4),
--   ('user-uuid-2', 'jane_designer', 'Jane Designer', 'Designer', 'figma,ui,ux', 'hiring', 5),
--   ('user-uuid-3', 'bob_manager', 'Bob Manager', 'Manager', 'leadership,agile', 'busy', 3);

SELECT '✓ Profiles table ready!' as result;

-- Verify
SELECT COUNT(*) as total_profiles FROM public.profiles;