-- ============================================
-- HARF REALTIME NOTIFICATION SYSTEM EXPANSION
-- ============================================

-- 1. ENSURE NOTIFICATIONS TABLE EXISTS AND HAS ALL TYPES
-- Types: 'like', 'comment', 'follow', 'connection_request', 'connection_accepted', 'message', 'missed_call'

-- We can use a check constraint to enforce types if desired, but flexible text is often better for expansion
-- ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
-- ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('like', 'comment', 'follow', 'connection_request', 'connection_accepted', 'message', 'missed_call'));

-- 2. ADD SOURCE_ID TO NOTIFICATIONS
-- source_id helps link to the specific post, comment, or chat
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS source_id UUID;

-- 3. ENHANCED INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_unread ON public.notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- 4. CLEANUP FUNCTION (Scalability)
-- Automatically delete notifications older than 30 days
CREATE OR REPLACE FUNCTION clean_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM public.notifications WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 5. REALTIME (Ensure it's enabled for notifications)
-- Already handled in network_setup.sql, but ensuring here
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
