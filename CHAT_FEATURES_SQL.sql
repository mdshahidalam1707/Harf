-- Add new columns to chats table
ALTER TABLE IF EXISTS public.chats 
ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- Add new columns to messages table
ALTER TABLE IF EXISTS public.messages 
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS starred boolean DEFAULT false;

-- Add muted column to chat_participants
ALTER TABLE IF EXISTS public.chat_participants 
ADD COLUMN IF NOT EXISTS muted boolean DEFAULT false;

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, blocked_user_id)
);

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT,
    chat_id UUID REFERENCES public.chats(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create starred_messages table
CREATE TABLE IF NOT EXISTS public.starred_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.starred_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for blocked_users
DROP POLICY IF EXISTS "Users can see their blocked users" ON public.blocked_users;
CREATE POLICY "Users can see their blocked users" ON public.blocked_users
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can block users" ON public.blocked_users;
CREATE POLICY "Users can block users" ON public.blocked_users
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unblock users" ON public.blocked_users;
CREATE POLICY "Users can unblock users" ON public.blocked_users
FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for reports
DROP POLICY IF EXISTS "Anyone can insert reports" ON public.reports;
CREATE POLICY "Anyone can insert reports" ON public.reports
FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view their reports" ON public.reports;
CREATE POLICY "Users can view their reports" ON public.reports
FOR SELECT USING (auth.uid() = reporter_id OR auth.uid() = reported_user_id);

-- Create RLS policies for starred_messages
DROP POLICY IF EXISTS "Users can star messages" ON public.starred_messages;
CREATE POLICY "Users can star messages" ON public.starred_messages
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view starred messages" ON public.starred_messages;
CREATE POLICY "Users can view starred messages" ON public.starred_messages
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unstar messages" ON public.starred_messages;
CREATE POLICY "Users can unstar messages" ON public.starred_messages
FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chats_pinned ON public.chats(pinned) WHERE pinned = true;
CREATE INDEX IF NOT EXISTS idx_chats_archived ON public.chats(archived) WHERE archived = true;
CREATE INDEX IF NOT EXISTS idx_messages_media ON public.messages(media_url) WHERE media_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_starred ON public.messages(starred) WHERE starred = true;

-- Verify tables created
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('blocked_users', 'reports', 'starred_messages');

SELECT 'Tables created successfully!' as result;