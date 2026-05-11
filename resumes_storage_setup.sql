-- ============================================
-- HARF STORAGE SETUP - RESUMES BUCKET
-- ============================================

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policies for Storage
-- Allow anyone to upload a resume (applicants)
CREATE POLICY "Anyone can upload a resume"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'resumes');

-- Allow authenticated users to view resumes (recruiters)
CREATE POLICY "Authenticated users can view resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'resumes');

-- Allow users to delete their own resumes
CREATE POLICY "Users can delete their own resumes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
