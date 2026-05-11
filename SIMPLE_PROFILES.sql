-- ============================================
-- CREATE PROFILES TABLE
-- Run in Supabase SQL Editor
-- ============================================

-- Only create table (skip if exists)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
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

-- Check current profiles
SELECT 'Current profiles:' as info, COUNT(*) as total FROM public.profiles;