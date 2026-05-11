-- ============================================
-- CALL SYSTEM DATABASE SETUP
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create table (if not exists)
CREATE TABLE IF NOT EXISTS public.call_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    call_type TEXT NOT NULL CHECK (call_type IN ('voice', 'video')),
    status TEXT DEFAULT 'calling' CHECK (status IN ('calling', 'accepted', 'rejected', 'ended')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes (if not exists)
CREATE INDEX IF NOT EXISTS idx_call_notifications_receiver ON public.call_notifications(receiver_id);
CREATE INDEX IF NOT EXISTS idx_call_notifications_caller ON public.call_notifications(caller_id);

-- Step 3: Enable RLS (if not enabled)
ALTER TABLE public.call_notifications ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies (drop first if exists, then create)
DROP POLICY IF EXISTS "Users can view call notifications" ON public.call_notifications;
DROP POLICY IF EXISTS "Users can insert call notifications" ON public.call_notifications;
DROP POLICY IF EXISTS "Users can update call notifications" ON public.call_notifications;

CREATE POLICY "Users can view call notifications" ON public.call_notifications
FOR SELECT USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert call notifications" ON public.call_notifications
FOR INSERT WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update call notifications" ON public.call_notifications
FOR UPDATE USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Step 5: Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_notifications;

-- Verify
SELECT '✓ Call system setup complete!' as result;