-- ============================================
-- HARF MARKETPLACE NOTIFICATION TRIGGERS
-- ============================================

-- Function to notify recruiter when someone applies for a job
CREATE OR REPLACE FUNCTION notify_recruiter_on_application()
RETURNS TRIGGER AS $$
DECLARE
    recruiter_id UUID;
    job_title TEXT;
    applicant_name TEXT;
BEGIN
    -- Get recruiter_id and job title
    SELECT poster_id, title INTO recruiter_id, job_title 
    FROM public.jobs 
    WHERE id = NEW.job_id;

    -- Get applicant name
    SELECT name INTO applicant_name 
    FROM public.users 
    WHERE id = NEW.applicant_id;

    -- Insert notification for recruiter
    INSERT INTO public.notifications (user_id, type, sender_id, source_id, data)
    VALUES (
        recruiter_id,
        'job_application',
        NEW.applicant_id,
        NEW.job_id,
        jsonb_build_object(
            'job_title', job_title,
            'applicant_name', applicant_name,
            'message', 'applied for your job posting'
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for job applications
DROP TRIGGER IF EXISTS tr_notify_recruiter_on_application ON public.job_applications;
CREATE TRIGGER tr_notify_recruiter_on_application
AFTER INSERT ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION notify_recruiter_on_application();


-- Function to notify applicant when status changes
CREATE OR REPLACE FUNCTION notify_applicant_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
    job_title TEXT;
BEGIN
    -- Only notify if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Get job title
        SELECT title INTO job_title 
        FROM public.jobs 
        WHERE id = NEW.job_id;

        -- Insert notification for applicant
        INSERT INTO public.notifications (user_id, type, source_id, data)
        VALUES (
            NEW.applicant_id,
            'application_update',
            NEW.job_id,
            jsonb_build_object(
                'job_title', job_title,
                'status', NEW.status,
                'message', 'Your application status for ' || job_title || ' has been updated to ' || NEW.status
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for application status updates
DROP TRIGGER IF EXISTS tr_notify_applicant_on_status_change ON public.job_applications;
CREATE TRIGGER tr_notify_applicant_on_status_change
AFTER UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION notify_applicant_on_status_change();
