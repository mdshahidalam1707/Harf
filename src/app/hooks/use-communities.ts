import { useState, useEffect, useCallback } from 'react';
import { supabase, User, Post } from '@/lib/supabase';

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  rules: string;
  type: 'public' | 'private';
  creator_id: string;
  icon_url: string;
  cover_url: string;
  member_count?: number;
  user_role?: 'admin' | 'moderator' | 'member' | null;
  created_at: string;
}

export interface CommunityMember {
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  user: {
    id: string;
    name: string;
    profile_photo: string;
    profession: string;
  };
}

export interface CommunityFile {
  id: string;
  community_id: string;
  uploader_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  description: string;
  created_at: string;
  uploader?: {
    name: string;
    profile_photo: string;
  };
}

export function useCommunities(currentUserId: string) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCommunities = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          member_count: community_members(count),
          user_membership: community_members(role)
        `)
        .eq('community_members.user_id', currentUserId);

      if (error) throw error;
      
      const formatted = data.map((c: any) => ({
        ...c,
        member_count: c.member_count?.[0]?.count || 0,
        user_role: c.user_membership?.[0]?.role || null
      }));

      setCommunities(formatted);
    } catch (err) {
      console.error('Error loading communities:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadCommunities();
  }, [loadCommunities]);

  const joinCommunity = async (communityId: string) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .insert({ community_id: communityId, user_id: currentUserId, role: 'member' });
      
      if (error) throw error;
      loadCommunities();
    } catch (err) {
      console.error('Join error:', err);
      throw err;
    }
  };

  const leaveCommunity = async (communityId: string) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', currentUserId);
      
      if (error) throw error;
      loadCommunities();
    } catch (err) {
      console.error('Leave error:', err);
      throw err;
    }
  };

  const deleteCommunity = async (communityId: string) => {
    try {
      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', communityId);
      
      if (error) throw error;
      loadCommunities();
    } catch (err) {
      console.error('Delete error:', err);
      alert(`Error deleting community: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    }
  };

  const createCommunity = async (params: Partial<Community>) => {
    try {
      const slug = params.name?.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
      
      const { data: newComm, error: commError } = await supabase
        .from('communities')
        .insert({
          ...params,
          slug,
          creator_id: currentUserId
        })
        .select()
        .single();

      if (commError) throw commError;

      // Add creator as admin
      const { error: memError } = await supabase
        .from('community_members')
        .insert({
          community_id: newComm.id,
          user_id: currentUserId,
          role: 'admin'
        });

      if (memError) throw memError;
      
      loadCommunities();
      return newComm;
    } catch (err) {
      console.error('Create community error:', err);
      throw err;
    }
  };

  return { communities, loading, joinCommunity, leaveCommunity, createCommunity, deleteCommunity, refresh: loadCommunities };
}

export function useCommunityDetails(communityId: string, currentUserId?: string) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [files, setFiles] = useState<CommunityFile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDetails = useCallback(async () => {
    if (!communityId) return;
    setLoading(true);
    try {
      // 1. Load Community Info
      const { data: communityData, error: commError } = await supabase
        .from('communities')
        .select('*')
        .eq('id', communityId)
        .single();
      
      if (commError) throw commError;

      // 2. Load Community Feed
      const { data: commPosts, error: postError } = await supabase
        .from('community_posts')
        .select(`
          is_pinned,
          post:posts(
            *,
            user:users(*)
          )
        `)
        .eq('community_id', communityId)
        .order('is_pinned', { ascending: false })
        .order('added_at', { ascending: false });

      if (postError) throw postError;
      const postsData = commPosts.map((cp: any) => ({ ...cp.post, is_pinned: cp.is_pinned }));

      // 3. Load Members
      const { data: membersData, error: memError } = await supabase
        .from('community_members')
        .select(`
          user_id,
          role,
          joined_at,
          user:users(*)
        `)
        .eq('community_id', communityId);
      
      if (memError) throw memError;

      const formattedMembers = (membersData || []).map((m: any) => ({
        ...m,
        user: Array.isArray(m.user) ? m.user[0] : m.user
      })) as CommunityMember[];

      // Fetch files
      const { data: filesData } = await supabase
        .from('community_files')
        .select('*, uploader:users(name, profile_photo)')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

      setCommunity(communityData);
      setPosts(postsData || []);
      setMembers(formattedMembers);
      setFiles(filesData || []);
    } catch (err) {
      console.error('Error loading community details:', err);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const addMember = async (userId: string, role: 'admin' | 'moderator' | 'member' = 'member') => {
    try {
      const { error } = await supabase
        .from('community_members')
        .insert({ community_id: communityId, user_id: userId, role });
      if (error) throw error;
      loadDetails();
    } catch (err) {
      console.error('Add member error:', err);
      throw err;
    }
  };

  const updateMemberRole = async (userId: string, newRole: 'admin' | 'moderator' | 'member') => {
    try {
      const { error } = await supabase
        .from('community_members')
        .update({ role: newRole })
        .eq('community_id', communityId)
        .eq('user_id', userId);
      if (error) throw error;
      loadDetails();
    } catch (err) {
      console.error('Update role error:', err);
      throw err;
    }
  };

  const kickMember = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', userId);
      if (error) throw error;
      loadDetails();
    } catch (err) {
      console.error('Kick member error:', err);
      throw err;
    }
  };

  const deleteCommunityPost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('community_id', communityId)
        .eq('post_id', postId);
      if (error) throw error;
      loadDetails();
    } catch (err) {
      console.error('Delete post error:', err);
      throw err;
    }
  };

  const uploadFile = async (file: File, description: string = '') => {
    try {
      if (!currentUserId) throw new Error('Not authenticated');

      // 1. Upload to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${communityId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('community-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('community-assets')
        .getPublicUrl(filePath);

      // 3. Save to DB
      const { error: dbError } = await supabase
        .from('community_files')
        .insert({
          community_id: communityId,
          uploader_id: currentUserId,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          description
        });

      if (dbError) throw dbError;
      loadDetails();
    } catch (err) {
      console.error('Upload file error:', err);
      throw err;
    }
  };

  const deleteFile = async (fileId: string, fileUrl: string) => {
    try {
      // Extract path from URL
      const path = fileUrl.split('community-assets/').pop();
      if (path) {
        await supabase.storage.from('community-assets').remove([path]);
      }

      const { error } = await supabase
        .from('community_files')
        .delete()
        .eq('id', fileId);
      
      if (error) throw error;
      loadDetails();
    } catch (err) {
      console.error('Delete file error:', err);
      throw err;
    }
  };

  return { 
    community, 
    posts, 
    members, 
    files,
    loading, 
    addMember, 
    updateMemberRole, 
    kickMember,
    deleteCommunityPost,
    uploadFile,
    deleteFile,
    refresh: loadDetails 
  };
}
