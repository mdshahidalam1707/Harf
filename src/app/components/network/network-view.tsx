import React, { useState } from 'react';
import { User } from '../../../lib/supabase';
import { useNetwork } from '../../hooks/use-network';
import { UserNetworkCard } from './user-network-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Loader2, Users, UserPlus, Heart, Bell, Search } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';

interface NetworkViewProps {
  currentUser: User;
  onStartChat?: (userId: string, initialMessage?: string) => void;
  onViewProfile?: (userId: string) => void;
}

export function NetworkView({ currentUser, onStartChat, onViewProfile }: NetworkViewProps) {
  const network = useNetwork(currentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('network_active_tab') || 'suggestions';
  });

  // Persist tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem('network_active_tab', value);
  };

  if (network.loading) {
    return (
      <div className="flex flex-1 items-center justify-center h-full bg-white">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading your professional network...</p>
        </div>
      </div>
    );
  }

  // Helper to check connection status
  const getConnectionStatus = (userId: string) => {
    const conn = network.connections.find(c => c.requester_id === userId || c.receiver_id === userId);
    if (!conn) return 'none';
    if (conn.status === 'accepted') return 'accepted';
    if (conn.requester_id === currentUser.id) return 'pending_sent';
    return 'pending_received';
  };

  const isFollowing = (userId: string) => {
    return network.follows.some(f => f.follower_id === currentUser.id && f.following_id === userId);
  };

  const getFilteredUsers = (type: 'suggestions' | 'connected' | 'followers' | 'following' | 'invitations') => {
    let list: User[] = [];

    switch (type) {
      case 'suggestions':
        list = network.users.filter(u => getConnectionStatus(u.id) === 'none');
        break;
      case 'connected':
        const connectedIds = network.connections
          .filter(c => c.status === 'accepted')
          .map(c => c.requester_id === currentUser.id ? c.receiver_id : c.requester_id);
        list = network.users.filter(u => connectedIds.includes(u.id));
        break;
      case 'followers':
        const followerIds = network.follows
          .filter(f => f.following_id === currentUser.id)
          .map(f => f.follower_id);
        list = network.users.filter(u => followerIds.includes(u.id));
        break;
      case 'following':
        const followingIds = network.follows
          .filter(f => f.follower_id === currentUser.id)
          .map(f => f.following_id);
        list = network.users.filter(u => followingIds.includes(u.id));
        break;
      case 'invitations':
        const requesterIds = network.connections
          .filter(c => c.receiver_id === currentUser.id && c.status === 'pending')
          .map(c => c.requester_id);
        list = network.users.filter(u => requesterIds.includes(u.id));
        break;
    }

    if (searchQuery) {
      list = list.filter(u => 
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.profession?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.headline?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return list;
  };

  const invitationCount = network.connections.filter(c => c.receiver_id === currentUser.id && c.status === 'pending').length;

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-full">
        {/* Header Area - Sticky */}
        <div className="bg-white border-b border-gray-200 shadow-sm z-20">
          <div className="max-w-6xl mx-auto p-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-black text-gray-900 tracking-tight">My Network</h1>
                <div className="bg-blue-50 px-3 py-1 rounded-full text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  Professional
                </div>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search network..." 
                  className="pl-10 h-10 rounded-xl bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <TabsList className="bg-gray-100/80 p-1 rounded-xl w-full flex overflow-x-auto no-scrollbar gap-1 px-1 justify-start">
                {['suggestions', 'invitations', 'connected', 'following', 'followers'].map((t) => (
                  <TabsTrigger 
                    key={t}
                    value={t} 
                    className="flex-shrink-0 min-w-[90px] rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-[11px] font-bold py-2 transition-all relative"
                  >
                    {t === 'suggestions' ? 'Suggestions' : t.charAt(0).toUpperCase() + t.slice(1)}
                    {t === 'invitations' && invitationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] h-3.5 w-3.5 flex items-center justify-center rounded-full border border-white">
                        {invitationCount}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            {['suggestions', 'invitations', 'connected', 'following', 'followers'].map((type) => (
              <TabsContent key={type} value={type} className="mt-0 outline-none">
                {getFilteredUsers(type as any).length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      {type === 'suggestions' && <UserPlus className="w-8 h-8 text-gray-300" />}
                      {type === 'invitations' && <Bell className="w-8 h-8 text-gray-300" />}
                      {type === 'connected' && <Users className="w-8 h-8 text-gray-300" />}
                      {type === 'following' && <Heart className="w-8 h-8 text-gray-300" />}
                      {type === 'followers' && <Users className="w-8 h-8 text-gray-300" />}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No users found</h3>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">
                      {type === 'suggestions' ? "We'll suggest more people as your network grows." : 
                       type === 'invitations' ? "You're all caught up! No pending requests." :
                       `Your ${type} list is currently empty.`}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {getFilteredUsers(type as any).map(user => (
                      <UserNetworkCard
                        key={user.id}
                        user={user}
                        currentUserId={currentUser.id}
                        connectionStatus={getConnectionStatus(user.id)}
                        isFollowing={isFollowing(user.id)}
                        connectionId={network.connections.find(c => c.requester_id === user.id || c.receiver_id === user.id)?.id}
                        onConnect={() => network.handleSendRequest(user.id)}
                        onAccept={() => {
                          const conn = network.connections.find(c => c.requester_id === user.id && c.receiver_id === currentUser.id);
                          if (conn) network.handleAcceptRequest(conn.id, user.id);
                        }}
                        onCancel={() => {
                          const conn = network.connections.find(c => c.requester_id === currentUser.id && c.receiver_id === user.id);
                          if (conn) network.handleCancelRequest(conn.id);
                        }}
                        onRemove={() => {
                          const conn = network.connections.find(c => c.requester_id === user.id || c.receiver_id === user.id);
                          if (conn) network.handleRemoveConnection(conn.id);
                        }}
                        onFollow={() => network.handleToggleFollow(user.id)}
                        onMessage={() => onStartChat && onStartChat(user.id)}
                        onViewProfile={(userId) => onViewProfile && onViewProfile(userId)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </div>
        </div>
      </Tabs>
    </div>
  );
}
