-- ============================================
-- VERIFY AND FIX DATABASE TABLES
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check if groups table exists and show its structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'groups' 
ORDER BY ordinal_position;

-- 2. If groups table doesn't have chat_id, recreate it properly
-- Drop existing groups table if it exists (be careful - this deletes data)
-- DROP TABLE IF EXISTS public.groups;

-- Create groups table with correct schema
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID UNIQUE NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    group_name TEXT NOT NULL,
    group_icon TEXT,
    admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_groups_chat_id ON public.groups(chat_id);
CREATE INDEX IF NOT EXISTS idx_groups_admin_id ON public.groups(admin_id);

-- 3. Enable RLS on groups if not enabled
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- 4. Add RLS policies for groups
DROP POLICY IF EXISTS "Users can view groups in their chats" ON public.groups;
CREATE POLICY "Users can view groups in their chats" ON public.groups
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.chat_participants
        WHERE chat_participants.chat_id = groups.chat_id
        AND chat_participants.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
CREATE POLICY "Users can create groups" ON public.groups
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Group admins can update groups" ON public.groups;
CREATE POLICY "Group admins can update groups" ON public.groups
FOR UPDATE USING (auth.uid() = admin_id);

-- 5. Verify users table has all required columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 6. Test group creation (should work after this)
-- SELECT * FROM public.groups LIMIT 1;