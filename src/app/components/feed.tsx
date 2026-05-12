import React, { useState, useEffect, useRef } from 'react';
import { supabase, User, Post, PostComment, Job, createNotification } from '../../lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Image as ImageIcon, Video, Heart, MessageSquare, Share2, X, Loader2, ThumbsUp, CornerDownRight, Briefcase, DollarSign, Send, UserPlus, UserCheck, Rss, Plus, Camera, ChevronLeft, ChevronRight, Play, Pause, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FeedProps {
  currentUser: User;
  onViewProfile?: (userId: string) => void;
  onStartChat?: (userId: string, initialMessage?: string) => void;
}

interface Status {
  id: string;
  user_id: string;
  content?: string;
  media_url?: string;
  media_type: 'text' | 'image' | 'video';
  background_color?: string;
  created_at: string;
  user?: User;
}

export function Feed({ currentUser, onViewProfile, onStartChat }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeTab, setActiveTab] = useState<'social' | 'jobs'>('social');
  const [loading, setLoading] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');

  // Media Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Interaction State
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [postComments, setPostComments] = useState<Record<string, PostComment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});

  // Connection & Follow State
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, 'pending' | 'accepted' | 'none'>>({});
  const [followStatuses, setFollowStatuses] = useState<Record<string, boolean>>({});
  const [processingAction, setProcessingAction] = useState<Record<string, boolean>>({});

  // Status State
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [activeStatusUser, setActiveStatusUser] = useState<string | null>(null);
  const [showStatusCreator, setShowStatusCreator] = useState(false);
  const [newStatusType, setNewStatusType] = useState<'text' | 'image' | 'video'>('image');

  // Advanced Interactions State
  const [replyingTo, setReplyingTo] = useState<{ postId: string, commentId: string, userName: string } | null>(null);
  const [showPostLikesModal, setShowPostLikesModal] = useState<string | null>(null);
  const [postLikesUsers, setPostLikesUsers] = useState<User[]>([]);
  const [loadingPostLikes, setLoadingPostLikes] = useState(false);
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);


  const handleViewPostLikes = async (postId: string) => {
    setShowPostLikesModal(postId);
    setLoadingPostLikes(true);
    try {
      const { data, error } = await supabase
        .from('post_likes')
        .select('user:users(*)')
        .eq('post_id', postId);
      if (error) throw error;
      setPostLikesUsers(data.map((d: any) => d.user));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPostLikes(false);
    }
  };

  const handleCommentLike = async (postId: string, commentId: string, currentlyLiked: boolean) => {
    // Optimistic update
    setPostComments(prev => {
      const postComms = prev[postId] || [];
      return {
        ...prev,
        [postId]: postComms.map(c =>
          c.id === commentId
            ? { ...c, has_liked: !currentlyLiked, likes_count: (c.likes_count || 0) + (currentlyLiked ? -1 : 1) }
            : c
        )
      };
    });

    try {
      if (currentlyLiked) {
        await supabase.from('comment_likes').delete().match({ comment_id: commentId, user_id: currentUser.id });
      } else {
        await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: currentUser.id });
      }
    } catch (e) {
      console.error('Error toggling comment like', e);
      loadComments(postId);
    }
  };

  useEffect(() => {
    loadPosts();
    loadJobs();
    loadStatuses();

    // Real-time subscription for jobs
    const jobsSubscription = supabase
      .channel('public:jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        loadJobs();
      })
      .subscribe();
    
    // Real-time subscription for statuses
    const statusSubscription = supabase
      .channel('public:statuses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'statuses' }, () => {
        loadStatuses();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(jobsSubscription);
      supabase.removeChannel(statusSubscription);
    };
  }, []);

  const loadStatuses = async () => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('statuses')
        .select('*, user:users(*)')
        .gt('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStatuses(data || []);
    } catch (error) {
      console.error('Error loading statuses:', error);
    } finally {
      setLoadingStatuses(false);
    }
  };

  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, poster:users(*)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(*),
          likes:post_likes(user_id),
          comments:post_comments(id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPosts = data?.map((post: any) => ({
        ...post,
        likes_count: post.likes?.length || 0,
        has_liked: post.likes?.some((like: any) => like.user_id === currentUser.id) || false,
        comments_count: post.comments?.length || 0
      })) || [];

      setPosts(formattedPosts);

      // Fetch connection and follow statuses for all users in posts
      if (formattedPosts.length > 0) {
        const authorIds = Array.from(new Set(formattedPosts.map(p => p.user_id)));
        
        // Load Connections
        const { data: connections } = await supabase
          .from('connections')
          .select('*')
          .or(`requester_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);
        
        const connMap: Record<string, 'pending' | 'accepted' | 'none'> = {};
        connections?.forEach((c: any) => {
          const otherId = c.requester_id === currentUser.id ? c.receiver_id : c.requester_id;
          connMap[otherId] = c.status;
        });
        setConnectionStatuses(connMap);

        // Load Follows
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUser.id);
        
        const followMap: Record<string, boolean> = {};
        follows?.forEach((f: any) => {
          followMap[f.following_id] = true;
        });
        setFollowStatuses(followMap);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (targetUserId: string) => {
    if (processingAction[targetUserId]) return;
    setProcessingAction(prev => ({ ...prev, [targetUserId]: true }));

    try {
      const currentStatus = connectionStatuses[targetUserId] || 'none';

      if (currentStatus === 'none') {
        const { error } = await supabase
          .from('connections')
          .insert({
            requester_id: currentUser.id,
            receiver_id: targetUserId,
            status: 'pending'
          });
        
        if (error) throw error;
        setConnectionStatuses(prev => ({ ...prev, [targetUserId]: 'pending' }));
        
        // Notify user
        createNotification(targetUserId, 'connection_request', currentUser.id, {
          sender_name: currentUser.name
        });
      }
    } catch (e) {
      console.error('Connection error:', e);
    } finally {
      setProcessingAction(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (processingAction[targetUserId]) return;
    setProcessingAction(prev => ({ ...prev, [targetUserId]: true }));

    try {
      const isFollowing = followStatuses[targetUserId];

      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .match({ follower_id: currentUser.id, following_id: targetUserId });
        setFollowStatuses(prev => ({ ...prev, [targetUserId]: false }));
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: currentUser.id, following_id: targetUserId });
        setFollowStatuses(prev => ({ ...prev, [targetUserId]: true }));
        
        // Notify user
        createNotification(targetUserId, 'new_follower', currentUser.id, {
          sender_name: currentUser.name
        });
      }
    } catch (e) {
      console.error('Follow error:', e);
    } finally {
      setProcessingAction(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !selectedFile) return;
    setIsUploading(true);

    try {
      let mediaUrl = '';
      let mediaType = '';

      // Handle File Upload if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `post-media/${fileName}`;

        mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'image';

        const { error: uploadError, data } = await supabase.storage
          .from('chat-media')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('chat-media')
          .getPublicUrl(filePath);

        mediaUrl = publicUrl;
      }

      // Insert post into database
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: currentUser.id,
          content: newPostContent,
          media_url: mediaUrl || null,
          media_type: mediaType || null
        });

      if (error) throw error;

      setNewPostContent('');
      clearSelectedFile();
      loadPosts();
    } catch (error: any) {
      console.error('Error creating post:', error);
      alert(`Failed to create post: ${error.message || 'Unknown error. Are RLS policies enabled correctly on the posts table?'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateJob = async (title: string, description: string, budget: number, skills: string[]) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .insert({
          title,
          description,
          budget,
          skills,
          poster_id: currentUser.id
        });

      if (error) throw error;
      
      setShowCreateJobModal(false);
      loadJobs();
    } catch (error: any) {
      console.error('Error creating bounty:', error);
      alert(`Failed to create bounty: ${error.message}`);
    }
  };

  const handleLike = async (postId: string, currentlyLiked: boolean) => {
    // Optimistic UI update
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          has_liked: !currentlyLiked,
          likes_count: (post.likes_count || 0) + (currentlyLiked ? -1 : 1)
        };
      }
      return post;
    }));

    try {
      if (currentlyLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .match({ post_id: postId, user_id: currentUser.id });
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: currentUser.id });
        
        // Trigger notification
        const post = posts.find(p => p.id === postId);
        if (post && post.user_id !== currentUser.id) {
          createNotification(post.user_id, 'like', currentUser.id, {}, postId);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      loadPosts(); // revert on error
    }
  };

  const handleCreateStatus = async (mediaUrl?: string, content?: string, type: 'text' | 'image' | 'video' = 'image') => {
    try {
      const { error } = await supabase
        .from('statuses')
        .insert({
          user_id: currentUser.id,
          content,
          media_url: mediaUrl,
          media_type: type,
          background_color: type === 'text' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : null
        });

      if (error) throw error;
      setShowStatusCreator(false);
      loadStatuses();
    } catch (error: any) {
      console.error('Error creating status:', error);
      alert(`Failed to create update: ${error.message}`);
    }
  };

  const groupedStatuses = statuses.reduce((acc, status) => {
    if (!acc[status.user_id]) {
      acc[status.user_id] = {
        user: status.user,
        items: []
      };
    }
    acc[status.user_id].items.push(status);
    return acc;
  }, {} as Record<string, { user?: User, items: Status[] }>);


  const toggleComments = async (postId: string) => {
    const isOpening = !openComments[postId];
    setOpenComments(prev => ({ ...prev, [postId]: isOpening }));

    // Re-load if opening and we either have no data or an empty list (to be safe)
    if (isOpening && (!postComments[postId] || postComments[postId].length === 0)) {
      loadComments(postId);
    }
  };

  const loadComments = async (postId: string) => {
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      // Simplifying query to test if the join is causing the 400 error
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          user:users (
            id,
            name,
            profile_photo,
            profession
          ),
          likes:comment_likes(user_id)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('SUPABASE COMMENT ERROR:', error);
        throw error;
      }

      const formattedComments = (data || []).map((comment: any) => ({
        ...comment,
        likes_count: comment.likes?.length || 0,
        has_liked: comment.likes?.some((like: any) => like.user_id === currentUser.id) || false
      }));
      setPostComments(prev => ({ ...prev, [postId]: formattedComments }));
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = newComment[postId]?.trim();
    if (!content) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: currentUser.id,
          content,
          parent_id: replyingTo?.postId === postId ? replyingTo.commentId : null
        });

      if (error) throw error;

      // Trigger notification
      const post = posts.find(p => p.id === postId);
      if (post && post.user_id !== currentUser.id) {
        createNotification(post.user_id, 'comment', currentUser.id, { content: content.substring(0, 50) }, postId);
      }

      // Optimistically update the local comments state
      const newCommentObj: PostComment = {
        id: Math.random().toString(36).substring(7),
        post_id: postId,
        user_id: currentUser.id,
        content: content,
        created_at: new Date().toISOString(),
        user: currentUser,
        likes_count: 0,
        has_liked: false,
        parent_id: replyingTo?.postId === postId ? replyingTo.commentId : undefined
      };

      setPostComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newCommentObj]
      }));

      setNewComment(prev => ({ ...prev, [postId]: '' }));
      if (replyingTo?.postId === postId) setReplyingTo(null);

      setPosts(posts.map(post =>
        post.id === postId
          ? { ...post, comments_count: (post.comments_count || 0) + 1 }
          : post
      ));
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-gray-50 overflow-y-auto overscroll-y-contain w-full max-w-3xl mx-auto md:border-x border-gray-200"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Tab Switcher */}
      <div className="flex bg-white border-b border-gray-200 sticky top-0 md:top-0 z-20" style={{ top: '56px' }}>
        <button
          onClick={() => setActiveTab('social')}
          className={`flex-1 py-3 text-sm font-semibold border-b-2 ${activeTab === 'social' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Social Feed
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex-1 py-3 text-sm font-semibold border-b-2 ${activeTab === 'jobs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Professional Board
        </button>
      </div>

      {activeTab === 'social' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="bg-white border-b border-gray-100 shadow-sm z-10">
            <div className="px-5 pt-4 flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">Recent Updates</h3>
              {statuses.length > 0 && (
                <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">New</span>
              )}
            </div>
            <div className="flex gap-5 p-5 overflow-x-auto no-scrollbar">
              {/* My Status */}
              <div className="flex flex-col items-center flex-shrink-0 gap-1 cursor-pointer" onClick={() => (groupedStatuses[currentUser?.id]?.items?.length > 0 ? setActiveStatusUser(currentUser.id) : setShowStatusCreator(true))}>
                <div className={`w-14 h-14 rounded-full p-0.5 border-2 ${groupedStatuses[currentUser?.id]?.items?.length > 0 ? 'border-blue-500' : 'border-dashed border-gray-300'}`}>
                  <Avatar className="w-full h-full">
                    <AvatarImage src={currentUser?.profile_photo} />
                    <AvatarFallback className="bg-blue-500 text-white font-bold">{currentUser?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-[10px] font-bold text-gray-600">My Status</span>
              </div>

              {/* Other User Statuses */}
              {groupedStatuses && Object.keys(groupedStatuses).filter(uid => uid !== currentUser?.id).map(uid => {
                const group = groupedStatuses[uid];
                return (
                  <div key={uid} className="flex flex-col items-center flex-shrink-0 gap-1 cursor-pointer" onClick={() => setActiveStatusUser(uid)}>
                    <div className="w-14 h-14 rounded-full p-0.5 border-2 border-blue-500">
                      <Avatar className="w-full h-full">
                        <AvatarImage src={group.user?.profile_photo} />
                        <AvatarFallback className="bg-gray-200">{group.user?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                    <span className="text-[10px] font-medium text-gray-900 truncate w-16 text-center">{group.user?.name?.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create Post Box */}
          <div className="bg-white p-3.5 md:p-4 border-b border-gray-200 shadow-sm">
            <div className="flex gap-2.5 md:gap-3">

              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={currentUser.profile_photo} />
                <AvatarFallback className="bg-blue-500 text-white">
                  {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="What do you want to talk about?"
                  className="w-full resize-none border-none focus:ring-0 p-2 text-gray-800 placeholder-gray-500 bg-transparent min-h-[60px]"
                  disabled={isUploading}
                />

                {/* File Preview */}
                {previewUrl && (
                  <div className="relative mt-2 mb-4 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 inline-block max-w-full">
                    <Button
                      onClick={clearSelectedFile}
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full w-6 h-6 z-10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    {selectedFile?.type.startsWith('video/') ? (
                      <video src={previewUrl} className="max-h-64 object-contain rounded-lg" controls />
                    ) : (
                      <img src={previewUrl} className="max-h-64 object-contain rounded-lg" alt="Preview" />
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <div className="flex gap-1 overflow-x-auto">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-full flex-shrink-0"
                      disabled={isUploading}
                    >
                      <ImageIcon className="w-5 h-5 md:mr-2" /> <span className="hidden md:inline">Photo</span>
                    </Button>
                    <Button
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = "video/*";
                          fileInputRef.current.click();
                          // reset accept after click
                          setTimeout(() => {
                            if (fileInputRef.current) fileInputRef.current.accept = "image/*,video/*";
                          }, 100);
                        }
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:bg-green-50 hover:text-green-600 rounded-full flex-shrink-0"
                      disabled={isUploading}
                    >
                      <Video className="w-5 h-5 md:mr-2" /> <span className="hidden md:inline">Video</span>
                    </Button>
                  </div>
                  <Button
                    onClick={handleCreatePost}
                    disabled={(!newPostContent.trim() && !selectedFile) || isUploading}
                    className="bg-blue-600 hover:bg-blue-700 rounded-full px-6 flex-shrink-0"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Feed Timeline */}
          <div className="flex-1 p-2 sm:p-4 space-y-4">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-1">No posts yet</h3>
                <p className="text-gray-500 text-sm">Be the first to share something with your network!</p>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4 overflow-hidden">
                  <div className="p-4 flex gap-3">
                    <Avatar
                      className="w-12 h-12 cursor-pointer flex-shrink-0"
                      onClick={() => onViewProfile && post.user && onViewProfile(post.user.id)}
                    >
                      <AvatarImage src={post.user?.profile_photo} />
                      <AvatarFallback className="bg-gray-200 text-gray-700">
                        {post.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h4
                        className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer truncate"
                        onClick={() => onViewProfile && post.user && onViewProfile(post.user.id)}
                      >
                        {post.user?.name || post.user?.email}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">{post.user?.profession || 'Member'}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
                    </div>

                    {/* Networking Buttons */}
                    {post.user_id !== currentUser.id && (
                      <div className="flex items-center gap-1.5 ml-auto">
                        {connectionStatuses[post.user_id] === 'accepted' ? (
                          <Button variant="outline" size="sm" className="h-7 px-2 text-[10px] bg-green-50 text-green-700 border-green-200">
                            <UserCheck className="w-3 h-3 mr-1" /> Connected
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className={`h-7 px-2 text-[10px] ${connectionStatuses[post.user_id] === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}
                            onClick={() => handleConnect(post.user_id)}
                            disabled={connectionStatuses[post.user_id] === 'pending' || processingAction[post.user_id]}
                          >
                            {connectionStatuses[post.user_id] === 'pending' ? 'Pending' : (
                              <><UserPlus className="w-3 h-3 mr-1" /> Connect</>
                            )}
                          </Button>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`h-7 px-2 text-[10px] ${followStatuses[post.user_id] ? 'text-blue-600' : 'text-gray-500'}`}
                          onClick={() => handleFollow(post.user_id)}
                          disabled={processingAction[post.user_id]}
                        >
                          <Rss className="w-3 h-3 mr-1" />
                          {followStatuses[post.user_id] ? 'Following' : 'Follow'}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="px-4 pb-3">
                    <p className="text-gray-800 whitespace-pre-wrap text-sm break-words">{post.content}</p>
                  </div>

                  {post.media_url && (
                    <div className="w-full bg-gray-100 max-h-[500px] overflow-hidden flex items-center justify-center border-y border-gray-100">
                      {post.media_type === 'image' ? (
                        <img src={post.media_url} className="w-full object-contain max-h-[500px]" alt="Post attachment" loading="lazy" />
                      ) : post.media_type === 'video' ? (
                        <video src={post.media_url} controls className="w-full max-h-[500px] object-contain" preload="metadata" />
                      ) : null}
                    </div>
                  )}

                  <div className="px-2 sm:px-4 py-2 flex items-center justify-between text-gray-500 bg-white">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`flex-1 flex gap-2 justify-center rounded-lg ${post.has_liked ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'hover:bg-gray-50'}`}
                      onClick={() => handleLike(post.id, !!post.has_liked)}
                    >
                      <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${post.has_liked ? 'fill-current' : ''}`} />
                      <span className="text-xs sm:text-sm font-medium">Like</span>
                      {(post.likes_count ?? 0) > 0 && (
                        <span
                          className="text-xs sm:text-sm font-medium text-blue-600 hover:underline ml-1"
                          onClick={(e) => { e.stopPropagation(); handleViewPostLikes(post.id); }}
                        >
                          ({post.likes_count})
                        </span>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`flex-1 flex gap-2 justify-center rounded-lg ${openComments[post.id] ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                      onClick={() => toggleComments(post.id)}
                    >
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-sm font-medium">
                        Comment {(post.comments_count ?? 0) > 0 ? `(${post.comments_count})` : ''}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 flex gap-2 justify-center hover:bg-gray-50 rounded-lg"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: `Post by ${post.user?.name}`,
                            text: post.content,
                            url: window.location.href,
                          }).catch(console.error);
                        } else {
                          navigator.clipboard.writeText(`${post.content}\n\n- ${post.user?.name}`);
                          alert('Post copied to clipboard!');
                        }
                      }}
                    >
                      <Share2 className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="text-xs sm:text-sm font-medium">Share</span>
                    </Button>
                  </div>

                  {/* Comments Section */}
                  {openComments[post.id] && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4">
                      {/* Comment Input */}
                      <div className="flex gap-2 mb-4">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={currentUser.profile_photo} />
                          <AvatarFallback className="bg-blue-500 text-white text-xs">
                            {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex flex-col">
                          {replyingTo?.postId === post.id && (
                            <div className="flex items-center justify-between bg-blue-50 text-blue-800 text-[10px] px-3 py-1 rounded-t-lg border border-blue-100 border-b-0">
                              <span>Replying to <span className="font-bold">{replyingTo.userName}</span></span>
                              <button onClick={() => setReplyingTo(null)}>
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <div className={`flex bg-white border border-gray-200 ${replyingTo?.postId === post.id ? 'rounded-b-2xl rounded-tr-2xl' : 'rounded-full'} overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500`}>
                            <input
                              type="text"
                              placeholder="Write a comment..."
                              className="flex-1 px-4 py-2 text-sm bg-transparent border-none focus:outline-none"
                              value={newComment[post.id] || ''}
                              onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddComment(post.id);
                              }}
                            />
                            <button
                              onClick={() => handleAddComment(post.id)}
                              disabled={!newComment[post.id]?.trim()}
                              className="px-4 text-blue-600 font-medium text-sm hover:bg-blue-50 disabled:opacity-50 disabled:hover:bg-transparent"
                            >
                              Post
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Comments List */}
                      {loadingComments[post.id] ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                          </div>
                        ) : (postComments[post.id] && postComments[post.id].length > 0) ? (
                          <div className="space-y-4 mt-4">
                            {postComments[post.id].filter(c => !c.parent_id).map(comment => (
                              <div key={comment.id} className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                  <Avatar className="w-8 h-8 flex-shrink-0">
                                    <AvatarImage src={comment.user?.profile_photo} />
                                    <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                                      {comment.user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-3 py-2">
                                      <div className="flex items-baseline justify-between mb-0.5">
                                        <span className="font-medium text-sm text-gray-900">{comment.user?.name}</span>
                                        <span className="text-[10px] text-gray-500">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                                      </div>
                                      <p className="text-sm text-gray-800 break-words">{comment.content}</p>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 ml-2 text-xs text-gray-500 font-medium">
                                      <button
                                        onClick={() => handleCommentLike(post.id, comment.id, !!comment.has_liked)}
                                        className={`hover:text-gray-800 flex items-center gap-1 ${comment.has_liked ? 'text-red-500' : ''}`}
                                      >
                                        Like {comment.likes_count ? `(${comment.likes_count})` : ''}
                                      </button>
                                      <button
                                        onClick={() => setReplyingTo({ postId: post.id, commentId: comment.id, userName: comment.user?.name || 'User' })}
                                        className="hover:text-gray-800"
                                      >
                                        Reply
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Render Replies */}
                                {postComments[post.id].filter(reply => reply.parent_id === comment.id).map(reply => (
                                  <div key={reply.id} className="ml-10 flex gap-2">
                                    <Avatar className="w-6 h-6 flex-shrink-0">
                                      <AvatarImage src={reply.user?.profile_photo} />
                                      <AvatarFallback className="bg-gray-200 text-gray-700 text-[10px]">
                                        {reply.user?.name?.charAt(0).toUpperCase() || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-3 py-2">
                                        <div className="flex items-baseline justify-between mb-0.5">
                                          <span className="font-medium text-xs text-gray-900">{reply.user?.name}</span>
                                          <span className="text-[10px] text-gray-500">{formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}</span>
                                        </div>
                                        <p className="text-xs text-gray-800 break-words">{reply.content}</p>
                                      </div>
                                      <div className="flex items-center gap-4 mt-1 ml-2 text-[10px] text-gray-500 font-medium">
                                        <button
                                          onClick={() => handleCommentLike(post.id, reply.id, !!reply.has_liked)}
                                          className={`hover:text-gray-800 flex items-center gap-1 ${reply.has_liked ? 'text-red-500' : ''}`}
                                        >
                                          Like {reply.likes_count ? `(${reply.likes_count})` : ''}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-sm text-gray-500">
                            No comments yet. Be the first!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      {activeTab === 'jobs' && (
        <div className="flex-1 p-2 sm:p-4 space-y-4">
          {loadingJobs ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
              <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No active bounties</h3>
              <p className="text-gray-500 max-w-xs mx-auto mb-6">Check back later for new professional opportunities in the ecosystem.</p>
              <Button 
                onClick={() => setShowCreateJobModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-8 h-11"
              >
                Post a Bounty
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-2">
                <Button 
                  onClick={() => setShowCreateJobModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 px-6 shadow-lg shadow-blue-200"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Post Bounty
                </Button>
              </div>

              <div className="grid gap-3 md:gap-4 px-3 md:px-0">
                {jobs.map(job => (
                  <div key={job.id} className="bg-white rounded-2xl md:rounded-[12px] border border-gray-100 p-4 md:p-5 relative overflow-hidden">


                    {/* Budget Tag */}
                    <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1.5 rounded-bl-xl flex items-center gap-1 shadow-sm">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span className="font-bold text-sm">{job.budget.toLocaleString()}</span>
                    </div>

                    <div className="flex items-start gap-4 pr-16">
                      <Avatar className="w-12 h-12 rounded-xl flex-shrink-0 border border-gray-100">
                        <AvatarImage src={job.poster?.profile_photo} />
                        <AvatarFallback className="bg-gray-100 text-gray-600">
                          {job.poster?.name?.charAt(0).toUpperCase() || 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-900 text-base md:text-lg leading-tight mb-1 group-hover:text-blue-600 transition-colors truncate pr-2">

                          {job.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                          <span className="font-medium text-gray-700">{job.poster?.name}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {job.description}
                        </p>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-2 mb-5">
                          {job.skills?.map(skill => (
                            <span key={skill} className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-100 uppercase tracking-wider">
                              {skill}
                            </span>
                          ))}
                        </div>

                        <Button 
                          onClick={() => {
                            if (onStartChat) {
                              onStartChat(job.poster_id, `Hi! I'm interested in your '${job.title}' bounty. Let's discuss the details.`);
                            }
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
                        >
                          <Send className="w-4 h-4" />
                          Quick Pitch
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Status Viewer Overlay */}
      {activeStatusUser && (
        <StatusViewer userId={activeStatusUser} currentUser={currentUser} onClose={() => setActiveStatusUser(null)} />
      )}

      {/* Status Creator Modal */}
      {showStatusCreator && (
        <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">Create Update</h3>
              <button onClick={() => setShowStatusCreator(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 p-6 flex flex-col gap-6">
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => setNewStatusType('text')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${newStatusType === 'text' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                  <span className="text-xs font-bold">Text Status</span>
                </button>
                <button 
                  onClick={() => {
                    setNewStatusType('image');
                    fileInputRef.current?.click();
                  }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${newStatusType === 'image' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <Camera className="w-8 h-8 text-blue-600" />
                  <span className="text-xs font-bold">Media Status</span>
                </button>
              </div>

              {newStatusType === 'text' ? (
                <textarea 
                  className="w-full h-32 p-4 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                  placeholder="Type your update here..."
                  onChange={(e) => setNewPostContent(e.target.value)}
                  value={newPostContent}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 p-4">
                  {previewUrl ? (
                    <div className="relative w-full h-full">
                      <img src={previewUrl} className="w-full h-full object-cover rounded-lg" alt="Preview" />
                      <button onClick={clearSelectedFile} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm text-center">Select a photo or video to share</p>
                  )}
                </div>
              )}

              <Button 
                onClick={async () => {
                  setIsUploading(true);
                  try {
                    let mediaUrl = '';
                    if (selectedFile) {
                      const fileExt = selectedFile.name.split('.').pop();
                      const fileName = `status-${Date.now()}.${fileExt}`;
                      const { data: uploadData } = await supabase.storage.from('chat-media').upload(`status/${fileName}`, selectedFile);
                      if (uploadData) {
                        const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(`status/${fileName}`);
                        mediaUrl = publicUrl;
                      }
                    }
                    await handleCreateStatus(mediaUrl, newStatusType === 'text' ? newPostContent : '', newStatusType);
                    setNewPostContent('');
                    clearSelectedFile();
                  } finally {
                    setIsUploading(false);
                  }
                }}
                disabled={isUploading || (newStatusType === 'text' ? !newPostContent.trim() : !selectedFile)}
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold text-lg shadow-lg shadow-blue-200"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Share Update'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showPostLikesModal && (
        <PostLikesModal
          postId={showPostLikesModal}
          onClose={() => setShowPostLikesModal(null)}
          onViewProfile={onViewProfile}
        />
      )}

      {showCreateJobModal && (
        <CreateBountyModal
          onClose={() => setShowCreateJobModal(false)}
          onSubmit={handleCreateJob}
        />
      )}
    </div>
  );
}

// Sub-components
function StatusViewer({ userId, currentUser, onClose }: { userId: string, currentUser: User, onClose: () => void }) {
  const [userStatuses, setUserStatuses] = useState<Status[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);

  useEffect(() => {
    const fetchUserStatuses = async () => {
      try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
          .from('statuses')
          .select('*, user:users(*)')
          .eq('user_id', userId)
          .gt('created_at', twentyFourHoursAgo)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        if (data && data.length > 0) setUserStatuses(data);
        else onClose();
      } catch (err) {
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchUserStatuses();
  }, [userId, onClose]);

  // Record view when status changes
  useEffect(() => {
    if (userStatuses.length > 0 && !loading && userId !== currentUser.id) {
      const currentStatus = userStatuses[currentIndex];
      const recordView = async () => {
        await supabase.from('status_views').upsert({
          status_id: currentStatus.id,
          viewer_id: currentUser.id
        }, { onConflict: 'status_id, viewer_id' });
      };
      recordView();
    }
  }, [currentIndex, userStatuses, loading, userId, currentUser.id]);

  useEffect(() => {
    if (userStatuses.length === 0 || loading || isPaused || showViewers) return;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (currentIndex < userStatuses.length - 1) {
            setCurrentIndex(curr => curr + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [currentIndex, userStatuses, loading, onClose, isPaused, showViewers]);

  if (loading || userStatuses.length === 0) {
    return (
      <div className="fixed inset-0 z-[999] bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  const currentStatus = userStatuses[currentIndex];

  return (
    <div className="fixed inset-0 z-[999] bg-black flex flex-col animate-in fade-in duration-300 touch-none">
      <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-50">
        {userStatuses.map((_, idx) => (
          <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white transition-all duration-100 ease-linear" style={{ width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' }} />
          </div>
        ))}
      </div>

      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-white/50 shadow-lg">
            <AvatarImage src={currentStatus.user?.profile_photo} />
            <AvatarFallback className="bg-blue-600 text-white font-bold">{currentStatus.user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-white drop-shadow-md">
            <p className="font-bold text-sm leading-tight">{currentStatus.user?.name}</p>
            <p className="text-[10px] opacity-70">{formatDistanceToNow(new Date(currentStatus.created_at), { addSuffix: true })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }} className="text-white p-2 hover:bg-white/10 rounded-full transition-colors backdrop-blur-sm">
            {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-white p-2 hover:bg-white/10 rounded-full backdrop-blur-sm">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-0 relative">
        {currentStatus.media_type === 'text' ? (
          <div className="w-full h-full flex items-center justify-center text-center text-white text-2xl font-bold px-10" style={{ background: currentStatus.background_color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            {currentStatus.content}
          </div>
        ) : (
          currentStatus.media_type === 'image' 
            ? <img src={currentStatus.media_url} className="w-full h-full object-contain" alt="Status" />
            : <video src={currentStatus.media_url} className="w-full h-full object-contain" autoPlay playsInline onEnded={() => { if(currentIndex < userStatuses.length -1) setCurrentIndex(currentIndex + 1); else onClose(); }} />
        )}

        <div className="absolute inset-0 flex">
          <div className="w-1/3 h-full cursor-pointer active:bg-white/5" onClick={(e) => { e.stopPropagation(); if (currentIndex > 0) { setCurrentIndex(currentIndex - 1); setProgress(0); } }} />
          <div className="w-2/3 h-full cursor-pointer active:bg-white/5" onClick={(e) => { e.stopPropagation(); if (currentIndex < userStatuses.length - 1) { setCurrentIndex(currentIndex + 1); setProgress(0); } else { onClose(); } }} />
        </div>
      </div>

      {/* Viewed By Section (Owner Only) */}
      {userId === currentUser.id && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center z-50">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowViewers(true); }}
            className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors"
          >
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20">
              <Eye className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Viewers</span>
          </button>
        </div>
      )}

      {showViewers && (
        <StatusViewsModal statusId={currentStatus.id} onClose={() => setShowViewers(false)} />
      )}
    </div>
  );
}

function StatusViewsModal({ statusId, onClose }: { statusId: string, onClose: () => void }) {
  const [viewers, setViewers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchViewers = async () => {
      try {
        const { data, error } = await supabase
          .from('status_views')
          .select('*, viewer:users(*)')
          .eq('status_id', statusId)
          .order('viewed_at', { ascending: false });
        if (error) throw error;
        setViewers(data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchViewers();
  }, [statusId]);

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md h-[70vh] sm:h-auto sm:max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="font-bold text-lg text-gray-900">Viewed by</h3>
            <p className="text-xs text-gray-500 font-medium">{viewers.length} connections</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6 text-gray-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>
          ) : viewers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No one has viewed yet.</p>
              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Updates take a few seconds</p>
            </div>
          ) : (
            viewers.map(v => (
              <div key={v.id} className="flex items-center gap-4 group p-2 hover:bg-gray-50 rounded-2xl transition-colors">
                <Avatar className="w-12 h-12 border border-gray-100 shadow-sm">
                  <AvatarImage src={v.viewer?.profile_photo} />
                  <AvatarFallback className="bg-blue-600 text-white font-bold">{v.viewer?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">{v.viewer?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{v.viewer?.profession || 'Professional'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{formatDistanceToNow(new Date(v.viewed_at), { addSuffix: true })}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function PostLikesModal({ postId, onClose, onViewProfile }: { postId: string, onClose: () => void, onViewProfile?: (uid: string) => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const { data, error } = await supabase.from('post_likes').select('user:users(*)').eq('post_id', postId);
        if (error) throw error;
        setUsers(data.map((d: any) => d.user));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchLikes();
  }, [postId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-lg">Likes</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : users.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No likes yet.</p>
          ) : (
            <div className="space-y-1">
              {users.map(user => (
                <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer" onClick={() => { onViewProfile?.(user.id); onClose(); }}>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.profile_photo} /><AvatarFallback className="bg-blue-100 text-blue-700">{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.profession || 'Member'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateBountyModal({ onClose, onSubmit }: { onClose: () => void, onSubmit: (title: string, description: string, budget: number, skills: string[]) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [skills, setSkills] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !budget.trim()) return;
    setLoading(true);
    const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s !== '');
    await onSubmit(title, description, parseFloat(budget), skillsArray);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-lg">Post a Bounty</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input autoFocus type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="e.g. Build a landing page for my startup" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[120px] resize-none" placeholder="Explain the task, requirements and deliverables..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
              <input type="number" required value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
              <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="React, Tailwind, Node.js" />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl mt-4">
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Post Opportunity'}
          </Button>
        </form>
      </div>
    </div>
  );
}
