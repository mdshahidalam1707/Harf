import { useEffect, useState } from 'react';
import { supabase, Chat, User } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, LogOut } from 'lucide-react';

interface ChatListProps {
  currentUser: User;
  selectedChatId?: string;
  onSelectChat: (chatId: string) => void;
  onLogout: () => void;
}

export function ChatList({ currentUser, selectedChatId, onSelectChat, onLogout }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
    subscribeToChats();
  }, [currentUser.id]);

  const loadChats = async () => {
    try {
      // Get all chats where current user is a participant
      const { data: participantData } = await supabase
        .from('chat_participants')
        .select(`
          chat_id,
          unread_count,
          chats (
            id,
            is_group,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', currentUser.id)
        .order('chats(updated_at)', { ascending: false });

      if (!participantData) {
        setLoading(false);
        return;
      }

      // For each chat, get additional data
      const chatsWithDetails = await Promise.all(
        participantData.map(async (participant: any) => {
          const chat = participant.chats;
          if (!chat) return null;

          // Get last message
          const { data: lastMessageData } = await supabase
            .from('messages')
            .select('*, sender:users!messages_sender_id_fkey(*)')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          let chatDetails: Chat = {
            ...chat,
            last_message: lastMessageData || undefined,
            unread_count: participant.unread_count,
          };

          if (chat.is_group) {
            // Get group details
            const { data: groupData } = await supabase
              .from('groups')
              .select('*')
              .eq('chat_id', chat.id)
              .single();

            chatDetails.group = groupData || undefined;
          } else {
            // Get other participant for one-on-one chat
            const { data: otherParticipantData } = await supabase
              .from('chat_participants')
              .select('user_id, users(*)')
              .eq('chat_id', chat.id)
              .neq('user_id', currentUser.id)
              .single();

            if (otherParticipantData) {
              chatDetails.other_user = (otherParticipantData as any).users;
            }
          }

          return chatDetails;
        })
      );

      setChats(chatsWithDetails.filter(Boolean) as Chat[]);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChats = () => {
    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadChats(); // Reload chats when new message arrives
        }
      )
      .subscribe();

    // Subscribe to participant changes (unread count)
    const participantsSubscription = supabase
      .channel('participants-channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_participants',
          filter: `user_id=eq.${currentUser.id}`,
        },
        () => {
          loadChats();
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      participantsSubscription.unsubscribe();
    };
  };

  const getChatTitle = (chat: Chat) => {
    if (chat.is_group) {
      return chat.group?.group_name || 'Group Chat';
    }
    return chat.other_user?.name || 'Unknown User';
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.is_group) {
      return chat.group?.group_icon;
    }
    return chat.other_user?.profile_photo;
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <MessageCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Chats Yet</h3>
        <p className="text-sm text-gray-500">
          Start a conversation by searching for users
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {chats.map(chat => (
        <div
          key={chat.id}
          onClick={() => onSelectChat(chat.id)}
          className={`
            flex items-center gap-3 p-4 cursor-pointer border-b border-gray-200
            hover:bg-gray-50 transition-colors
            ${selectedChatId === chat.id ? 'bg-blue-50' : ''}
          `}
        >
          {/* Avatar */}
          <Avatar className="w-12 h-12 flex-shrink-0">
            <AvatarImage src={getChatAvatar(chat)} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              {getInitials(getChatTitle(chat))}
            </AvatarFallback>
          </Avatar>

          {/* Chat Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-gray-900 truncate">
                {getChatTitle(chat)}
              </h4>
              {chat.last_message && (
                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                  {formatMessageTime(chat.last_message.created_at)}
                </span>
              )}
            </div>
            {/* Status for one-on-one chats */}
            {!chat.is_group && chat.other_user?.about && (
              <p className="text-xs text-gray-500 truncate mb-1">
                {chat.other_user.about}
              </p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 truncate">
                {chat.last_message ? (
                  <>
                    {chat.last_message.sender_id === currentUser.id && (
                      <span className="mr-1">You: </span>
                    )}
                    {chat.last_message.content}
                  </>
                ) : (
                  <span className="italic">No messages yet</span>
                )}
              </p>
              {(chat.unread_count ?? 0) > 0 && (
                <Badge className="ml-2 bg-green-500 hover:bg-green-600">
                  {chat.unread_count}
                </Badge>
              )}
            </div>
            {/* Online status for one-on-one chats */}
            {!chat.is_group && chat.other_user?.online && (
              <div className="flex items-center gap-1 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600">Online</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}