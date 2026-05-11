-- ============================================
-- HARF PRODUCTION OPTIMIZATION & SECURITY
-- ============================================

-- 1. PERFORMANCE INDEXES
-- Optimizes message retrieval and chat listing
CREATE INDEX IF NOT EXISTS idx_messages_chat_id_created_at ON public.messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_unread ON public.notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);

-- 2. SECURITY HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_chat_participant(chat_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.chat_participants 
        WHERE chat_id = chat_uuid AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ENHANCED RLS POLICIES
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
CREATE POLICY "Participants can view messages" ON public.messages
    FOR SELECT USING (is_chat_participant(chat_id));

DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages" ON public.messages
    FOR INSERT WITH CHECK (is_chat_participant(chat_id) AND sender_id = auth.uid());

-- 4. RATE LIMITING (SPAM PREVENTION)
-- Simple rate limit for job applications
CREATE TABLE IF NOT EXISTS public.rate_limits (
    user_id UUID REFERENCES auth.users(id),
    action TEXT,
    last_action_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, action)
);

CREATE OR REPLACE FUNCTION check_rate_limit(target_action TEXT, limit_seconds INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    last_time TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT last_action_at INTO last_time FROM public.rate_limits 
    WHERE user_id = auth.uid() AND action = target_action;

    IF last_time IS NOT NULL AND (NOW() - last_time) < (limit_seconds * INTERVAL '1 second') THEN
        RETURN FALSE;
    END IF;

    INSERT INTO public.rate_limits (user_id, action, last_action_at)
    VALUES (auth.uid(), target_action, NOW())
    ON CONFLICT (user_id, action) DO UPDATE SET last_action_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. REPORTING & BLOCKING SYSTEM
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES auth.users(id),
    reported_user_id UUID REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.blocked_users (
    blocker_id UUID REFERENCES auth.users(id),
    blocked_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id)
);

-- Policy to hide blocked users' messages
CREATE OR REPLACE FUNCTION is_not_blocked(sender_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM public.blocked_users 
        WHERE blocker_id = auth.uid() AND blocked_id = sender_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
