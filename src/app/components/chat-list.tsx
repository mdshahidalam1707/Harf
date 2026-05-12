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

  const loadChats = async () => {
    const cacheKey = `chats_cache_${currentUser.id}`;
    let isTimedOut = false;
    
    const timeoutId = setTimeout(() => {
      isTimedOut = true;
      setLoading(false);
    }, 5000);

    try {
      const { data: participantData, error: pError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', currentUser.id);

      if (pError || !participantData || participantData.length === 0) {
        setChats([getHarfAIChat()]);
        setLoading(false);
        clearTimeout(timeoutId);
        return;
      }

      const chatIds = participantData.map(p => p.chat_id);
      const { data: chatsData, error: cError } = await supabase
        .from('chats')
        .select('*')
        .in('id', chatIds)
        .order('created_at', { ascending: false });

      if (cError || !chatsData || isTimedOut) {
        clearTimeout(timeoutId);
        return;
      }

      const pinned = JSON.parse(localStorage.getItem(`pinned_${currentUser.id}`) || '[]');
      const archived = JSON.parse(localStorage.getItem(`archived_${currentUser.id}`) || '[]');
      const muted = JSON.parse(localStorage.getItem(`muted_${currentUser.id}`) || '[]');

      const chatsWithDetails = await Promise.all(chatsData.map(async (chat) => {
        try {
          const [lastMsgRes, extraRes] = await Promise.all([
            supabase.from('messages').select('content, created_at, sender_id').eq('chat_id', chat.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
            chat.is_group 
              ? supabase.from('groups').select('*').eq('chat_id', chat.id).single()
              : supabase.from('chat_participants').select('user_id').eq('chat_id', chat.id).neq('user_id', currentUser.id).single()
          ]);

          let details: Chat = { ...chat, last_message: lastMsgRes.data || undefined, unread_count: 0, pinned: pinned.includes(chat.id), muted: muted.includes(chat.id) };

          if (chat.is_group) {
            details.group = extraRes.data || undefined;
          } else {
            const otherId = (extraRes.data as any)?.user_id;
            if (otherId) {
              const { data: u } = await supabase.from('users').select('id, name, username, email, profile_photo, online, profession').eq('id', otherId).single();
              details.other_user = u || undefined;
            }
          }
          return details;
        } catch (e) { return { ...chat, unread_count: 0 }; }
      }));

      // Deduplicate and Sort
      const unique: Chat[] = [];
      const seen = new Set<string>();
      const sorted = chatsWithDetails.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });

      for (const c of sorted) {
        if (!c.is_group && c.other_user) {
          if (seen.has(c.other_user.id)) continue;
          seen.add(c.other_user.id);
        }
        if (!archived.includes(c.id)) unique.push(c);
      }

      const final = [getHarfAIChat(), ...unique.filter(c => c.id !== 'harf-ai-chat')];
      setChats(final);
      localStorage.setItem(cacheKey, JSON.stringify(final));
      setLoading(false);
      clearTimeout(timeoutId);
    } catch (e) {
      setLoading(false);
      clearTimeout(timeoutId);
    }
  };

  useEffect(() => {
    const cacheKey = `chats_cache_${currentUser.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setChats(parsed.length > 0 ? parsed : [getHarfAIChat()]);
        setLoading(false);
      } catch (e) {}
    }
    loadChats();
    const sub = supabase.channel('chat-list-v2').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => loadChats()).subscribe();
    return () => { sub.unsubscribe(); };
  }, [currentUser.id]);

  const getChatTitle = (chat: Chat) => {
    if (chat.is_group) return chat.group?.name || 'Group';
    const u = chat.other_user;
    if (!u) return 'User';
    return u.username || u.name || (u.email ? u.email.split('@')[0] : 'User');
  };

  const getLastMsg = (chat: Chat) => {
    if (chat.other_user?.profession) return chat.other_user.profession;
    if (chat.last_message) return chat.last_message.content;
    return 'Start chatting...';
  };

  if (loading && !chats.length) return <div className="flex items-center justify-center h-full"><div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  const archived = JSON.parse(localStorage.getItem(`archived_${currentUser.id}`) || '[]');

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {archived.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 cursor-pointer">
          <div className="flex items-center gap-3"><Archive className="w-5 h-5 text-blue-600" /><span className="text-sm font-bold">Archived</span></div>
          <Badge className="bg-blue-100 text-blue-700">{archived.length}</Badge>
        </div>
      )}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {chats.map(chat => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`group flex items-center gap-4 px-4 py-4 cursor-pointer border-b border-slate-50 relative ${selectedChatId === chat.id ? 'bg-blue-50/80 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-blue-600' : 'hover:bg-slate-50'}`}
          >
            <div className="relative">
              <Avatar className="w-12 h-12 shadow-sm">
                <AvatarImage src={chat.is_group ? chat.group?.group_icon : chat.other_user?.profile_photo} />
                <AvatarFallback className="bg-blue-600 text-white font-bold">{getChatTitle(chat).slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              {!chat.is_group && chat.other_user?.online && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-extrabold text-sm text-slate-900 truncate">{getChatTitle(chat)}</h4>
                {chat.last_message && <span className="text-[10px] text-slate-400 font-bold">{format(new Date(chat.last_message.created_at), 'HH:mm')}</span>}
              </div>
              <p className="text-xs font-medium text-slate-500 truncate">{getLastMsg(chat)}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {(chat as any).muted && <BellOff className="w-3.5 h-3.5 text-slate-300" />}
              {(chat as any).pinned && <Pin className="w-3.5 h-3.5 text-blue-600" />}
              {chat.unread_count !== undefined && chat.unread_count > 0 && <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold">{chat.unread_count}</div>}
            </div>
            <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu open={openMenuId === chat.id} onOpenChange={(o) => !o && setOpenMenuId(null)}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={(e) => { e.stopPropagation(); setOpenMenuId(chat.id); }}>
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#232d36] text-white border-none">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchiveChat?.(chat.id, true); }} className="gap-2 focus:bg-slate-700 focus:text-white"><Archive className="w-4 h-4" /> Archive</DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPinChat?.(chat.id, !(chat as any).pinned); }} className="gap-2 focus:bg-slate-700 focus:text-white"><Pin className="w-4 h-4" /> {(chat as any).pinned ? 'Unpin' : 'Pin'}</DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeleteChat?.(chat.id); }} className="gap-2 focus:bg-red-900 focus:text-red-400 text-red-400"><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}