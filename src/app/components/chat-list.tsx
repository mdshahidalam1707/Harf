import { useEffect, useState } from 'react';
import { supabase, Chat, User } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { format } from 'date-fns';
import { Badge } from '@/app/components/ui/badge';
import { MessageCircle, MoreVertical, Search, Image, Pin, Archive, BellOff, Trash2, Ban, Bookmark, PinOff, ArchiveRestore, Bell } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { Button } from '@/app/components/ui/button';

interface ChatListProps {
  currentUser: User;
  selectedChatId?: string;
  onSelectChat: (chatId: string) => void;
  onRefresh?: () => void;
  onSearchChat?: (chatId: string) => void;
  onViewMedia?: (chatId: string) => void;
  onPinChat?: (chatId: string, pin: boolean) => void;
  onMuteChat?: (chatId: string, mute: boolean) => void;
  onDeleteChat?: (chatId: string) => void;
  onArchiveChat?: (chatId: string, archive: boolean) => void;
  onPinUser?: (userId: string, pin: boolean) => void;
  onArchiveUser?: (userId: string, archive: boolean) => void;
  onMuteUser?: (userId: string, mute: boolean) => void;
  onBlockUser?: (userId: string, block: boolean) => void;
  onClearChat?: (chatId: string) => void;
  onMarkUnread?: (chatId: string, unread: boolean) => void;
}

