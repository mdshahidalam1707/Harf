import React, { useState, useEffect } from 'react';
import { supabase, User, Connection } from '../../lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { UserPlus, UserCheck, UserX, Users } from 'lucide-react';

interface NetworkProps {
  currentUser: User;
  onStartChat?: (userId: string, initialMessage?: string) => void;
}

export function Network({ currentUser, onStartChat }: NetworkProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNetworkData();
  }, []);

  const loadNetworkData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all other users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .neq('id', currentUser.id)
        .limit(50);
      
      if (usersError) throw usersError;

      // 2. Fetch my connections
      const { data: connData, error: connError } = await supabase
        .from('connections')
        .select('*')
        .or(`requester_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

      if (connError) throw connError;

      setUsers(usersData || []);
      setConnections(connData || []);
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

  // Derived state
  const pendingRequests = connections.filter(c => c.receiver_id === currentUser.id && c.status === 'pending');
  
  // Get ID of people we are connected to or pending with
  const connectedOrPendingUserIds = new Set(
    connections.map(c => c.requester_id === currentUser.id ? c.receiver_id : c.requester_id)
  );

  const suggestedUsers = users.filter(u => !connectedOrPendingUserIds.has(u.id));

  return (
    <div 
      className="flex flex-col h-full bg-gray-50 overflow-y-auto overscroll-y-contain w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      
      {/* Pending Invitations Section */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Invitations</h2>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">{pendingRequests.length} pending</span>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingRequests.map(conn => {
              const requester = users.find(u => u.id === conn.requester_id);
              if (!requester) return null;
              return (
                <div key={conn.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={requester.profile_photo} />
                      <AvatarFallback className="bg-blue-100 text-blue-700">{requester.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-gray-900">{requester.name || requester.email}</h3>
                      <p className="text-sm text-gray-500">{requester.profession || 'Harf Member'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-gray-600 rounded-full">Ignore</Button>
                    <Button size="sm" onClick={() => handleAccept(conn.id)} className="rounded-full">Accept</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggested Connections Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-500" /> People you may know
        </h2>
        
        {loading ? (
          <div className="flex justify-center p-8">
             <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : suggestedUsers.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No more suggestions right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {suggestedUsers.map(user => (
              <div key={user.id} className="border border-gray-200 rounded-xl p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <Avatar className="w-20 h-20 mb-3">
                  <AvatarImage src={user.profile_photo} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-gray-900 truncate w-full">{user.name || user.email}</h3>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2 min-h-[32px]">{user.profession || 'Harf Member'}</p>
                
                <Button 
                  onClick={() => handleConnect(user.id)} 
                  variant="outline" 
                  className="w-full mt-auto rounded-full border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <UserPlus className="w-4 h-4 mr-2" /> Connect
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
