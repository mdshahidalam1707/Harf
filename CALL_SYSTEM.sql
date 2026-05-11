-- ============================================
-- CALL SYSTEM TABLE - Run in Supabase SQL Editor
-- ============================================

-- Create call_notifications table
CREATE TABLE IF NOT EXISTS public.call_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    call_type TEXT NOT NULL CHECK (call_type IN ('voice', 'video')),
    status TEXT DEFAULT 'calling' CHECK (status IN ('calling', 'accepted', 'rejected', 'ended')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_call_notifications_receiver ON public.call_notifications(receiver_id);
CREATE INDEX IF NOT EXISTS idx_call_notifications_caller ON public.call_notifications(caller_id);

-- Enable RLS
ALTER TABLE public.call_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view call notifications" ON public.call_notifications;
CREATE POLICY "Users can view call notifications" ON public.call_notifications
FOR SELECT USING (
    auth.uid() = caller_id OR auth.uid() = receiver_id
);

DROP POLICY IF EXISTS "Users can insert call notifications" ON public.call_notifications;
CREATE POLICY "Users can insert call notifications" ON public.call_notifications
FOR INSERT WITH CHECK (
    auth.uid() = caller_id
);

DROP POLICY IF EXISTS "Users can update call notifications" ON public.call_notifications;
CREATE POLICY "Users can update call notifications" ON public.call_notifications
FOR UPDATE USING (
    auth.uid() = caller_id OR auth.uid() = receiver_id
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_notifications;