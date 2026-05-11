import { useState, useEffect, useCallback } from 'react';
import { supabase, User, Post } from '@/lib/supabase';
import { useDebounce } from '@/app/hooks/use-debounce';

export interface SearchFilters {
  profession?: string;
  skills?: string[];
  company?: string;
  timeframe?: 'today' | 'week' | 'month' | 'all';
}

export function useSearch(initialType: 'users' | 'posts' = 'users') {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'users' | 'posts'>(initialType);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<SearchFilters>({});
  const PAGE_SIZE = 12;

  const debouncedQuery = useDebounce(query, 500);

  const performSearch = useCallback(async (searchQuery: string, searchType: 'users' | 'posts', pageNum: number, isNewSearch: boolean, currentFilters: SearchFilters) => {
    if (!searchQuery.trim() && Object.keys(currentFilters).length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let data, error;

      if (searchType === 'users') {
        let q = supabase.from('users').select('*');
        
        if (searchQuery.trim()) {
          q = q.or(`name.ilike.%${searchQuery}%,profession.ilike.%${searchQuery}%,headline.ilike.%${searchQuery}%,skills.cs.{${searchQuery}}`);
        }
        
        if (currentFilters.profession) {
          q = q.ilike('profession', `%${currentFilters.profession}%`);
        }
        if (currentFilters.company) {
          q = q.ilike('company', `%${currentFilters.company}%`);
        }
        if (currentFilters.skills && currentFilters.skills.length > 0) {
          q = q.contains('skills', currentFilters.skills);
        }

        const { data: users, error: userError } = await q.range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);
        data = users;
        error = userError;
      } else {
        let q = supabase.from('posts').select('*, user:users(*)');
        
        if (searchQuery.trim()) {
          q = q.ilike('content', `%${searchQuery}%`);
        }

        if (currentFilters.timeframe && currentFilters.timeframe !== 'all') {
          const now = new Date();
          let startDate = new Date();
          if (currentFilters.timeframe === 'today') startDate.setHours(0, 0, 0, 0);
          if (currentFilters.timeframe === 'week') startDate.setDate(now.getDate() - 7);
          if (currentFilters.timeframe === 'month') startDate.setMonth(now.getMonth() - 1);
          q = q.gte('created_at', startDate.toISOString());
        }

        const { data: posts, error: postError } = await q
          .order('created_at', { ascending: false })
          .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);
        data = posts;
        error = postError;
      }

      if (error) throw error;

      if (isNewSearch) {
        setResults(data || []);
      } else {
        setResults(prev => [...prev, ...(data || [])]);
      }
      
      setHasMore((data?.length || 0) === PAGE_SIZE);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    performSearch(debouncedQuery, type, 0, true, filters);
  }, [debouncedQuery, type, filters, performSearch]);

  const loadMore = () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    performSearch(debouncedQuery, type, nextPage, false, filters);
  };

  return {
    query,
    setQuery,
    type,
    setType,
    results,
    loading,
    hasMore,
    loadMore,
    filters,
    setFilters
  };
}
