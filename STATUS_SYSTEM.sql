-- ============================================
-- HARF STATUS (STORIES) SYSTEM
-- ============================================

-- 1. CREATE STATUSES TABLE
CREATE TABLE IF NOT EXISTS public.statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT,
    media_url TEXT,
    media_type TEXT DEFAULT 'image' CHECK (media_type IN ('text', 'image', 'video')),
    background_color TEXT, -- For text-only statuses
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES
-- Anyone can view statuses from users they are connected to or following
-- For simplicity in this version, we'll allow all authenticated users to view
CREATE POLICY "Anyone can view statuses" ON public.statuses
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage their own statuses" ON public.statuses
    FOR ALL USING (auth.uid() = user_id);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_statuses_user_id ON public.statuses(user_id);
CREATE INDEX IF NOT EXISTS idx_statuses_created_at ON public.statuses(created_at DESC);

-- 5. REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.statuses;

-- 6. HELPER VIEW (Optional, but useful for filtering 24h)
-- We'll handle the 24h filter in the query/frontend for now to keep it simple.
