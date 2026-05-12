import { useState, useEffect, useCallback } from 'react';
import { supabase, User, Connection, Follow, Notification, sendConnectionRequest, acceptConnectionRequest, toggleFollow } from '../../lib/supabase';

export function useNetwork(currentUser: User) {
  const [users, setUsers] = useState<User[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    console.log('📡 Fetching network data...');
    setLoading(true);
    
    // Set a safety timeout
    const timeoutId = setTimeout(() => {
      console.warn('🕒 Network data fetch taking too long, releasing loader');
      setLoading(false);
    }, 5000);

    try {
      // 1. Fetch all other users
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .neq('id', currentUser.id);
      
      // 2. Fetch connections
      const { data: connData } = await supabase
        .from('connections')
        .select('*')
        .or(`requester_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

      // 3. Fetch follows
      const { data: followData } = await supabase
        .from('follows')
        .select('*')
        .or(`follower_id.eq.${currentUser.id},following_id.eq.${currentUser.id}`);

      // 4. Fetch notifications
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*, sender:users!sender_id(*)')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      setUsers(usersData || []);
      setConnections(connData || []);
      setFollows(followData || []);
      setNotifications(notifData || []);
    } catch (error) {
      console.error('Error fetching network data:', error);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    fetchData();

    // Subscribe to changes
    const connectionSub = supabase
      .channel('connections-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, () => fetchData())
      .subscribe();

    const followSub = supabase
      .channel('follows-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, () => fetchData())
      .subscribe();

    const notifSub = supabase
      .channel('notifications-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(connectionSub);
      supabase.removeChannel(followSub);
      supabase.removeChannel(notifSub);
    };
  }, [fetchData]);

  const handleSendRequest = async (receiverId: string) => {
    const success = await sendConnectionRequest(receiverId);
    if (success) await fetchData();
    return success;
  };

  const handleAcceptRequest = async (connectionId: string, requesterId: string) => {
    const success = await acceptConnectionRequest(connectionId, requesterId);
    if (success) await fetchData();
    return success;
  };

  const handleCancelRequest = async (connectionId: string) => {
    const { error } = await supabase.from('connections').delete().eq('id', connectionId);
    if (!error) await fetchData();
    return !error;
  };

  const handleRemoveConnection = async (connectionId: string) => {
    const { error } = await supabase.from('connections').delete().eq('id', connectionId);
    if (!error) await fetchData();
    return !error;
  };

  const handleToggleFollow = async (targetUserId: string) => {
    const isFollowing = follows.some(f => f.follower_id === currentUser.id && f.following_id === targetUserId);
    const success = await toggleFollow(targetUserId, isFollowing);
    if (success) await fetchData();
    return success;
  };

  const markNotificationAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    }
  };

  return {
    users,
    connections,
    follows,
    notifications,
    loading,
    refresh: fetchData,
    handleSendRequest,
    handleAcceptRequest,
    handleCancelRequest,
    handleRemoveConnection,
    handleToggleFollow,
    markNotificationAsRead
  };
}
