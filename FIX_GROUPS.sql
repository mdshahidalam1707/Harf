-- ============================================
-- FIX GROUPS TABLE - Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop group_members table first (it depends on groups)
DROP TABLE IF EXISTS group_members CASCADE;

-- Step 2: Now drop groups table
DROP TABLE IF EXISTS groups;

-- Step 3: Recreate groups table with correct columns
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID UNIQUE NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    group_icon TEXT,
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_groups_chat_id ON groups(chat_id);
CREATE INDEX IF NOT EXISTS idx_groups_admin_id ON groups(admin_id);

-- Step 5: Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Step 6: Add policies
DROP POLICY IF EXISTS "Users can view groups in their chats" ON groups;
CREATE POLICY "Users can view groups in their chats" ON groups
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM chat_participants
        WHERE chat_participants.chat_id = groups.chat_id
        AND chat_participants.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can create groups" ON groups;
CREATE POLICY "Users can create groups" ON groups
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Group admins can update groups" ON groups;
CREATE POLICY "Group admins can update groups" ON groups
FOR UPDATE USING (auth.uid() = admin_id);

-- Verify the table
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'groups' ORDER BY ordinal_position;