-- ============================================
-- FIX RLS POLICIES - Run in Supabase SQL Editor
-- ============================================

-- Fix chat_participants policies
DROP POLICY IF EXISTS "Users can join chats" ON chat_participants;
CREATE POLICY "Users can join chats" ON chat_participants
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view participants in their chats" ON chat_participants;
CREATE POLICY "Users can view participants in their chats" ON chat_participants
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM chat_participants cp
        WHERE cp.chat_id = chat_participants.chat_id
        AND cp.user_id = auth.uid()
    )
);

-- Fix messages policies
DROP POLICY IF EXISTS "Users can view messages in their chats" ON messages;
CREATE POLICY "Users can view messages in their chats" ON messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM chat_participants
        WHERE chat_participants.chat_id = messages.chat_id
        AND chat_participants.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "Users can insert messages" ON messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Fix groups policies
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

-- Verify policies
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;