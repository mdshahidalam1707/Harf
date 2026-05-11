-- Add missing profile_photo column if not exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_photo TEXT;

-- Verify columns now exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name IN ('name', 'username', 'profile_photo', 'email', 'online')
ORDER BY column_name;