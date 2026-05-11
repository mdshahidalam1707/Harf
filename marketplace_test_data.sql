-- ============================================
-- HARF MARKETPLACE - TEST DATA INJECTION
-- ============================================

DO $$ 
DECLARE 
    test_user_id UUID;
BEGIN
    -- 1. Get a valid user to act as recruiter/freelancer
    SELECT id INTO test_user_id FROM public.users LIMIT 1;

    IF test_user_id IS NOT NULL THEN
        -- 2. Insert a premium job posting (with safety for budget column)
        INSERT INTO public.jobs (
            recruiter_id,
            title,
            company_name,
            description,
            requirements,
            skills_required,
            salary_range,
            location,
            type,
            work_mode,
            status
        ) VALUES (
            test_user_id,
            'Senior React Developer',
            'Harf Tech Solutions',
            'We are looking for a Senior React Developer to join our core team. You will be responsible for building high-performance professional tools using React, TailwindCSS, and Supabase.',
            ARRAY['5+ years of React experience', 'Strong understanding of TypeScript', 'Experience with real-time systems'],
            ARRAY['React', 'TypeScript', 'Supabase', 'TailwindCSS'],
            '$120,000 - $160,000',
            'Remote',
            'full-time',
            'remote',
            'open'
        );

        -- Fix for legacy columns if they exist and are still causing issues
        -- (Only update poster_id, budget is handled by Schema Repair)
        UPDATE public.jobs SET poster_id = test_user_id WHERE title = 'Senior React Developer' AND poster_id IS NULL;

        -- 3. Insert a professional freelance service
        INSERT INTO public.freelance_services (
            freelancer_id,
            title,
            description,
            category,
            base_price,
            delivery_time,
            thumbnail_url,
            rating,
            review_count
        ) VALUES (
            test_user_id,
            'Premium UI/UX Design for SaaS Platforms',
            'I will design a high-converting, professional SaaS landing page or dashboard for your professional tool. Includes 3 revisions and source files.',
            'Design',
            499.00,
            '5 Days',
            'https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?w=800&auto=format&fit=crop&q=60',
            5.0,
            12
        );

        RAISE NOTICE 'Test data successfully injected for user %', test_user_id;
    ELSE
        RAISE NOTICE 'No users found. Please sign up first to run this test.';
    END IF;
END $$;
