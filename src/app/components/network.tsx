import React, { useState, useEffect } from 'react';
import { supabase, User, Connection, Follow } from '../../lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { 
  UserPlus, 
  UserCheck, 
  UserX, 
  Users, 
  UserMinus, 
  UserRound, 
  ArrowRightLeft,
  Search,
  Loader2,
  MoreHorizontal
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';

interface NetworkProps {
  currentUser: User;
  onStartChat?: (userId: string, initialMessage?: string) => void;
}

export function Network({ currentUser, onStartChat }: NetworkProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('suggestions');

  useEffect(() => {
    loadNetworkData();
  }, []);

  const loadNetworkData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all users
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .neq('id', currentUser.id);
      
      // 2. Fetch my connections
      const { data: connData } = await supabase
        .from('connections')
        .select('*')
        .or(`requester_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

      // 3. Fetch follows
      const { data: followData } = await supabase
        .from('follows')
        .select('*')
        .or(`follower_id.eq.${currentUser.id},following_id.eq.${currentUser.id}`);

      setUsers(usersData || []);
      setConnections(connData || []);
      setFollows(followData || []);
    } catch (error) {
      console.error('Error loading network data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (receiverId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .insert({
          requester_id: currentUser.id,
          receiver_id: receiverId,
          status: 'pending'
        });
      if (error) throw error;
      loadNetworkData();
    } catch (error) {
      console.error('Error sending request:', error);
    }
  };

  const handleAccept = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId);
      if (error) throw error;
      loadNetworkData();
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleFollowToggle = async (targetUserId: string, isFollowing: boolean) => {
    try {
      if (isFollowing) {
        await supabase.from('follows').delete().match({ follower_id: currentUser.id, following_id: targetUserId });
      } else {
        await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: targetUserId });
      }
      loadNetworkData();
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  // Derived state
  const pendingInvitations = connections.filter(c => c.receiver_id === currentUser.id && c.status === 'pending');
  const sentRequests = connections.filter(c => c.requester_id === currentUser.id && c.status === 'pending');
  const myConnections = connections.filter(c => c.status === 'accepted');
  const myFollowing = follows.filter(f => f.follower_id === currentUser.id);
  const myFollowers = follows.filter(f => f.following_id === currentUser.id);

  // Get IDs of people we are already in some connection status with
  const connectedOrPendingIds = new Set(
    connections.map(c => c.requester_id === currentUser.id ? c.receiver_id : c.requester_id)
  );

  const suggestedUsers = users.filter(u => !connectedOrPendingIds.has(u.id));

  const UserCard = ({ user, type, connectionId }: { user: User, type: 'suggestion' | 'invitation' | 'connection' | 'following' | 'follower', connectionId?: string }) => (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all duration-300">
      <div className="relative mb-4">
        <Avatar className="w-20 h-20 ring-4 ring-blue-50 shadow-inner">
          <AvatarImage src={user.profile_photo} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl font-bold">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        {user.online && (
          <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
        )}
      </div>
      
      <h3 className="font-bold text-gray-900 text-lg mb-0.5 truncate w-full">{user.name || user.email}</h3>
      <p className="text-xs font-medium text-blue-600 mb-2 truncate w-full uppercase tracking-wider">{user.profession || 'Professional'}</p>
      <p className="text-sm text-gray-500 mb-5 line-clamp-2 min-h-[40px] leading-relaxed">
        {user.headline || user.bio || `Member of Harf network since ${new Date(user.created_at || '').getFullYear()}`}
      </p>
      
      <div className="w-full mt-auto space-y-2">
        {type === 'suggestion' && (
          <Button onClick={() => handleConnect(user.id)} className="w-full rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
            <UserPlus className="w-4 h-4 mr-2" /> Connect
          </Button>
        )}
        {type === 'invitation' && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="rounded-full border-gray-200 hover:bg-gray-50">Ignore</Button>
            <Button onClick={() => connectionId && handleAccept(connectionId)} className="rounded-full bg-blue-600">Accept</Button>
          </div>
        )}
        {type === 'connection' && (
          <Button onClick={() => onStartChat?.(user.id)} className="w-full rounded-full bg-blue-600">
            Message
          </Button>
        )}
        {type === 'following' && (
          <Button variant="outline" onClick={() => handleFollowToggle(user.id, true)} className="w-full rounded-full border-blue-100 text-blue-600 hover:bg-blue-50">
            Unfollow
          </Button>
        )}
        {type === 'follower' && (
          <Button variant="outline" onClick={() => handleFollowToggle(user.id, false)} className="w-full rounded-full border-blue-600 text-blue-600 hover:bg-blue-50">
            Follow Back
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] overflow-y-auto w-full max-w-6xl mx-auto pb-10">
      {/* Header with Search */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 py-6 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">My Network</h1>
            <p className="text-gray-500 text-sm">Manage your professional connections and community</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search in network..." 
              className="pl-10 rounded-full bg-gray-50 border-none ring-1 ring-gray-200 focus-visible:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 mt-6">
        <Tabs defaultValue="suggestions" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-gray-100 p-1 rounded-2xl w-full sm:w-auto h-auto flex flex-wrap gap-1 shadow-sm overflow-x-auto no-scrollbar">
            <TabsTrigger value="suggestions" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Suggestions
            </TabsTrigger>
            <TabsTrigger value="invitations" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-2">
              Invitations {pendingInvitations.length > 0 && <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{pendingInvitations.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="connections" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Connections ({myConnections.length})
            </TabsTrigger>
            <TabsTrigger value="following" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Following ({myFollowing.length})
            </TabsTrigger>
            <TabsTrigger value="followers" className="rounded-xl px-5 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Followers ({myFollowers.length})
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-500 font-medium">Loading your network...</p>
            </div>
          ) : (
            <>
              {/* Suggestions Tab */}
              <TabsContent value="suggestions" className="mt-6">
                {suggestedUsers.length === 0 ? (
                  <EmptyState icon={<UserRound className="w-12 h-12" />} title="No new suggestions" description="You've connected with everyone available for now!" />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {suggestedUsers.map(user => <UserCard key={user.id} user={user} type="suggestion" />)}
                  </div>
                )}
              </TabsContent>

              {/* Invitations Tab */}
              <TabsContent value="invitations" className="mt-6">
                <div className="space-y-8">
                  {pendingInvitations.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Received Requests</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {pendingInvitations.map(conn => {
                          const user = users.find(u => u.id === conn.requester_id);
                          return user ? <UserCard key={conn.id} user={user} type="invitation" connectionId={conn.id} /> : null;
                        })}
                      </div>
                    </div>
                  )}

                  {sentRequests.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Sent Requests</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 opacity-80">
                        {sentRequests.map(conn => {
                          const user = users.find(u => u.id === (conn.receiver_id === currentUser.id ? conn.requester_id : conn.receiver_id));
                          return user ? (
                            <div key={conn.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col items-center text-center grayscale-[0.5]">
                              <Avatar className="w-16 h-16 mb-3">
                                <AvatarImage src={user.profile_photo} />
                                <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <h3 className="font-bold text-gray-900">{user.name}</h3>
                              <p className="text-xs text-gray-500 mb-4 italic">Pending response...</p>
                              <Button variant="ghost" size="sm" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50">Cancel</Button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {pendingInvitations.length === 0 && sentRequests.length === 0 && (
                    <EmptyState icon={<ArrowRightLeft className="w-12 h-12" />} title="No pending requests" description="When you send or receive connection requests, they'll show up here." />
                  )}
                </div>
              </TabsContent>

              {/* Connections Tab */}
              <TabsContent value="connections" className="mt-6">
                {myConnections.length === 0 ? (
                  <EmptyState icon={<Users className="w-12 h-12" />} title="No connections yet" description="Start sending requests to professionals to build your network!" />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {myConnections.map(conn => {
                      const otherId = conn.requester_id === currentUser.id ? conn.receiver_id : conn.requester_id;
                      const user = users.find(u => u.id === otherId);
                      return user ? <UserCard key={conn.id} user={user} type="connection" /> : null;
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Following Tab */}
              <TabsContent value="following" className="mt-6">
                {myFollowing.length === 0 ? (
                  <EmptyState icon={<UserCheck className="w-12 h-12" />} title="Not following anyone" description="Follow industry experts and peers to see their updates in your feed." />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {myFollowing.map(f => {
                      const user = users.find(u => u.id === f.following_id);
                      return user ? <UserCard key={f.id} user={user} type="following" /> : null;
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Followers Tab */}
              <TabsContent value="followers" className="mt-6">
                {myFollowers.length === 0 ? (
                  <EmptyState icon={<UserRound className="w-12 h-12" />} title="No followers yet" description="Share insightful posts to attract followers to your profile!" />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {myFollowers.map(f => {
                      const user = users.find(u => u.id === f.follower_id);
                      return user ? <UserCard key={f.id} user={user} type="follower" /> : null;
                    })}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white border border-dashed border-gray-200 rounded-3xl">
      <div className="w-20 h-20 bg-gray-50 flex items-center justify-center rounded-full text-gray-300 mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm">{description}</p>
    </div>
  );
}
