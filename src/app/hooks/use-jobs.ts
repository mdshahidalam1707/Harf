import { useState, useEffect, useCallback } from 'react';
import { supabase, User } from '@/lib/supabase';

export interface Job {
  id: string;
  recruiter_id: string;
  title: string;
  company_name: string;
  company_logo: string;
  description: string;
  requirements: string[];
  skills_required: string[];
  salary_range: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'freelance';
  work_mode: 'remote' | 'on-site' | 'hybrid';
  status: 'open' | 'closed' | 'paused';
  created_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  resume_url: string;
  cover_letter: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
  created_at: string;
  applicant?: {
    name: string;
    email: string;
    profile_photo: string;
    profession: string;
  };
  job?: Job;
}

export function useJobs(userId?: string) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);

      // Fetch my applications if userId is provided
      if (userId) {
        const { data: appsData, error: appsError } = await supabase
          .from('job_applications')
          .select('*, job:jobs(*)')
          .eq('applicant_id', userId)
          .order('created_at', { ascending: false });
        
        if (!appsError) setMyApplications(appsData || []);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const postJob = async (jobData: Partial<Job>) => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert({ ...jobData, recruiter_id: userId })
        .select()
        .single();

      if (error) throw error;
      fetchJobs();
      return data;
    } catch (err) {
      console.error('Error posting job:', err);
      throw err;
    }
  };

  const applyToJob = async (jobId: string, resumeUrl: string, coverLetter: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          applicant_id: userId,
          resume_url: resumeUrl,
          cover_letter: coverLetter
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error applying to job:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, myApplications, loading, postJob, applyToJob, refresh: fetchJobs };
}

export function useRecruiterDashboard(recruiterId: string) {
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      // Get my jobs
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .eq('recruiter_id', recruiterId)
        .order('created_at', { ascending: false });

      // Get applications for my jobs
      const { data: appsData } = await supabase
        .from('job_applications')
        .select('*, applicant:users(name, email, profile_photo, profession), job:jobs(*)')
        .in('job_id', jobsData?.map(j => j.id) || []);

      setMyJobs(jobsData || []);
      setApplications(appsData || []);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [recruiterId]);

  const updateApplicationStatus = async (appId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('id', appId);
      
      if (error) throw error;
      loadDashboard();
    } catch (err) {
      console.error('Error updating status:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return { myJobs, applications, loading, updateApplicationStatus, refresh: loadDashboard };
}
