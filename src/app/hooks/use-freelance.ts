import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface FreelanceService {
  id: string;
  freelancer_id: string;
  title: string;
  description: string;
  category: string;
  base_price: number;
  delivery_time: string;
  thumbnail_url: string;
  rating: number;
  review_count: number;
  created_at: string;
  freelancer?: {
    name: string;
    profile_photo: string;
    profession: string;
  };
}

export interface ServiceReview {
  id: string;
  service_id: string;
  reviewer_id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer?: {
    name: string;
    profile_photo: string;
  };
}

export function useFreelance(userId?: string) {
  const [services, setServices] = useState<FreelanceService[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = useCallback(async (category?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('freelance_services')
        .select('*, freelancer:users(name, profile_photo, profession)')
        .order('rating', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createService = async (serviceData: Partial<FreelanceService>) => {
    try {
      const { data, error } = await supabase
        .from('freelance_services')
        .insert({ ...serviceData, freelancer_id: userId })
        .select()
        .single();

      if (error) throw error;
      fetchServices();
      return data;
    } catch (err) {
      console.error('Error creating service:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return { services, loading, createService, refresh: fetchServices };
}
