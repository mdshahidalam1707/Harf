import { useEffect, useState, useRef } from 'react';
import { supabase, Message, User, sendMessage, markMessagesAsSeen, uploadChatMedia } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Send, Check, CheckCheck, MoreVertical, User as UserIcon, Phone, Video, Search, Image, Bookmark, Archive, BellOff, Bell, Trash, Trash2, Ban, Flag, Paperclip, Mic, X, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatWindowProps {
  chatId: string;
  currentUser: User;
  otherUser?: User;
  isGroup: boolean;
  groupName?: string;
  groupAdminId?: string;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  onMessageSent?: () => void;
  initialMessage?: string;
  onBack?: () => void;
  onViewProfile?: (userId: string) => void;
}

export function ChatWindow({ chatId, currentUser, otherUser, isGroup, groupName, onVoiceCall, onVideoCall, onMessageSent, initialMessage, onBack, onViewProfile }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsSubscribed(false);
    if (chatId === 'harf-ai-chat') {
      loadHarfAIMessages();
    } else {
      loadMessages();
      const cleanup = subscribeToMessages();
      markMessagesAsSeen(chatId);
      
      // Load local storage preferences
      setIsPinned(JSON.parse(localStorage.getItem(`pinned_${currentUser.id}`) || '[]').includes(chatId));
      setIsMuted(JSON.parse(localStorage.getItem(`muted_${currentUser.id}`) || '[]').includes(chatId));
      setIsArchived(JSON.parse(localStorage.getItem(`archived_${currentUser.id}`) || '[]').includes(chatId));
      
      return () => {
        if (cleanup && typeof cleanup === 'function') {
          cleanup();
        }
      };
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadHarfAIMessages = () => {
    setLoading(true);
    const saved = localStorage.getItem(`harf_ai_messages_${currentUser.id}`);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      const initialMsgs: Message[] = [{
        id: 'welcome',
        chat_id: 'harf-ai-chat',
        content: 'Hi! I am Harf AI, your professional assistant. How can I help you navigate Harf today?',
        created_at: new Date().toISOString(),
        sender_id: 'harf-ai-bot',
        status: 'seen',
        sender: {
          id: 'harf-ai-bot',
          name: 'Harf AI',
          profile_photo: 'https://api.dicebear.com/7.x/bottts/svg?seed=harf'
        } as any
      }];
      setMessages(initialMsgs);
      localStorage.setItem(`harf_ai_messages_${currentUser.id}`, JSON.stringify(initialMsgs));
    }
    setLoading(false);
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:users!messages_sender_id_fkey(*)')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        alert('Error loading chat: ' + error.message);
        setMessages([]);
      } else {
        setMessages(data || []);
      }
    } catch (error: any) {
      console.error('Error in loadMessages:', error);
      alert('Error: ' + error.message);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (isSubscribed) return () => {};
    
    const channel = supabase
      .channel(`messages-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          // Get sender info
          const { data: senderData } = await supabase
            .from('users')
            .select('*')
            .eq('id', (payload.new as Message).sender_id)
            .single();

          const newMessage: Message = {
            ...(payload.new as Message),
            sender: senderData || undefined,
          };

          setMessages(prev => [...prev, newMessage]);

          // Mark as seen if message is from other user
          if ((payload.new as Message).sender_id !== currentUser.id) {
            markMessagesAsSeen(chatId);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === (payload.new as Message).id
                ? { ...msg, ...(payload.new as Message) }
                : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage('');

    if (chatId === 'harf-ai-chat') {
      const userMsg: Message = {
        id: Date.now().toString(),
        chat_id: 'harf-ai-chat',
        content,
        created_at: new Date().toISOString(),
        sender_id: currentUser.id,
        status: 'seen',
        sender: currentUser
      };

      const updatedMsgs = [...messages, userMsg];
      setMessages(updatedMsgs);
      localStorage.setItem(`harf_ai_messages_${currentUser.id}`, JSON.stringify(updatedMsgs));
      localStorage.setItem(`harf_ai_last_msg_${currentUser.id}`, JSON.stringify(userMsg));

      // AI Response
      setTimeout(() => {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          chat_id: 'harf-ai-chat',
          content: getAIResponse(content),
          created_at: new Date().toISOString(),
          sender_id: 'harf-ai-bot',
          status: 'seen',
          sender: {
            id: 'harf-ai-bot',
            name: 'Harf AI',
            profile_photo: 'https://api.dicebear.com/7.x/bottts/svg?seed=harf'
          } as any
        };
        const finalMsgs = [...updatedMsgs, aiMsg];
        setMessages(finalMsgs);
        localStorage.setItem(`harf_ai_messages_${currentUser.id}`, JSON.stringify(finalMsgs));
        localStorage.setItem(`harf_ai_last_msg_${currentUser.id}`, JSON.stringify(aiMsg));
        if (onMessageSent) onMessageSent();
      }, 1000);
      
      return;
    }

    try {
      setSending(true);
      await sendMessage(chatId, content);
      if (onMessageSent) onMessageSent();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getAIResponse = (input: string) => {
    const lower = input.toLowerCase();
    if (lower.includes('hello') || lower.includes('hi')) return "Hello! I am Harf AI. I can help you find jobs, connect with professionals, or navigate the community. What's on your mind?";
    if (lower.includes('job') || lower.includes('hiring')) return "You can check the 'Jobs' tab to find the latest opportunities, or use the 'Professional Board' in the Feed to see what's trending!";
    if (lower.includes('status')) return "Statuses are a great way to share what you're working on. You can add one by clicking the '+' on your avatar in the Feed!";
    if (lower.includes('connect')) return "Head over to the 'Network' tab to find and connect with people in your industry.";
    if (lower.includes('help')) return "I am here to help! You can ask me about app features, finding jobs, or connecting with others.";
    return "That sounds interesting! Harf is designed to help professionals like you grow. Is there anything specific about the app you'd like to know more about?";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingMedia(true);
      
      // Basic validation
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size must be less than 10MB');
        return;
      }

      const mediaUrl = await uploadChatMedia(file, chatId);
      
      if (mediaUrl) {
        const mediaType = file.type.startsWith('image/') ? 'image' 
                        : file.type.startsWith('video/') ? 'video' 
                        : file.type.startsWith('audio/') ? 'audio' 
                        : 'document';
                        
        await sendMessage(chatId, file.name, mediaUrl, mediaType);
      } else {
        alert('Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        if (audioBlob.size > 0) {
          const file = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
          
          try {
            setUploadingMedia(true);
            const mediaUrl = await uploadChatMedia(file, chatId);
            if (mediaUrl) {
              await sendMessage(chatId, 'Voice note', mediaUrl, 'audio');
            } else {
              alert('Failed to upload voice note');
            }
          } catch (error) {
            console.error('Error sending voice note:', error);
          } finally {
            setUploadingMedia(false);
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView();
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
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderMessageStatus = (message: Message) => {
    if (message.sender_id !== currentUser.id) return null;

    const status = message.status || 'sent';
    switch (status) {
      case 'sent':
        return <Check className="w-3.5 h-3.5 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />;
      case 'seen':
        return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
      default:
        return <Check className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  // Feature functions
  const getBackendUrl = () => {
    const url = import.meta.env.VITE_BACKEND_URL;
    if (!url) {
      console.error('VITE_BACKEND_URL is not defined');
      return 'http://127.0.0.1:5001';
    }
    return url;
  };

  const handleViewProfile = () => {
    setShowMenu(false);
    if (otherUser) {
      if (onViewProfile) onViewProfile(otherUser.id);
      else alert(`Profile: ${otherUser.name || otherUser.email}`);
    }
  };

  const handleSearchChat = () => {
    setShowMenu(false);
    setIsSearching(true);
  };

  const handleMedia = () => {
    setShowMenu(false);
    setShowMediaModal(true);
  };

  const toggleLocalStorageArrayItem = (key: string, item: string) => {
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    const index = arr.indexOf(item);
    if (index > -1) {
      arr.splice(index, 1);
    } else {
      arr.push(item);
    }
    localStorage.setItem(key, JSON.stringify(arr));
    // Trigger storage event so ChatList can update
    window.dispatchEvent(new Event('storage'));
    return arr.includes(item);
  };

  const handlePinChat = () => {
    setShowMenu(false);
    const pinned = toggleLocalStorageArrayItem(`pinned_${currentUser.id}`, chatId);
    setIsPinned(pinned);
  };

  const handleArchiveChat = () => {
    setShowMenu(false);
    const archived = toggleLocalStorageArrayItem(`archived_${currentUser.id}`, chatId);
    setIsArchived(archived);
  };

  const handleMuteChat = () => {
    setShowMenu(false);
    const muted = toggleLocalStorageArrayItem(`muted_${currentUser.id}`, chatId);
    setIsMuted(muted);
  };

  const handleClearChat = async () => {
    if (!confirm('Clear all messages for everyone?')) return;
    setShowMenu(false);
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('chat_id', chatId);

      if (error) throw error;
      setMessages([]);
    } catch (e: any) { 
      console.error('Clear error:', e); 
      alert(`Error clearing chat: ${e.message}`); 
    }
  };

  const handleDeleteChat = async () => {
    if (!confirm('Delete this chat entirely? This cannot be undone.')) return;
    setShowMenu(false);
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (error) throw error;
      window.location.reload(); // Quick reset since chat no longer exists
    } catch (e: any) { 
      console.error('Delete error:', e); 
      alert(`Error deleting chat: ${e.message}`);
    }
  };

  const handleBlockUser = async () => {
    if (!otherUser || !confirm(`Block ${otherUser.name || 'user'}?`)) return;
    setShowMenu(false);
    try {
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/user/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, blocked_user_id: otherUser.id, block: true })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Error: ${data.error || 'Failed to block user'}`);
        return;
      }
      alert('User blocked');
    } catch (e: any) { 
      console.error('Block error:', e); 
      alert(`Error: ${e.message}`); 
    }
  };

  const handleReportUser = async () => {
    if (!otherUser) return;
    const reason = prompt('Reason for reporting:');
    if (!reason) return;
    setShowMenu(false);
    try {
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/user/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reporter_id: currentUser.id, reported_user_id: otherUser.id, reason, chat_id: chatId })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Error: ${data.error || 'Failed to report user'}`);
        return;
      }
      alert('User reported');
    } catch (e: any) { 
      console.error('Report error:', e); 
      alert(`Error: ${e.message}`); 
    }
  };

  const chatTitle = isGroup ? groupName : otherUser?.username || otherUser?.email || otherUser?.name;
  const chatSubtitle = !isGroup 
    ? `${otherUser?.profession || 'Harf Member'}${otherUser?.online ? ' • Online' : ''}`
    : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="mr-1">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <Avatar className="w-10 h-10">
            <AvatarImage src={otherUser?.profile_photo} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              {chatTitle ? getInitials(chatTitle) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h3 className="font-semibold text-gray-900">{chatTitle || 'Chat'}</h3>
            {chatSubtitle && (
              <p className="text-xs text-gray-500">{chatSubtitle}</p>
            )}
          </div>
        </div>
        <div className="relative">
          <Button variant="ghost" size="icon" onClick={() => { console.log('Menu button clicked, showMenu was:', showMenu); setShowMenu(!showMenu); }}>
            <MoreVertical className="w-5 h-5" />
          </Button>
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-50 py-2 min-w-[200px]">
              <button onClick={handleViewProfile} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center">
                <UserIcon className="w-4 h-4 mr-2" /> View Profile
              </button>
              <button onClick={() => { console.log('Voice call button clicked'); setShowMenu(false); onVoiceCall?.(); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center">
                <Phone className="w-4 h-4 mr-2" /> Voice Call
              </button>
              <button onClick={() => { console.log('Video call button clicked'); setShowMenu(false); onVideoCall?.(); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center">
                <Video className="w-4 h-4 mr-2" /> Video Call
              </button>
              <div className="border-t my-1" />
              <button onClick={() => { setShowMenu(false); setIsSearching(true); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center">
                <Search className="w-4 h-4 mr-2" /> Search in Chat
              </button>
              <button onClick={() => { setShowMenu(false); setShowMediaModal(true); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center">
                <Image className="w-4 h-4 mr-2" /> Media & Files
              </button>
              <div className="border-t my-1" />
              <button onClick={handlePinChat} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center">
                <Bookmark className="w-4 h-4 mr-2" /> {isPinned ? 'Unpin Chat' : 'Pin Chat'}
              </button>
              <button onClick={handleArchiveChat} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center">
                <Archive className="w-4 h-4 mr-2" /> {isArchived ? 'Unarchive Chat' : 'Archive Chat'}
              </button>
              <button onClick={handleMuteChat} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center">
                {isMuted ? <Bell className="w-4 h-4 mr-2" /> : <BellOff className="w-4 h-4 mr-2" />} 
                {isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
              </button>
              <div className="border-t my-1" />
              <button onClick={handleClearChat} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center">
                <Trash className="w-4 h-4 mr-2" /> Clear Chat
              </button>
              <button onClick={handleDeleteChat} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center text-red-600">
                <Trash2 className="w-4 h-4 mr-2" /> Delete Chat
              </button>
              <button onClick={handleBlockUser} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center text-red-600">
                <Ban className="w-4 h-4 mr-2" /> Block User
              </button>
              <button onClick={handleReportUser} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center text-red-600">
                <Flag className="w-4 h-4 mr-2" /> Report User
              </button>
            </div>
            </>
          )}
        </div>
      </div>

      {/* Search Bar Overlay */}
      {isSearching && (
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          <Input 
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="flex-1 bg-gray-100 border-none rounded-full"
          />
          <Button variant="ghost" size="icon" onClick={() => { setIsSearching(false); setSearchQuery(''); }}>
            <X className="w-5 h-5 text-gray-500" />
          </Button>
        </div>
      )}

      {/* Media Gallery Modal */}
      {showMediaModal && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Media, links, and docs</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowMediaModal(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-2">
            {messages.filter(m => m.media_url).length === 0 ? (
              <div className="col-span-3 text-center text-gray-500 mt-10">No media in this chat</div>
            ) : (
              messages.filter(m => m.media_url).map(m => (
                <div key={m.id} className="aspect-square bg-gray-100 rounded-md overflow-hidden cursor-pointer flex items-center justify-center">
                  {m.media_type === 'image' && <img src={m.media_url} className="w-full h-full object-cover" />}
                  {m.media_type === 'video' && <video src={m.media_url} className="w-full h-full object-cover" />}
                  {m.media_type === 'audio' && <div className="text-blue-500"><Mic className="w-8 h-8" /></div>}
                  {m.media_type === 'document' && <div className="text-gray-500 flex flex-col items-center"><Paperclip className="w-6 h-6 mb-1" /><span className="text-[10px] truncate w-full px-2 text-center">{m.content}</span></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-center">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.filter(m => !searchQuery || m.content.toLowerCase().includes(searchQuery.toLowerCase())).map(message => {
            const isOwnMessage = message.sender_id === currentUser.id;
            const senderName = message.sender?.username || message.sender?.email || message.sender?.name || 'Unknown';
            const senderEmail = message.sender?.email;

            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[70%] rounded-lg px-4 py-2
                    ${isOwnMessage
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                    }
                  `}
                >
                  {/* Show sender name in group chats for others' messages */}
                  {isGroup && !isOwnMessage && (
                    <div className="mb-1">
                      <p className="text-xs font-semibold text-blue-600">
                        {senderName}
                      </p>
                      {senderEmail && (
                        <p className="text-[10px] text-gray-400">{senderEmail}</p>
                      )}
                    </div>
                  )}
                  
                  {message.media_url ? (
                    <div className="mb-2">
                      {message.media_type === 'image' ? (
                        <img src={message.media_url} alt="Shared image" className="max-w-full rounded-md" />
                      ) : message.media_type === 'audio' ? (
                        <audio controls className="max-w-full h-10">
                          <source src={message.media_url} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      ) : message.media_type === 'video' ? (
                        <video controls className="max-w-full rounded-md">
                          <source src={message.media_url} />
                          Your browser does not support the video element.
                        </video>
                      ) : (
                        <a href={message.media_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-500 hover:underline">
                          <Paperclip className="w-4 h-4" />
                          <span className="truncate">{message.content}</span>
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm break-words">{message.content}</p>
                  )}
                  
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span
                      className={`text-xs ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {formatMessageTime(message.created_at)}
                    </span>
                    {renderMessageStatus(message)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingMedia || sending}
            className="text-gray-500 hover:text-blue-600 shrink-0"
          >
            {uploadingMedia ? (
              <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </Button>

          <Input
            type="text"
            placeholder={isRecording ? "Recording..." : "Type a message..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending || uploadingMedia || isRecording}
            className="flex-1"
          />

          {isRecording && (
            <div className="flex items-center gap-2 text-red-500 mr-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium">{formatRecordingTime(recordingTime)}</span>
            </div>
          )}

          {!newMessage.trim() && !uploadingMedia ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`${isRecording ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100' : 'text-gray-500 hover:text-blue-600'} shrink-0 rounded-full`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? <Send className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!newMessage.trim() || sending || uploadingMedia}
              className="bg-blue-500 hover:bg-blue-600 shrink-0"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}