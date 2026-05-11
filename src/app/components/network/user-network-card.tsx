import React, { useState, useEffect } from 'react';
import { User, supabase } from '../../../lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { UserPlus, UserCheck, UserMinus, MessageCircle, MoreHorizontal, Users } from 'lucide-react';
import { Badge } from '../ui/badge';

interface UserNetworkCardProps {
  user: User;
  currentUserId: string;
  connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  isFollowing: boolean;
  connectionId?: string;
  onConnect: () => void;
  onAccept: () => void;
  onCancel: () => void;
  onRemove: () => void;
  onFollow: () => void;
  onMessage: () => void;
  onViewProfile: (userId: string) => void;
}

export function UserNetworkCard({
  user,
  currentUserId,
  connectionStatus,
  isFollowing,
  connectionId,
  onConnect,
  onAccept,
  onCancel,
  onRemove,
  onFollow,
  onMessage,
  onViewProfile
}: UserNetworkCardProps) {
  const [mutualCount, setMutualCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchMutualCount() {
      const { data, error } = await supabase.rpc('get_mutual_connections', {
        user_a: currentUserId,
        user_b: user.id
      });
      if (!error && data) {
        setMutualCount(data.length);
      }
    }
    fetchMutualCount();
  }, [user.id, currentUserId]);

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      {/* Cover Background */}
      <div className="h-20 bg-gradient-to-r from-blue-400 to-indigo-500 relative">
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
          <Avatar className="w-20 h-20 border-4 border-white shadow-lg cursor-pointer" onClick={() => onViewProfile(user.id)}>
            <AvatarImage src={user.profile_photo} />
            <AvatarFallback className="bg-blue-600 text-white text-xl font-bold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="pt-12 p-4 text-center">
        <h3 
          className="font-bold text-gray-900 text-lg hover:text-blue-600 cursor-pointer transition-colors"
          onClick={() => onViewProfile(user.id)}
        >
          {user.name}
        </h3>
        <p className="text-xs text-blue-600 font-medium mb-1 truncate px-2">
          {user.headline || user.profession || 'Harf Professional'}
        </p>
        <p className="text-[10px] text-gray-500 line-clamp-2 min-h-[30px] px-4 mb-3">
          {user.company ? `At ${user.company}` : user.bio || 'No bio provided'}
        </p>

        {mutualCount > 0 && (
          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 mb-4 bg-gray-50 py-1 px-3 rounded-full w-fit mx-auto">
            <Users className="w-3 h-3" />
            <span>{mutualCount} mutual connections</span>
          </div>
        )}

        <div className="space-y-2 mt-4">
          {connectionStatus === 'none' && (
            <Button 
              onClick={onConnect} 
              variant="outline" 
              className="w-full rounded-full border-blue-600 text-blue-600 hover:bg-blue-50 font-bold h-9"
            >
              <UserPlus className="w-4 h-4 mr-2" /> Connect
            </Button>
          )}

          {connectionStatus === 'pending_sent' && (
            <Button 
              onClick={onCancel} 
              variant="outline" 
              className="w-full rounded-full bg-gray-50 text-gray-500 border-gray-200 font-bold h-9"
            >
              Pending
            </Button>
          )}

          {connectionStatus === 'pending_received' && (
            <div className="flex gap-2">
              <Button 
                onClick={onAccept} 
                className="flex-1 rounded-full bg-blue-600 text-white hover:bg-blue-700 font-bold h-9"
              >
                Accept
              </Button>
              <Button 
                onClick={onCancel} 
                variant="outline"
                className="flex-1 rounded-full text-gray-500 border-gray-200 font-bold h-9"
              >
                Reject
              </Button>
            </div>
          )}

          {connectionStatus === 'accepted' && (
            <div className="flex gap-2">
              <Button 
                onClick={onMessage} 
                className="flex-1 rounded-full bg-blue-600 text-white hover:bg-blue-700 font-bold h-9"
              >
                <MessageCircle className="w-4 h-4 mr-2" /> Message
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full w-9 h-9 p-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onRemove} className="text-red-600 focus:text-red-600">
                    <UserMinus className="w-4 h-4 mr-2" /> Remove Connection
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <Button 
            onClick={onFollow} 
            variant="ghost" 
            size="sm"
            className={`w-full text-xs font-bold ${isFollowing ? 'text-green-600' : 'text-gray-500'}`}
          >
            {isFollowing ? 'Following' : '+ Follow'}
          </Button>
        </div>
      </div>
    </div>
  );
}

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
