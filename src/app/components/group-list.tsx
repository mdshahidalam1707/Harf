import { useEffect, useState } from 'react';
import { supabase, User } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Button } from '@/app/components/ui/button';
import { Users, Plus, MoreVertical, LogOut, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GroupListProps {
  currentUser: User;
  onSelectChat: (chatId: string) => void;
  onCreateGroup: () => void;
}

interface GroupItem {
  id: string;
  chat_id: string;
  name: string;
  group_icon?: string;
  admin_id: string;
  created_at: string;
}

export function GroupList({ currentUser, onSelectChat, onCreateGroup }: GroupListProps) {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();
  }, [currentUser?.id]);

const loadGroups = async () => {
    if (!currentUser?.id) return;
    
    setLoading(true);
    try {
      console.log('=== loadGroups START for user:', currentUser.id);
      
      // First: Get all chats and participants directly (no .in())
      const allChats = await supabase.from('chats').select('id, is_group').limit(50);
      console.log('All chats:', allChats.data?.length);

      const allParts = await supabase.from('chat_participants').select('chat_id, user_id');
      console.log('All participants:', allParts.data?.length);

      if (!allChats.data || !allParts.data) {
        setGroups([]);
        setLoading(false);
        return;
      }

      // Find user's chat IDs
      const userChatIdsSet = new Set(
        allParts.data
          .filter((p: any) => p.user_id === currentUser.id)
          .map((p: any) => p.chat_id)
      );
      console.log('User chat IDs:', userChatIdsSet.size);

      // Get ALL groups from database
      const allGroups = await supabase.from('groups').select('*');
      console.log('All groups:', allGroups.data?.length);

      let finalGroups: any[] = [];
      
      if (allGroups.data && allGroups.data.length > 0) {
        // Debug: show all group chat_ids
        console.log('All group chat_ids:', allGroups.data.map((g: any) => g.chat_id?.substring(0,8)));
        console.log('User chat_ids (set):', Array.from(userChatIdsSet).map((id: string) => id.substring(0,8)));
        
        // Debug: find which user chat is a group
        const userChatArr = Array.from(userChatIdsSet);
        for (const chatId of userChatArr) {
          const found = allGroups.data.find((g: any) => g.chat_id === chatId);
          console.log('Chat', chatId.substring(0,8), found ? 'IN GROUPS TABLE' : 'not in groups');
        }
        
        // Filter to user's chats
        finalGroups = allGroups.data.filter((g: any) => userChatIdsSet.has(g.chat_id));
        console.log('Filtered user groups:', finalGroups.length);
      }

      // If still 0, use chats where is_group = true (no .in())
      if (finalGroups.length === 0) {
        console.log('No groups table data - using is_group chats');
        
        // Get ALL chats as fallback (no .in() to avoid 400 error)
        const fallbackChats = await supabase.from('chats').select('*').limit(50);
        console.log('Fallback chats:', { count: fallbackChats.data?.length });
        
        if (fallbackChats.data && fallbackChats.data.length > 0) {
          // Filter: is_group=true AND user is participant
          finalGroups = fallbackChats.data
            .filter((c: any) => {
              // Is it a group?
              if (!c.is_group) return false;
              // Is user in this chat?
              return userChatIdsSet.has(c.id);
            })
            .map((c: any) => ({
              chat_id: c.id,
              name: c.name || 'Group',
              group_icon: null,
              admin_id: currentUser.id,
              created_at: c.created_at,
            }));
          
          console.log('Filtered is_group=true chats:', finalGroups.length);
        }
      }
      
      console.log('Final groups:', finalGroups.length);
      setGroups(finalGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleExitGroup = async (group: GroupItem) => {
    if (!confirm('Are you sure you want to exit this group?')) return;
    
    try {
      await supabase
        .from('chat_participants')
        .delete()
        .eq('chat_id', group.chat_id)
        .eq('user_id', currentUser.id);
      
      loadGroups();
    } catch (error) {
      console.error('Error exiting group:', error);
    }
  };

  const handleDeleteGroup = async (group: GroupItem) => {
    if (group.admin_id !== currentUser.id) {
      alert('Only group admin can delete');
      return;
    }
    
    if (!confirm('Delete this group? This cannot be undone.')) return;
    
    try {
      await supabase.from('groups').delete().eq('id', group.id);
      await supabase.from('chat_participants').delete().eq('chat_id', group.chat_id);
      await supabase.from('chats').delete().eq('id', group.chat_id);
      
      loadGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading groups...</p>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Users className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Groups Yet</h3>
        <p className="text-sm text-gray-500 mb-4">
          Create a group to chat with multiple people
        </p>
        <Button onClick={onCreateGroup} className="bg-blue-500 hover:bg-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-2">
        <Button
          onClick={onCreateGroup}
          className="w-full mb-4 bg-blue-500 hover:bg-blue-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Group
        </Button>
      </div>
      
      <div className="divide-y">
        {groups.map(group => (
          <div
            key={group.id}
            className="relative"
          >
            <div
              onClick={() => onSelectChat(group.chat_id)}
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50"
            >
              <Avatar className="w-12 h-12 flex-shrink-0">
                <AvatarImage src={group.group_icon || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  {getInitials(group.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">
                  {group.name}
                </h4>
                <p className="text-xs text-gray-500">
                  Created {formatDistanceToNow(new Date(group.created_at), { addSuffix: true })}
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(menuOpen === group.id ? null : group.id);
                }}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Dropdown Menu */}
            {menuOpen === group.id && (
              <div className="absolute right-2 top-12 bg-white border rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                <button
                  onClick={() => {
                    handleExitGroup(group);
                    setMenuOpen(null);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Exit Group
                </button>
                {group.admin_id === currentUser.id && (
                  <button
                    onClick={() => {
                      handleDeleteGroup(group);
                      setMenuOpen(null);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Group
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}