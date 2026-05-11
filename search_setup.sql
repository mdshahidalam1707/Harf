-- ============================================
-- HARF SEARCH & DISCOVERY SETUP (FIXED)
-- ============================================

-- 0. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. SEARCH INDEXES (Optimized for performance and compatibility)
-- Drop old problematic indexes if they exist
DROP INDEX IF EXISTS idx_users_search;
DROP INDEX IF EXISTS idx_posts_search;

-- For Users: Trigram indexes for fast "ilike" search on name, profession, and headline
CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON public.users USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_profession_trgm ON public.users USING gin (profession gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_headline_trgm ON public.users USING gin (headline gin_trgm_ops);

-- For Users: GIN index for fast skills array searching
CREATE INDEX IF NOT EXISTS idx_users_skills_gin ON public.users USING GIN (skills);

-- For Posts: Trigram index for fast content searching
CREATE INDEX IF NOT EXISTS idx_posts_content_trgm ON public.posts USING gin (content gin_trgm_ops);

-- 2. TRENDING POSTS FUNCTION
CREATE OR REPLACE FUNCTION get_trending_posts(limit_val INT DEFAULT 10, offset_val INT DEFAULT 0)
RETURNS SETOF public.posts AS $$
BEGIN
    RETURN QUERY
    SELECT p.*
    FROM public.posts p
    LEFT JOIN (
        SELECT post_id, COUNT(*) as likes_count FROM public.post_likes GROUP BY post_id
    ) l ON l.post_id = p.id
    LEFT JOIN (
        SELECT post_id, COUNT(*) as comments_count FROM public.post_comments GROUP BY post_id
    ) c ON c.post_id = p.id
    ORDER BY (
        (COALESCE(l.likes_count, 0) * 2 + COALESCE(c.comments_count, 0) * 5 + 1) / 
        POWER(EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600 + 2, 1.5)
    ) DESC
    LIMIT limit_val OFFSET offset_val;
END;
$$ LANGUAGE plpgsql;

-- 3. SUGGESTED USERS FUNCTION
CREATE OR REPLACE FUNCTION suggest_users(current_user_id UUID, limit_val INT DEFAULT 10)
RETURNS SETOF public.users AS $$
BEGIN
    RETURN QUERY
    WITH user_skills AS (
        SELECT skills FROM public.users WHERE id = current_user_id
    ),
    mutual_connections AS (
        SELECT 
            CASE WHEN requester_id = current_user_id THEN receiver_id ELSE requester_id END as connected_user_id
        FROM public.connections
        WHERE (requester_id = current_user_id OR receiver_id = current_user_id)
        AND status = 'accepted'
    )
    SELECT u.*
    FROM public.users u
    CROSS JOIN user_skills s
    WHERE u.id != current_user_id
    AND NOT EXISTS (
        SELECT 1 FROM public.connections c 
        WHERE (c.requester_id = current_user_id AND c.receiver_id = u.id)
        OR (c.requester_id = u.id AND c.receiver_id = current_user_id)
    )
    ORDER BY (
        -- Weight for mutual connections
        (SELECT COUNT(*) FROM public.connections c2 
         WHERE (c2.requester_id = u.id OR c2.receiver_id = u.id) 
         AND status = 'accepted' 
         AND (c2.requester_id IN (SELECT connected_user_id FROM mutual_connections) 
              OR c2.receiver_id IN (SELECT connected_user_id FROM mutual_connections))
        ) * 10 +
        -- Weight for common skills
        (SELECT COUNT(*) FROM (SELECT unnest(u.skills) intersect SELECT unnest(s.skills)) as common) * 5
    ) DESC
    LIMIT limit_val;
END;
$$ LANGUAGE plpgsql;
