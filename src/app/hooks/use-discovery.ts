import { useState, useEffect } from 'react';
import { supabase, User, Post } from '@/lib/supabase';

export function useDiscovery(currentUserId: string) {
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiscovery();
  }, [currentUserId]);

  const loadDiscovery = async () => {
    setLoading(true);
    try {
      // Load suggested users via RPC
      const { data: suggestions, error: suggestionError } = await supabase
        .rpc('suggest_users', { current_user_id: currentUserId, limit_val: 8 });

      if (suggestionError) console.error('Error loading suggestions:', suggestionError);
      else setSuggestedUsers(suggestions || []);

      // Load trending posts via RPC
      const { data: trending, error: trendingError } = await supabase
        .rpc('get_trending_posts', { limit_val: 10 });

      if (trendingError) console.error('Error loading trending:', trendingError);
      else setTrendingPosts(trending || []);

    } catch (err) {
      console.error('Discovery error:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    suggestedUsers,
    trendingPosts,
    loading,
    refresh: loadDiscovery
  };
}
