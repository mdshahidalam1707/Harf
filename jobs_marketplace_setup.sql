-- ============================================
-- HARF JOBS & FREELANCE MARKETPLACE - UNIVERSAL REPAIR & SETUP
-- ============================================

-- 1. JOBS TABLE & COLUMNS
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
);

-- Ensure all columns exist (Safely handles existing tables)
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS recruiter_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS company_logo TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS requirements TEXT[];
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS skills_required TEXT[];
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS salary_range TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('full-time', 'part-time', 'contract', 'freelance'));
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS work_mode TEXT CHECK (work_mode IN ('remote', 'on-site', 'hybrid'));
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'paused'));
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Repair: If legacy columns exist and are NOT NULL, make them NULLABLE to avoid errors
-- Also ensure budget is TEXT type if it exists as something else
DO $$ BEGIN
    ALTER TABLE public.jobs ALTER COLUMN budget DROP NOT NULL;
    ALTER TABLE public.jobs ALTER COLUMN budget TYPE TEXT USING budget::text;
EXCEPTION WHEN undefined_column THEN END $$;

DO $$ BEGIN
    ALTER TABLE public.jobs ALTER COLUMN poster_id DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN END $$;

-- 2. JOB APPLICATIONS
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
);

ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS applicant_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS cover_letter TEXT;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'hired'));
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Add unique constraint if not exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_job_applicant') THEN
        ALTER TABLE public.job_applications ADD CONSTRAINT unique_job_applicant UNIQUE(job_id, applicant_id);
    END IF;
END $$;

-- 3. FREELANCE SERVICES
CREATE TABLE IF NOT EXISTS public.freelance_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
);

ALTER TABLE public.freelance_services ADD COLUMN IF NOT EXISTS freelancer_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.freelance_services ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.freelance_services ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.freelance_services ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.freelance_services ADD COLUMN IF NOT EXISTS base_price DECIMAL;
ALTER TABLE public.freelance_services ADD COLUMN IF NOT EXISTS delivery_time TEXT;
ALTER TABLE public.freelance_services ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.freelance_services ADD COLUMN IF NOT EXISTS rating DECIMAL DEFAULT 0;
ALTER TABLE public.freelance_services ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE public.freelance_services ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.freelance_services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 4. SERVICE REVIEWS
CREATE TABLE IF NOT EXISTS public.service_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
);

ALTER TABLE public.service_reviews ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.freelance_services(id) ON DELETE CASCADE;
ALTER TABLE public.service_reviews ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.service_reviews ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE public.service_reviews ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE public.service_reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 5. POLICIES (Cleanup and Recreate)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freelance_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view open jobs" ON public.jobs;
DROP POLICY IF EXISTS "Recruiters can post jobs" ON public.jobs;
DROP POLICY IF EXISTS "Recruiters can update their jobs" ON public.jobs;
DROP POLICY IF EXISTS "Applicants can view their applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can apply to jobs" ON public.job_applications;
DROP POLICY IF EXISTS "Recruiters can update application status" ON public.job_applications;
DROP POLICY IF EXISTS "Anyone can view services" ON public.freelance_services;
DROP POLICY IF EXISTS "Freelancers can manage their services" ON public.freelance_services;
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.service_reviews;
DROP POLICY IF EXISTS "Buyers can leave reviews" ON public.service_reviews;

CREATE POLICY "Anyone can view open jobs" ON public.jobs FOR SELECT USING (status = 'open' OR recruiter_id = auth.uid());
CREATE POLICY "Recruiters can post jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = recruiter_id);
CREATE POLICY "Recruiters can update their jobs" ON public.jobs FOR UPDATE USING (auth.uid() = recruiter_id);

CREATE POLICY "Applicants can view their applications" ON public.job_applications FOR SELECT USING (applicant_id = auth.uid() OR EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND recruiter_id = auth.uid()));
CREATE POLICY "Users can apply to jobs" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Recruiters can update application status" ON public.job_applications FOR UPDATE USING (EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND recruiter_id = auth.uid()));

CREATE POLICY "Anyone can view services" ON public.freelance_services FOR SELECT USING (true);
CREATE POLICY "Freelancers can manage their services" ON public.freelance_services FOR ALL USING (freelancer_id = auth.uid());

CREATE POLICY "Anyone can view reviews" ON public.service_reviews FOR SELECT USING (true);
CREATE POLICY "Buyers can leave reviews" ON public.service_reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter ON public.jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_services_freelancer ON public.freelance_services(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.freelance_services(category);
