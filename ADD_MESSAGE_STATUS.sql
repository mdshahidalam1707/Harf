-- ============================================
-- ADD MESSAGE STATUS - Run in Supabase SQL Editor
-- ============================================

-- Step 1: Add status column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';

-- Step 2: Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'messages' AND column_name = 'status';

-- Step 3: Update existing messages to have 'sent' status
UPDATE messages SET status = 'sent' WHERE status IS NULL;

-- Step 4: Verify RLS policies allow status updates
-- (Should work with existing policies since we're updating messages in our chats)