-- ============================================
-- SUPABASE DATABASE SCHEMA FOR CHAT APPLICATION
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- Go to: Supabase Dashboard > SQL Editor > New Query
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE (Public Profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    username TEXT,
    email TEXT UNIQUE NOT NULL,
    profile_photo TEXT,
    about TEXT DEFAULT 'Hey there! I am using ChatConnect',
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    online BOOLEAN DEFAULT FALSE,
    bio TEXT,
    profession TEXT,
    skills TEXT[] DEFAULT '{}',
    availability TEXT DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_users_online ON public.users(online);
CREATE INDEX idx_users_email ON public.users(email);

-- ============================================
-- 2. CHATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    is_group BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_chats_updated_at ON public.chats(updated_at DESC);

-- ============================================
-- 3. CHAT_PARTICIPANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    unread_count INTEGER DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chat_id, user_id)
);

-- Indexes for faster queries
CREATE INDEX idx_chat_participants_chat_id ON public.chat_participants(chat_id);
CREATE INDEX idx_chat_participants_user_id ON public.chat_participants(user_id);
CREATE INDEX idx_chat_participants_unread ON public.chat_participants(unread_count);

-- ============================================
-- 4. MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file')),
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'seen')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_messages_chat_id ON public.messages(chat_id, created_at DESC);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_status ON public.messages(status);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- ============================================
-- 5. GROUPS TABLE (Optional - for group metadata)
-- ============================================
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID UNIQUE NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    group_name TEXT NOT NULL,
    group_icon TEXT,
    admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_groups_chat_id ON public.groups(chat_id);
CREATE INDEX idx_groups_admin_id ON public.groups(admin_id);

-- ============================================
-- 5A. REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reviewer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reviewed_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_reviews_reviewed_user_id ON public.reviews(reviewed_user_id);
CREATE INDEX idx_reviews_reviewer_id ON public.reviews(reviewer_id);

-- ============================================
-- 5B. TYPING STATUS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.typing_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    typing BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, chat_id)
);

-- Index for faster queries
CREATE INDEX idx_typing_status_chat_id ON public.typing_status(chat_id);
CREATE INDEX idx_typing_status_user_id ON public.typing_status(user_id);

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
-- Users can view all other users (for search/discovery)
CREATE POLICY "Users can view all profiles"
    ON public.users FOR SELECT
    USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- CHATS POLICIES
-- Users can view chats they are participants of
CREATE POLICY "Users can view their chats"
    ON public.chats FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE chat_participants.chat_id = chats.id
            AND chat_participants.user_id = auth.uid()
        )
    );

-- Users can create chats
CREATE POLICY "Users can create chats"
    ON public.chats FOR INSERT
    WITH CHECK (true);

-- CHAT_PARTICIPANTS POLICIES
-- Users can view participants of chats they are in
CREATE POLICY "Users can view chat participants"
    ON public.chat_participants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants cp
            WHERE cp.chat_id = chat_participants.chat_id
            AND cp.user_id = auth.uid()
        )
    );

-- Users can add participants to chats they are in
CREATE POLICY "Users can add chat participants"
    ON public.chat_participants FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_participants cp
            WHERE cp.chat_id = chat_participants.chat_id
            AND cp.user_id = auth.uid()
        )
    );

-- Users can update their own participant record (unread count)
CREATE POLICY "Users can update own participant record"
    ON public.chat_participants FOR UPDATE
    USING (user_id = auth.uid());

-- MESSAGES POLICIES
-- Users can view messages in chats they are participants of
CREATE POLICY "Users can view messages in their chats"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE chat_participants.chat_id = messages.chat_id
            AND chat_participants.user_id = auth.uid()
        )
    );

-- Users can send messages to chats they are participants of
CREATE POLICY "Users can send messages to their chats"
    ON public.messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE chat_participants.chat_id = messages.chat_id
            AND chat_participants.user_id = auth.uid()
        )
    );

-- Users can update messages they sent (for status updates)
CREATE POLICY "Users can update own messages"
    ON public.messages FOR UPDATE
    USING (sender_id = auth.uid());

-- GROUPS POLICIES
-- Users can view groups they are part of
CREATE POLICY "Users can view their groups"
    ON public.groups FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE chat_participants.chat_id = groups.chat_id
            AND chat_participants.user_id = auth.uid()
        )
    );

-- Users can create groups
CREATE POLICY "Users can create groups"
    ON public.groups FOR INSERT
    WITH CHECK (admin_id = auth.uid());

-- Only group admin can update group
CREATE POLICY "Admin can update group"
    ON public.groups FOR UPDATE
    USING (admin_id = auth.uid());

-- REVIEWS POLICIES
-- Users can view all reviews
CREATE POLICY "Users can view all reviews"
    ON public.reviews FOR SELECT
    USING (true);

-- Users can create reviews (only for other users, not themselves)
CREATE POLICY "Users can create reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (reviewer_id = auth.uid() AND reviewed_user_id != auth.uid());

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
    ON public.reviews FOR UPDATE
    USING (reviewer_id = auth.uid());

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
    ON public.reviews FOR DELETE
    USING (reviewer_id = auth.uid());

-- ============================================
-- 7. FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update chat's updated_at timestamp when new message is sent
CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chats
    SET updated_at = NEW.created_at
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update chat timestamp
CREATE TRIGGER trigger_update_chat_timestamp
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_timestamp();

-- Function to increment unread count for participants
CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment unread count for all participants except the sender
    UPDATE public.chat_participants
    SET unread_count = unread_count + 1
    WHERE chat_id = NEW.chat_id
    AND user_id != NEW.sender_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment unread count
CREATE TRIGGER trigger_increment_unread_count
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION increment_unread_count();

-- Function to auto-create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 8. ENABLE REALTIME
-- ============================================
-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime for chat_participants (for unread counts)
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;

-- Enable realtime for users (for online status)
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- ============================================
-- 9. STORAGE BUCKET FOR PROFILE PHOTOS
-- ============================================
-- Run this in Supabase Dashboard > Storage
-- Create a bucket named 'profile-photos' with public access

-- Storage policy (add via Supabase Dashboard or SQL)
-- Allow users to upload their own profile photos
-- Allow everyone to view profile photos

-- ============================================
-- SCHEMA COMPLETE
-- ============================================
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Create storage bucket 'profile-photos' in Storage section
-- 3. Set up storage policies for profile photos
-- 4. Your database is ready!
-- ============================================
