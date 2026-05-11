-- ============================================
-- CALL SYSTEM - SAFE RUN
-- Run in Supabase SQL Editor
-- ============================================

-- Just create table
CREATE TABLE IF NOT EXISTS public.call_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    call_type TEXT NOT NULL CHECK (call_type IN ('voice', 'video')),
    status TEXT DEFAULT 'calling',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add to realtime  
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_notifications;

-- Verify
SELECT * FROM public.call_notifications LIMIT 1;