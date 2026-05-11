-- Check all tables and their columns
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name IN ('users', 'profiles', 'chats', 'messages', 'chat_participants')
ORDER BY table_name, ordinal_position;