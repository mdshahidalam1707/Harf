-- ============================================
-- HARF PROFESSIONAL NETWORK SYSTEM SETUP
-- ============================================

-- 1. UPDATE USERS TABLE
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS headline TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT;

-- 2. CREATE CONNECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(requester_id, receiver_id)
);

-- 3. CREATE FOLLOWS TABLE
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- 4. CREATE NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'connection_request', 'connection_accepted', 'new_follower'
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ENABLE RLS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES
-- Connections: Users can view their own, manage their own
CREATE POLICY "Users can view their own connections" ON public.connections
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can manage their own connection requests" ON public.connections
    FOR ALL USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Follows: Anyone can view, only follower can manage
CREATE POLICY "Anyone can view follows" ON public.follows
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own follows" ON public.follows
    FOR ALL USING (auth.uid() = follower_id);

-- Notifications: Only recipient can view/update
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 7. FUNCTIONS
-- Get mutual connections count or list
CREATE OR REPLACE FUNCTION get_mutual_connections(user_a UUID, user_b UUID)
RETURNS SETOF public.users AS $$
BEGIN
    RETURN QUERY
    SELECT u.*
    FROM public.users u
    WHERE u.id IN (
        (SELECT friend_id FROM public.connections WHERE user_id = user_a AND status = 'accepted'
         UNION
         SELECT user_id FROM public.connections WHERE friend_id = user_a AND status = 'accepted')
        INTERSECT
        (SELECT friend_id FROM public.connections WHERE user_id = user_b AND status = 'accepted'
         UNION
         SELECT user_id FROM public.connections WHERE friend_id = user_b AND status = 'accepted')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. ENABLE REALTIME
-- Check if publication exists first (standard Supabase)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 9. INDEXES
CREATE INDEX IF NOT EXISTS idx_connections_requester_id ON public.connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_receiver_id ON public.connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON public.connections(status);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