export function ChatList({ 
  currentUser, 
  selectedChatId, 
  onSelectChat, 
  onSearchChat,
  onViewMedia,
  onPinChat,
  onMuteChat,
  onDeleteChat,
  onArchiveChat,
  onPinUser,
  onArchiveUser,
  onMuteUser,
  onBlockUser,
  onClearChat,
  onMarkUnread
}: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadChats();
    const cleanup = subscribeToChats();
    return () => { cleanup(); };
  }, [currentUser.id]);

  const loadChats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching chats for user:', currentUser.id);

      // Simple query - get all chats user is part of
      const { data: participantData, error: pError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', currentUser.id);

      console.log('Participant data:', participantData);
      console.log('Participant error:', pError);

      if (pError) {
        console.error('Participant fetch error:', pError);
        setError(pError.message);
        setLoading(false);
        return;
      }

      if (!participantData || participantData.length === 0) {
        console.log('No chats found');
        setChats([]);
        setLoading(false);
        return;
      }

      // Get chat IDs
      const chatIds = participantData.map(p => p.chat_id);
      console.log('Chat IDs:', chatIds);

      // Get chat details - use created_at instead of updated_at
      const { data: chatsData, error: cError } = await supabase
        .from('chats')
        .select('*')
        .in('id', chatIds)
        .order('created_at', { ascending: false });

      console.log('Chats data:', chatsData);
      console.log('Chats error:', cError);

      if (cError) {
        console.error('Chats fetch error:', cError);
        setError(cError.message);
        setLoading(false);
        return;
      }

      if (!chatsData || chatsData.length === 0) {
        // Even if no chats, ensure Harf AI is visible
        setChats([getHarfAIChat()]);
        setLoading(false);
        return;
      }

      // Get additional info for each chat
      const chatsWithDetails: Chat[] = [];

      for (const chat of chatsData) {
        try {
          // Get last message - use maybeSingle instead of single
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('id, content, created_at, sender_id')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          let chatDetails: Chat = {
            ...chat,
            last_message: lastMsg || undefined,
            unread_count: 0,
          };

          if (chat.is_group) {
            const { data: grp } = await supabase
              .from('groups')
              .select('*')
              .eq('chat_id', chat.id)
              .single();
            chatDetails.group = grp || undefined;
          } else {
            // Get other participant ID first
            const { data: otherPart } = await supabase
              .from('chat_participants')
              .select('user_id')
              .eq('chat_id', chat.id)
              .neq('user_id', currentUser.id)
              .single();

            console.log('Other participant ID:', otherPart?.user_id);
            
            if (otherPart?.user_id) {
              // Get user details directly from users table
              const { data: userData } = await supabase
                .from('users')
                .select('id, name, username, email, profile_photo, online, profession')
                .eq('id', otherPart.user_id)
                .single();
              
              // Always set user data - even if undefined
              chatDetails.other_user = userData || undefined;
            }
          }

          chatsWithDetails.push(chatDetails);
        } catch (e) {
          console.error('Error loading chat details:', e);
        }
      }

      console.log('Final chats:', chatsWithDetails.map(c => ({
        id: c.id,
        title: c.is_group ? c.group?.name : (c.other_user?.email || c.other_user?.name || 'No user')
      })));
      
      const pinned = JSON.parse(localStorage.getItem(`pinned_${currentUser.id}`) || '[]');
      const archived = JSON.parse(localStorage.getItem(`archived_${currentUser.id}`) || '[]');
      const muted = JSON.parse(localStorage.getItem(`muted_${currentUser.id}`) || '[]');

      // Sort by created_at first to handle deduplication correctly
      const initialSorted = [...chatsWithDetails]
        .sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });

      // Deduplicate: only keep the most recent chat for each user pair
      const uniqueChats: Chat[] = [];
      const seenUserIds = new Set<string>();

      for (const chat of initialSorted) {
        if (!chat.is_group && chat.other_user) {
          if (seenUserIds.has(chat.other_user.id)) continue;
          seenUserIds.add(chat.other_user.id);
        }
        uniqueChats.push(chat);
      }


      // Final filter and sort by pinning
      const sortedChats = uniqueChats
        .filter(c => !archived.includes(c.id))
        .map(c => ({
          ...c,
          pinned: pinned.includes(c.id),
          muted: muted.includes(c.id)
        }))
        .sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });

      // Inject Harf AI at the top if not already present
      const finalChats = [getHarfAIChat(), ...sortedChats.filter(c => c.id !== 'harf-ai-chat')];
      
      setChats(finalChats);
    } catch (error) {
      console.error('Error loading chats:', error);
      setError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChats = () => {
    const sub = supabase
      .channel('chats-sub')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => loadChats())
      .subscribe();

    const handleStorageChange = () => loadChats();
    window.addEventListener('storage', handleStorageChange);

    return () => {
      sub.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  };

  const getChatTitle = (chat: Chat) => {
    if (chat.is_group) return chat.group?.name || 'Group';
    const user = chat.other_user;
    if (!user) return 'Unknown User';
    
    // Priority: Username -> Email
    const displayName = user.username || user.name || user.email || 'User';
    
    // Clean up if it's an email prefix
    if (displayName.includes('@')) {
      return displayName.split('@')[0]
        .replace(/[._]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    return displayName;
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.is_group) return chat.group?.group_icon;
    return chat.other_user?.profile_photo;
  };

  const getInitials = (name: string) => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';

  const formatTime = (ts: string) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return format(d, 'HH:mm');
    } catch (e) { return ''; }
  };

  const getHarfAIChat = (): Chat => ({
    id: 'harf-ai-chat',
    created_at: new Date().toISOString(),
    is_group: false,
    other_user: {
      id: 'harf-ai-bot',
      name: 'Harf AI',
      username: 'harfai',
      email: 'ai@harf.app',
      profile_photo: 'https://api.dicebear.com/7.x/bottts/svg?seed=harf',
      online: true,
      profession: 'AI Assistant'
    },
    unread_count: 0,
    pinned: true,
    updated_at: new Date().toISOString(),
    last_message: JSON.parse(localStorage.getItem(`harf_ai_last_msg_${currentUser.id}`) || 'null') || {
      content: 'Hi! I am Harf AI. How can I help you today?',
      created_at: new Date().toISOString()
    }
  });

  const getLastMsg = (chat: Chat) => {
    if (chat.is_group) {
      if (!chat.last_message) return 'Group conversation';
      const content = chat.last_message.content || 'Media';
      return chat.last_message.sender_id === currentUser.id ? `You: ${content}` : content;
    }

    const user = chat.other_user;
    if (!user) return 'Start chatting...';

    // Show Profession as subtitle
    if (user.profession) return user.profession;

    // Fallback if no profession: Show 'Member' or similar professional tag
    return 'Harf Community Member';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-center">
        <div>
          <p className="text-red-500">Error: {error}</p>
          <button onClick={loadChats} className="mt-2 text-blue-500 underline">Retry</button>
        </div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <MessageCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">No Chats Yet</h3>
        <p className="text-sm text-gray-500 mt-2">Click "New Chat" to start a conversation</p>
      </div>
    );
  }

  const archived = JSON.parse(localStorage.getItem(`archived_${currentUser.id}`) || '[]');

  const handleTouchStart = (chatId: string) => {
    const timer = setTimeout(() => {
      setOpenMenuId(chatId);
    }, 1000);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden select-none">
      {archived.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => {/* Toggle archived view logic could go here */}}>
          <div className="flex items-center gap-3">
             <Archive className="w-5 h-5 text-blue-600" />
             <span className="text-sm font-bold text-gray-700">Archived</span>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-bold text-[10px]">{archived.length}</Badge>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {chats.map(chat => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenMenuId(chat.id); }}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setOpenMenuId(chat.id); }}
            onTouchStart={() => handleTouchStart(chat.id)}
            onTouchEnd={handleTouchEnd}
            className={`group flex items-center gap-4 px-4 py-4 cursor-pointer border-b border-slate-50 transition-all duration-300 relative ${selectedChatId === chat.id ? 'bg-blue-50/80 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1.5 before:bg-blue-600 before:rounded-r-full shadow-sm z-10' : 'hover:bg-slate-50/80'}`}
          >
            <div className="relative">
              <div className={`p-0.5 rounded-full transition-all duration-300 ${
                !chat.is_group && chat.other_user?.online 
                  ? 'ring-[2.5px] ring-green-400/30' 
                  : !chat.is_group && chat.other_user?.profession?.toLowerCase().includes('hiring')
                  ? 'ring-[2.5px] ring-amber-400/30'
                  : !chat.is_group && chat.other_user?.profession 
                  ? 'ring-[2.5px] ring-blue-400/30'
                  : 'ring-1 ring-slate-100'
              }`}>
                <Avatar className="w-12 h-12 shadow-sm">
                  <AvatarImage src={getChatAvatar(chat)} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold">
                    {getInitials(getChatTitle(chat))}
                  </AvatarFallback>
                </Avatar>
              </div>
              {!chat.is_group && chat.other_user?.online && (
                <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 border-[2.5px] border-white rounded-full shadow-sm" />
              )}
            </div>

            <div className="flex-1 min-w-0 py-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-extrabold text-[15px] text-slate-900 tracking-tight truncate">
                  {getChatTitle(chat)}
                </h4>
                {chat.last_message && (
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider ml-2">
                    {formatTime(chat.last_message.created_at)}
                  </span>
                )}
              </div>
              <p className="text-[13px] font-medium text-slate-500 truncate">
                {getLastMsg(chat)}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-2 opacity-100 group-hover:opacity-0 transition-all duration-300">
                {(chat as any).muted && <BellOff className="w-3.5 h-3.5 text-slate-300" />}
                {(chat as any).pinned && <Pin className="w-3.5 h-3.5 text-blue-500 fill-blue-500 rotate-45" />}
                {chat.unread_count && chat.unread_count > 0 && !(chat as any).muted ? (
                  <div className="min-w-[20px] h-[20px] rounded-full bg-blue-600 flex items-center justify-center px-1.5 shadow-md shadow-blue-100">
                    <span className="text-[10px] font-black text-white">{chat.unread_count}</span>
                  </div>
                ) : null}
              </div>

              <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-full shadow-sm p-1">
                <DropdownMenu open={openMenuId === chat.id} onOpenChange={(open) => !open && setOpenMenuId(null)}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-gray-100" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-2xl border-none bg-[#232d36] text-white p-1">
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); onArchiveChat?.(chat.id, true); }}
                      className="gap-3 py-2.5 px-3 focus:bg-[#3b4a54] focus:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <Archive className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">Archive chat</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); onMuteChat?.(chat.id, !(chat as any).muted); }}
                      className="gap-3 py-2.5 px-3 focus:bg-[#3b4a54] focus:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      {(chat as any).muted ? <Bell className="w-4 h-4 text-gray-400" /> : <BellOff className="w-4 h-4 text-gray-400" />}
                      <span className="text-sm">{(chat as any).muted ? 'Unmute notifications' : 'Mute notifications'}</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); onPinChat?.(chat.id, !(chat as any).pinned); }}
                      className="gap-3 py-2.5 px-3 focus:bg-[#3b4a54] focus:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      {(chat as any).pinned ? <PinOff className="w-4 h-4 text-gray-400" /> : <Pin className="w-4 h-4 text-gray-400" />}
                      <span className="text-sm">{(chat as any).pinned ? 'Unpin chat' : 'Pin chat'}</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); onMarkUnread?.(chat.id, true); }}
                      className="gap-3 py-2.5 px-3 focus:bg-[#3b4a54] focus:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">Mark as unread</span>
                    </DropdownMenuItem>

                    <div className="h-[1px] bg-[#3b4a54] my-1 mx-2" />

                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); if(chat.other_user) onBlockUser?.(chat.other_user.id, true); }}
                      className="gap-3 py-2.5 px-3 focus:bg-[#3b4a54] focus:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <Ban className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">Block</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); onClearChat?.(chat.id); }}
                      className="gap-3 py-2.5 px-3 focus:bg-[#3b4a54] focus:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">Clear chat</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); onDeleteChat?.(chat.id); }}
                      className="gap-3 py-2.5 px-3 focus:bg-red-500/20 focus:text-red-400 rounded-lg transition-colors cursor-pointer text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Delete chat</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}