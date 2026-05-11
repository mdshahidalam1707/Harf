import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Loader2, Users, Check } from 'lucide-react';

interface UserOption {
  id: string;
  name: string | null;
  username: string | null;
  profile_photo: string | null;
}

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated: (chatId: string) => void;
  currentUserId?: string;
}

export function CreateGroupModal({ open, onOpenChange, onGroupCreated, currentUserId }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch available users when modal opens
  useEffect(() => {
    if (open) {
      loadAvailableUsers();
    }
  }, [open]);

  const loadAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, username, profile_photo')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      // Filter out current user
      const filteredUsers = (data || []).filter(u => u.id !== currentUserId);
      setAvailableUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSelectUser = (user: UserOption, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, user]);
    } else {
      setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    setCreating(true);
    try {
      console.log('Starting group creation...');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Authentication failed: ' + authError.message);
      }

      if (!user) {
        console.error('No user found');
        throw new Error('User not authenticated');
      }

      console.log('Creating chat for user:', user.id);

      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert({
          is_group: true,
        })
        .select()
        .single();

      console.log('Chat insert result:', { chatData, chatError });

      if (chatError) {
        console.error('Chat create error:', chatError);
        throw new Error('Failed to create chat: ' + chatError.message);
      }

      if (!chatData) {
        console.error('No chat data returned');
        throw new Error('Failed to create chat - no data returned');
      }

      console.log('Creating group with chat_id:', chatData.id);

      const { error: groupError } = await supabase
        .from('groups')
        .insert({
          chat_id: chatData.id,
          name: groupName.trim(),
          admin_id: user.id,
        });

      console.log('Group insert result:', { groupError });

      if (groupError) {
        console.error('Group create error:', groupError);
        
        await supabase.from('chats').delete().eq('id', chatData.id);
        
        throw new Error('Failed to create group: ' + groupError.message);
      }

      console.log('Adding creator as participant');

      // Add creator as participant
      const { error: creatorError } = await supabase
        .from('chat_participants')
        .insert({
          chat_id: chatData.id,
          user_id: user.id,
          unread_count: 0,
        });

      console.log('Creator participant result:', { creatorError });

      // Add selected users as participants
      if (selectedUsers.length > 0) {
        console.log('Adding selected members:', selectedUsers.length);
        
        const members = selectedUsers.map(u => ({
          chat_id: chatData.id,
          user_id: u.id,
          unread_count: 0,
        }));

        const { error: membersError } = await supabase
          .from('chat_participants')
          .insert(members);

        console.log('Members insert result:', { membersError });

        if (membersError) {
          console.error('Error adding members:', membersError);
        }
      }

      console.log('Group created successfully:', chatData.id);
      
      onGroupCreated(chatData.id);
      onOpenChange(false);
      setGroupName('');
      setGroupDescription('');
      setSelectedUsers([]);
      alert('Group created successfully!');
    } catch (error: any) {
      console.error('Error creating group:', error);
      alert(error?.message || 'Failed to create group. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // Reset selected users when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedUsers([]);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Create New Group
          </DialogTitle>
          <DialogDescription>
            Create a group chat to connect with multiple people
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
            />
          </div>

          {/* Group Description */}
          <div className="space-y-2">
            <Label htmlFor="group-description">Description (Optional)</Label>
            <Textarea
              id="group-description"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="What's this group about?"
              rows={2}
            />
          </div>

          {/* Add Members */}
          <div className="space-y-2">
            <Label>Add Members</Label>
            {loadingUsers ? (
              <div className="text-center py-2 text-gray-500">Loading users...</div>
            ) : availableUsers.length === 0 ? (
              <div className="text-center py-2 text-gray-500">No users available</div>
            ) : (
              <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                {availableUsers.map(user => {
                  const isSelected = selectedUsers.some(u => u.id === user.id);
                  return (
                    <div 
                      key={user.id} 
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                      onClick={() => handleSelectUser(user, !isSelected)}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.name || user.username || 'Unknown'}</p>
                        {user.username && (
                          <p className="text-xs text-gray-500">@{user.username}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {selectedUsers.length > 0 && (
              <p className="text-xs text-gray-500">
                {selectedUsers.length} member{selectedUsers.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Create Button */}
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={creating || !groupName.trim()}>
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Create Group
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}