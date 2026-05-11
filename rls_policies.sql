-- ============================================
-- COMPLETE RLS POLICIES FOR CHAT APP
-- ============================================
-- Run this in Supabase SQL Editor AFTER creating tables
-- ============================================

-- Enable RLS on tables
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER SETTINGS TABLE (for notifications, dark mode, etc.)
-- ============================================

-- Create user_settings table if not exists
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notifications BOOLEAN DEFAULT true,
    message_sound BOOLEAN DEFAULT true,
    dark_mode BOOLEAN DEFAULT false,
    blocked_contacts UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own settings
CREATE POLICY "Users can view own settings" ON user_settings
FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can update their own settings
CREATE POLICY "Users can update own settings" ON user_settings
FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can insert their own settings
CREATE POLICY "Users can insert own settings" ON user_settings
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- MESSAGES POLICIES
-- ============================================

-- Allow authenticated users to insert messages
CREATE POLICY "Users can insert messages" ON messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Allow authenticated users to select messages from chats they participate in
CREATE POLICY "Users can view messages in their chats" ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.chat_id = messages.chat_id
    AND chat_participants.user_id = auth.uid()
  )
);

-- Allow authenticated users to update message status in their chats
CREATE POLICY "Users can update message status in their chats" ON messages
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.chat_id = messages.chat_id
    AND chat_participants.user_id = auth.uid()
  )
);

-- ============================================
-- USERS POLICIES
-- ============================================

-- Allow users to view all users (for search)
CREATE POLICY "Users can view all users" ON users
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile (during signup)
CREATE POLICY "Users can insert own profile" ON users
FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- CHATS POLICIES
-- ============================================

-- Allow authenticated users to view chats they participate in
CREATE POLICY "Users can view their chats" ON chats
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.chat_id = chats.id
    AND chat_participants.user_id = auth.uid()
  )
);

-- Allow authenticated users to create chats
CREATE POLICY "Users can create chats" ON chats
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update chats they participate in
CREATE POLICY "Users can update their chats" ON chats
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.chat_id = chats.id
    AND chat_participants.user_id = auth.uid()
  )
);

-- ============================================
-- CHAT_PARTICIPANTS POLICIES
-- ============================================

-- Allow users to view participants in chats they participate in
CREATE POLICY "Users can view participants in their chats" ON chat_participants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_participants cp
    WHERE cp.chat_id = chat_participants.chat_id
    AND cp.user_id = auth.uid()
  )
);

-- Allow users to join chats (insert participants)
CREATE POLICY "Users can join chats" ON chat_participants
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own participant records
CREATE POLICY "Users can update their participant records" ON chat_participants
FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- PROFILES POLICIES (if profiles table exists)
-- ============================================

-- Enable RLS on profiles table if it exists
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view all profiles (for search)
CREATE POLICY "Users can view all profiles" ON profiles
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile in profiles" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile (during signup)
CREATE POLICY "Users can insert own profile in profiles" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- GROUPS POLICIES
-- ============================================

-- Allow users to view groups for chats they participate in
CREATE POLICY "Users can view groups in their chats" ON groups
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.chat_id = groups.chat_id
    AND chat_participants.user_id = auth.uid()
  )
);

-- Allow authenticated users to create groups
CREATE POLICY "Users can create groups" ON groups
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow group admins to update their groups
CREATE POLICY "Group admins can update groups" ON groups
FOR UPDATE USING (auth.uid() = admin_id);

-- ============================================
-- STORAGE POLICIES FOR AVATARS BUCKET
-- ============================================

-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload avatar files
CREATE POLICY "Users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public to view avatar files
CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to update their own avatar files
CREATE POLICY "Users can update their avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ============================================

-- Function to update chat updated_at when messages are inserted
CREATE OR REPLACE FUNCTION update_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats SET updated_at = NOW() WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update chat timestamp when message is inserted
CREATE TRIGGER trigger_update_chat_updated_at
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_updated_at();

-- Function to update user last_seen when they go offline
CREATE OR REPLACE FUNCTION update_user_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.online = true AND NEW.online = false THEN
    NEW.last_seen = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user last_seen when online status changes
CREATE TRIGGER trigger_update_user_last_seen
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_seen();