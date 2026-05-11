import { useState, useEffect } from 'react';
import { supabase, User } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Loader2, Search, UserPlus, Check, X } from 'lucide-react';

interface GroupMember {
  id: string;
  user_id: string;
  chat_id: string;
}

interface UserResult {
  id: string;
  name: string | null;
  username: string | null;
  profile_photo: string | null;
}

interface AddGroupMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string;
  groupAdminId: string;
  currentUserId: string;
  onMembersAdded: () => void;
}

export function AddGroupMembersModal({ 
  open, 
  onOpenChange, 
  chatId, 
  groupAdminId, 
  currentUserId,
  onMembersAdded 
}: AddGroupMembersModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [currentMembers, setCurrentMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const isAdmin = groupAdminId === currentUserId;

  useEffect(() => {
    if (open && chatId) {
      loadCurrentMembers();
    }
  }, [open, chatId]);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSearchResults([]);
      setSearching(false);
    }
  }, [open]);

  const loadCurrentMembers = async () => {
    setLoading(true);
    try {
      console.log('Loading current members for chat:', chatId);

      const { data, error } = await supabase
        .from('chat_participants')
        .select('id, user_id, chat_id')
        .eq('chat_id', chatId);

      if (error) {
        console.error('Error loading members:', error);
      } else {
        setCurrentMembers(data || []);
        console.log('Current members loaded:', data?.length);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);

    try {
      console.log('Searching users:', query);

      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      // Search by username using .or() syntax
      const { data, error } = await supabase
        .from('users')
        .select('id, name, username, profile_photo')
        .or(`username.ilike.%${query.trim()}%,name.ilike.%${query.trim()}%`);

      console.log('DATA:', data);
      console.log('ERROR:', error);

      if (error) {
        console.error('Supabase search error:', error);
        setSearchResults([]);
      } else {
        const memberIds = currentMembers.map(m => m.user_id);
        const filteredResults = (data || []).filter(u => !memberIds.includes(u.id));
        setSearchResults(filteredResults);
        console.log('Search results:', filteredResults.length);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!isAdmin) return;

    setAdding(userId);
    try {
      console.log('Adding member to group:', { chatId, userId });

      const { error } = await supabase
        .from('chat_participants')
        .insert({
          chat_id: chatId,
          user_id: userId,
          unread_count: 0,
        });

      if (error) {
        console.error('Error adding member:', error);
        alert('Failed to add member. Please try again.');
      } else {
        console.log('Member added successfully');
        
        setCurrentMembers(prev => [...prev, { id: userId, user_id: userId, chat_id: chatId }]);
        setSearchResults(prev => prev.filter(u => u.id !== userId));
        onMembersAdded();
      }
    } catch (error) {
      console.error('Error adding member:', error);
    } finally {
      setAdding(null);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  // Always show modal - but disable add button for non-admins
  console.log('AddGroupMembersModal render:', { isAdmin, groupAdminId, currentUserId });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            {isAdmin ? 'Add Members' : 'Group Members'}
          </DialogTitle>
          <DialogDescription>
            {isAdmin ? 'Add users to this group chat' : 'View group members'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search users to add..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Results */}
            <div className="max-h-64 overflow-y-auto">
              {searching ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-4 text-sm text-gray-500">
                  {searchQuery.trim().length < 2
                    ? 'Type to search users'
                    : 'No users found to add'}
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.profile_photo || ''} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            {getInitials(user.name || user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {user.name || user.username || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddMember(user.id)}
                        disabled={adding === user.id || !isAdmin}
                        title={isAdmin ? "Add to group" : "Only admin can add members"}
                      >
                        {adding === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isAdmin ? (
                          <UserPlus className="w-4 h-4" />
                        ) : (
                          <UserPlus className="w-4 h-4 opacity-50" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Current Members Count */}
            <div className="text-sm text-gray-500 pt-2 border-t">
              Current members: {currentMembers.length}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}