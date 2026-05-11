-- ============================================
-- FIX RLS POLICIES - Run in Supabase SQL Editor
-- ============================================

-- Step 1: Allow all operations on chat_participants
DROP POLICY IF EXISTS "chat_participants_all" ON public.chat_participants;
CREATE POLICY "chat_participants_all" ON public.chat_participants
FOR ALL USING (true) WITH CHECK (true);

-- Step 2: Allow all operations on messages
DROP POLICY IF EXISTS "messages_all" ON public.messages;
CREATE POLICY "messages_all" ON public.messages
FOR ALL USING (true) WITH CHECK (true);

-- Step 3: Allow all operations on chats
DROP POLICY IF EXISTS "chats_all" ON public.chats;
CREATE POLICY "chats_all" ON public.chats
FOR ALL USING (true) WITH CHECK (true);

-- Step 4: Allow all operations on users
DROP POLICY IF EXISTS "users_all" ON public.users;
CREATE POLICY "users_all" ON public.users
FOR ALL USING (true) WITH CHECK (true);

-- Step 5: Allow all operations on groups
DROP POLICY IF EXISTS "groups_all" ON public.groups;
CREATE POLICY "groups_all" ON public.groups
FOR ALL USING (true) WITH CHECK (true);

-- Step 6: Verify tables exist
SELECT 
    'chat_participants' as table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'chat_participants') as columns
UNION ALL
SELECT 
    'messages',
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'messages')
UNION ALL
SELECT 
    'chats',
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'chats')
UNION ALL
SELECT 
    'users',
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users')
UNION ALL
SELECT 
    'groups',
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'groups');

SELECT '✓ RLS policies fixed!' as result;