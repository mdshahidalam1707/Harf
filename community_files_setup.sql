-- ============================================
-- HARF COMMUNITY FILE SHARING SETUP
-- ============================================

-- 1. COMMUNITY FILES TABLE
CREATE TABLE IF NOT EXISTS public.community_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
    uploader_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. RLS POLICIES
ALTER TABLE public.community_files ENABLE ROW LEVEL SECURITY;

-- Visibility: Members can see files
DROP POLICY IF EXISTS "Members can see community files" ON public.community_files;
CREATE POLICY "Members can see community files"
ON public.community_files FOR SELECT
USING (public.is_member(community_id));

-- Upload: Members can upload files
DROP POLICY IF EXISTS "Members can upload community files" ON public.community_files;
CREATE POLICY "Members can upload community files"
ON public.community_files FOR INSERT
WITH CHECK (public.is_member(community_id) AND auth.uid() = uploader_id);

-- Management: Uploader or Admin can delete
DROP POLICY IF EXISTS "Uploaders/Admins can delete files" ON public.community_files;
CREATE POLICY "Uploaders/Admins can delete files"
ON public.community_files FOR DELETE
USING (
    auth.uid() = uploader_id 
    OR 
    EXISTS (
        SELECT 1 FROM public.community_members 
        WHERE community_id = public.community_files.community_id 
        AND user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_community_files_community ON public.community_files(community_id);
CREATE INDEX IF NOT EXISTS idx_community_files_uploader ON public.community_files(uploader_id);
