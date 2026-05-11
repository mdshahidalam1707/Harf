-- ============================================
-- HARF COMMUNITIES SYSTEM - MASTER SETUP (FINAL)
-- ============================================

-- 1. TABLES
CREATE TABLE IF NOT EXISTS public.communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    rules TEXT,
    type TEXT NOT NULL DEFAULT 'public' CHECK (type IN ('public', 'private')),
    creator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    icon_url TEXT,
    cover_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_members (
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (community_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    is_pinned BOOLEAN DEFAULT false,
    added_at TIMESTAMPTZ DEFAULT now()
);

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

-- 2. SECURITY HELPERS (SECURITY DEFINER to break RLS recursion)
CREATE OR REPLACE FUNCTION public.is_member(comm_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE community_id = comm_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin(comm_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE community_id = comm_id AND user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ENABLE RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_files ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES cleanup
DROP POLICY IF EXISTS "select_communities" ON public.communities;
DROP POLICY IF EXISTS "insert_communities" ON public.communities;
DROP POLICY IF EXISTS "update_communities" ON public.communities;
DROP POLICY IF EXISTS "delete_communities" ON public.communities;
DROP POLICY IF EXISTS "select_members" ON public.community_members;
DROP POLICY IF EXISTS "insert_members" ON public.community_members;
DROP POLICY IF EXISTS "update_members" ON public.community_members;
DROP POLICY IF EXISTS "delete_members" ON public.community_members;
DROP POLICY IF EXISTS "select_comm_posts" ON public.community_posts;
DROP POLICY IF EXISTS "insert_comm_posts" ON public.community_posts;
DROP POLICY IF EXISTS "select_comm_files" ON public.community_files;
DROP POLICY IF EXISTS "insert_comm_files" ON public.community_files;
DROP POLICY IF EXISTS "delete_comm_files" ON public.community_files;

-- Communities
CREATE POLICY "select_communities" ON public.communities FOR SELECT USING (type = 'public' OR creator_id = auth.uid() OR public.is_member(id));
CREATE POLICY "insert_communities" ON public.communities FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "update_communities" ON public.communities FOR UPDATE USING (creator_id = auth.uid() OR public.is_admin(id));
CREATE POLICY "delete_communities" ON public.communities FOR DELETE USING (creator_id = auth.uid());

-- Members
CREATE POLICY "select_members" ON public.community_members FOR SELECT USING (user_id = auth.uid() OR public.is_member(community_id));
CREATE POLICY "insert_members" ON public.community_members FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin(community_id));
CREATE POLICY "update_members" ON public.community_members FOR UPDATE USING (public.is_admin(community_id));
CREATE POLICY "delete_members" ON public.community_members FOR DELETE USING (user_id = auth.uid() OR public.is_admin(community_id));

-- Posts
CREATE POLICY "select_comm_posts" ON public.community_posts FOR SELECT USING (public.is_member(community_id));
CREATE POLICY "insert_comm_posts" ON public.community_posts FOR INSERT WITH CHECK (public.is_member(community_id));

-- Files
CREATE POLICY "select_comm_files" ON public.community_files FOR SELECT USING (public.is_member(community_id));
CREATE POLICY "insert_comm_files" ON public.community_files FOR INSERT WITH CHECK (public.is_member(community_id));
CREATE POLICY "delete_comm_files" ON public.community_files FOR DELETE USING (auth.uid() = uploader_id OR public.is_admin(community_id));

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_communities_slug ON public.communities(slug);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON public.community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_community ON public.community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_files_community ON public.community_files(community_id);
