import { useEffect, useState, useRef } from "react";
import {
  supabase,
  User,
  updateOnlineStatus,
} from "../../lib/supabase";
import { ChatList } from "./chat-list";
import { ChatWindow } from "./chat-window";
import { UserSearch } from "./user-search";
import { ProfileModal } from "./profile-modal";
import { SettingsModal } from "./settings-modal";
import { CreateGroupModal } from "./create-group-modal";
import { CallsModal } from "./calls-modal";
import { GroupList } from "./group-list";
import { CommunityView } from "./communities/community-view";
import { PublicProfileModal } from "./public-profile-modal";
import { Feed } from "./feed";
import { NetworkView as Network } from "./network/network-view";
import { DiscoveryView } from "./discovery/discovery-view";
import { NotificationCenter } from "./notification-center";
import { JobMarketplace } from "./jobs/job-marketplace";
import { createNotification } from "../../lib/supabase";
import { Button } from "./ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./ui/avatar";
import {
  MessageCircle,
  LogOut,
  User as UserIcon,
  Settings,
  Users,
  ArrowLeft,
  Search,
  Phone,
  Video,
  Mic,
  LayoutGrid,
  Network as NetworkIcon,
  Plus,
  Briefcase,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

interface ChatAppProps {
  user: User;
  onLogout: () => void;
  onUserUpdate?: (user: User) => void;
}

const VideoPlayer = ({ stream }: { stream: MediaStream | null }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  if (!stream) return null;
  return <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />;
};

export function ChatApp({ user, onLogout, onUserUpdate }: ChatAppProps) {
  const [selectedChatId, setSelectedChatId] = useState<
    string | null
  >(null);
  const [selectedChatData, setSelectedChatData] =
    useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [showUserSearchOpen, setShowUserSearchOpen] = useState(false);
  const [showCallsModal, setShowCallsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"chats" | "groups" | "network" | "explore" | "feed" | "marketplace">("chats");
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [callState, setCallState] = useState<{
    active: boolean;
    type: 'voice' | 'video' | null;
    targetUser: User | null;
    localStream: any;
    remoteStream: any;
  }>({
    active: false,
    type: null,
    targetUser: null,
    localStream: null,
    remoteStream: null,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobileView(width < 768);
      console.log('Screen width:', width, 'Is mobile:', width < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Set user as online when component mounts
    updateOnlineStatus(true);

    // Set up visibility change listener
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateOnlineStatus(false);
      } else {
        updateOnlineStatus(true);
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    // Set user as offline when component unmounts
    return () => {
      updateOnlineStatus(false);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, []);

  useEffect(() => {
    // Restore chat from localStorage on load
    const savedChatId = localStorage.getItem("currentChatId");
    const savedTab = localStorage.getItem("activeMainTab") as any;
    
    if (savedTab) {
      setActiveTab(savedTab);
    }
    
    if (savedChatId && !selectedChatId) {
      console.log("Restoring chat from storage:", savedChatId);
      setSelectedChatId(savedChatId);
    }
  }, []);

  useEffect(() => {
    if (selectedChatId) {
      localStorage.setItem("currentChatId", selectedChatId);
      loadChatData(selectedChatId);
    }
  }, [selectedChatId]);

  useEffect(() => {
    if (activeTab) {
      localStorage.setItem("activeMainTab", activeTab);
    }
  }, [activeTab]);

  const loadChatData = async (chatId: string) => {
    setLoading(true);
    if (chatId === 'harf-ai-chat') {
      setSelectedChatData({
        id: 'harf-ai-chat',
        is_group: false,
        other_user: {
          id: 'harf-ai-bot',
          name: 'Harf AI',
          username: 'harfai',
          email: 'ai@harf.app',
          profile_photo: 'https://api.dicebear.com/7.x/bottts/svg?seed=harf',
          online: true,
          profession: 'AI Assistant'
        }
      });
      setLoading(false);
      return;
    }
    try {
      // Get chat details
      const { data: chatData } = await supabase
        .from("chats")
        .select("*")
        .eq("id", chatId)
        .single();

      if (!chatData) {
        setLoading(false);
        return;
      }

      let chatDetails: any = { ...chatData };

      if (chatData.is_group) {
        // Get group details
        const { data: groupData } = await supabase
          .from("groups")
          .select("*")
          .eq("chat_id", chatId)
          .single();

        chatDetails.group = groupData;
      } else {
        // Get other participant user_id first
        const { data: participantData } = await supabase
          .from("chat_participants")
          .select("user_id")
          .eq("chat_id", chatId)
          .neq("user_id", user.id)
          .single();

        if (participantData) {
          // Then get full user data
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", participantData.user_id)
            .single();

          chatDetails.other_user = userData;
        }
      }

      setSelectedChatData(chatDetails);
    } catch (error) {
      console.error("Error loading chat data:", error);
      alert("Error loading chat: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = (chatId: string) => {
    console.log("Selecting chat:", chatId);
    setSelectedChatId(chatId);
    setActiveTab("chats");
    localStorage.setItem("currentChatId", chatId);
    if (isMobileView) {
      setIsMobileChatOpen(true);
    }
  };

  const [prefilledMessage, setPrefilledMessage] = useState<string | undefined>(undefined);

  const handleStartChat = async (userId: string, initialMessage?: string) => {
    console.log("Starting chat with user:", userId);
    setLoading(true);
    try {
      // Get or create chat with helper function
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("No current user");

      // Check if a 1:1 chat already exists
      let targetChatId = null;
      const { data: existingChat, error: existingError } = await supabase.rpc('get_existing_1to1_chat', {
        user_a: currentUser.id,
        user_b: userId
      });

      if (existingChat && existingChat.length > 0) {
        targetChatId = existingChat[0].chat_id;
      }

      if (!targetChatId) {
        // Create new chat
        const { data: newChat, error: chatError } = await supabase
          .from('chats')
          .insert({ is_group: false })
          .select()
          .single();

        if (chatError) throw chatError;

        // Add participants
        await supabase.from('chat_participants').insert([
          { chat_id: newChat.id, user_id: currentUser.id },
          { chat_id: newChat.id, user_id: userId }
        ]);

        targetChatId = newChat.id;
      }

      setPrefilledMessage(initialMessage);
      handleSelectChat(targetChatId);
    } catch (error) {
      console.error("Error starting chat:", error);
      alert("Failed to start chat.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToChatList = () => {
    setSelectedChatId(null);
    setSelectedChatData(null);
    setIsMobileChatOpen(false);
    setPrefilledMessage(undefined); // Clear prefilled message on back
  };

  const handleSearchChat = (chatId: string) => {
    const query = prompt('Search messages in chat:');
    if (query) {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5001';
      fetch(`${backendUrl}/chat/search/${chatId}?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          if (data.messages?.length > 0) {
            alert(`Found ${data.messages.length} messages`);
          } else {
            alert('No messages found');
          }
        })
        .catch(() => alert('Failed to search. Make sure backend is running.'));
    }
  };

  const handleViewMedia = (chatId: string) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5001';
    fetch(`${backendUrl}/chat/media/${chatId}`)
      .then(res => res.json())
      .then(data => {
        if (data.media?.length > 0) {
          alert(`Found ${data.media.length} media files`);
        } else {
          alert('No media files found');
        }
      })
      .catch(() => alert('Failed to load media. Make sure backend is running.'));
  };

  const handlePinChat = async (chatId: string, pin: boolean) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5001';
    try {
      const res = await fetch(`${backendUrl}/chat/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, pin })
      });
      const data = await res.json();
      if (data.success) {
        alert(pin ? 'Chat pinned' : 'Chat unpinned');
        setSelectedChatId(null);
        setSelectedChatData(null);
      } else {
        alert(data.error || 'Failed to pin chat');
      }
    } catch {
      alert('Failed. Make sure backend is running.');
    }
  };

  const handleMuteChat = async (chatId: string, mute: boolean) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5001';
    try {
      const res = await fetch(`${backendUrl}/chat/mute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, user_id: user.id, mute })
      });
      const data = await res.json();
      if (data.success) {
        alert(mute ? 'Notifications muted' : 'Notifications unmuted');
      } else {
        alert(data.error || 'Failed to mute chat');
      }
    } catch {
      alert('Failed. Make sure backend is running.');
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5001';
    try {
      const res = await fetch(`${backendUrl}/chat/${chatId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('Chat deleted');
        setSelectedChatId(null);
        setSelectedChatData(null);
      } else {
        alert(data.error || 'Failed to delete chat');
      }
    } catch {
      alert('Failed. Make sure backend is running.');
    }
  };

  const handlePinUser = async (userId: string, pin: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ pinned: pin })
        .eq('id', userId);
      if (error) {
        if (error.message.includes('pinned')) {
          try { await supabase.rpc('add_column_if_not_exists', { table_name: 'users', column_name: 'pinned', column_type: 'boolean' }); } catch (e) { }
          await supabase.from('users').update({ pinned: pin }).eq('id', userId);
        } else {
          throw error;
        }
      }
      alert(pin ? 'User pinned' : 'User unpinned');
    } catch {
      alert('Failed to update pin status. Column may not exist in users table.');
    }
  };

  const handleArchiveUser = async (userId: string, archive: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ archived: archive })
        .eq('id', userId);
      if (error) {
        if (error.message.includes('archived')) {
          try { await supabase.rpc('add_column_if_not_exists', { table_name: 'users', column_name: 'archived', column_type: 'boolean' }); } catch (e) { }
          await supabase.from('users').update({ archived: archive }).eq('id', userId);
        } else {
          throw error;
        }
      }
      alert(archive ? 'User archived' : 'User unarchived');
    } catch {
      alert('Failed to update archive status. Column may not exist in users table.');
    }
  };

  const handleMuteUser = async (userId: string, mute: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ notifications_muted: mute })
        .eq('id', userId);
      if (error) {
        if (error.message.includes('notifications_muted')) {
          try { await supabase.rpc('add_column_if_not_exists', { table_name: 'users', column_name: 'notifications_muted', column_type: 'boolean' }); } catch (e) { }
          await supabase.from('users').update({ notifications_muted: mute }).eq('id', userId);
        } else {
          throw error;
        }
      }
      alert(mute ? 'User notifications muted' : 'User notifications unmuted');
    } catch {
      alert('Failed to update mute status. Column may not exist in users table.');
    }
  };

  const handleBlockUser = async (userId: string, block: boolean) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5001';
      const res = await fetch(`${backendUrl}/user/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, blocked_user_id: userId, block })
      });
      const data = await res.json();
      if (data.success) {
        alert(block ? 'User blocked' : 'User unblocked');
      } else {
        alert(data.error || 'Failed to block user');
      }
    } catch {
      alert('Failed. Make sure backend is running.');
    }
  };

  const handleChatCreated = (chatId: string) => {
    console.log("Chat created:", chatId);
    setSelectedChatId(chatId);
    setActiveTab("chats");
    localStorage.setItem("currentChatId", chatId);
    if (isMobileView) {
      setIsMobileChatOpen(true);
    }
  };

  const handleGroupCreated = (chatId: string) => {
    console.log("Group created:", chatId);
    setSelectedChatId(chatId);
    setActiveTab("groups");
    localStorage.setItem("currentChatId", chatId);
    if (isMobileView) {
      setIsMobileChatOpen(true);
    }
  };


  const handleProfileUpdate = (updatedUser: User) => {
    console.log('Profile updated:', updatedUser);
    if (onUserUpdate) {
      onUserUpdate(updatedUser);
    }
  };

  const initiateCall = async (targetUser: User, type: 'voice' | 'video') => {
    console.log('initiateCall function started with:', type, targetUser);
    try {
      console.log(`Starting ${type} call with`, targetUser);

      if (!targetUser?.id) {
        console.error('Target user id is missing');
        return;
      }

      const constraints: MediaStreamConstraints = type === 'video'
        ? { video: true, audio: true }
        : { audio: true };

      console.log('Requesting media with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Got media stream:', stream);

      setCallState({
        active: true,
        type,
        targetUser,
        localStream: stream,
        remoteStream: null,
      });

      // Notify backend
      try {
        await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5001'}/call/initiate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caller_id: user.id,
            receiver_id: targetUser.id,
            call_type: type
          })
        });

        // Trigger missed call notification as a "Incoming Call" placeholder
        createNotification(targetUser.id, 'missed_call', user.id, { type });
      } catch (apiErr) {
        console.log('Call API not available, using local only');
        createNotification(targetUser.id, 'missed_call', user.id, { type });
      }

    } catch (error: any) {
      console.error('Error initiating call:', error);
      alert(error?.message || 'Could not start call. Please check camera/mic permissions.');
      setCallState({
        active: false,
        type: null,
        targetUser: null,
        localStream: null,
        remoteStream: null,
      });
    }
  };

  const endCall = async () => {
    try {
      if (callState.localStream && callState.localStream.getTracks) {
        callState.localStream.getTracks().forEach((track: any) => {
          if (track.stop) track.stop();
        });
      }
    } catch (e) {
      console.error('Error stopping tracks:', e);
    }

    setCallState({
      active: false,
      type: null,
      targetUser: null,
      localStream: null,
      remoteStream: null,
    });
  };

  const handleCallButtonClick = (type: 'voice' | 'video') => {
    console.log('handleCallButtonClick called with type:', type);
    console.log('selectedChatData:', selectedChatData);
    if (selectedChatData?.other_user) {
      console.log('Calling initiateCall with user:', selectedChatData.other_user);
      initiateCall(selectedChatData.other_user, type);
    } else {
      console.log('No user selected for call');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-white overflow-hidden fixed inset-0">
      {/* Top Header - Fixed Height */}
      <header className="flex-shrink-0 bg-blue-600 text-white px-3 h-[56px] md:h-[64px] flex items-center justify-between shadow-md z-30">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-white/20 p-1 rounded-lg border border-white/20">
            <img src="/logo.png" alt="Harf Logo" className="w-8 h-8 md:w-10 md:h-10 rounded-md object-cover" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-extrabold tracking-tight">Harf</h1>
            <div className="text-[9px] md:text-xs text-white/70 font-medium hidden sm:block">
              Professional Connection Hub
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 bg-black/10 px-3 py-1 rounded-full border border-white/10">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
          <span className="text-[10px] text-white/90 font-medium">Developed by Md Shahid Alam</span>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="bg-white/15 hover:bg-white/25 text-white px-3 py-1 rounded-full text-xs font-bold hidden md:flex items-center border border-white/10 transition-all"
            onClick={() => setShowUserSearchOpen(true)}
          >
            <Search className="w-3.5 h-3.5 mr-1.5" /> New Chat
          </Button>
          
          <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-full border border-white/10">
            <NotificationCenter 
              currentUser={user} 
              onAction={(type) => {
                if (['like', 'comment'].includes(type)) setActiveTab('feed');
                else if (['connection_request', 'connection_accepted', 'follow'].includes(type)) setActiveTab('network');
                else if (['message', 'missed_call'].includes(type)) {
                  setActiveTab('chats');
                  setIsMobileChatOpen(false);
                }
                else if (['job_application', 'application_update'].includes(type)) setActiveTab('marketplace');
              }}
              onOpenSettings={() => setShowSettingsModal(true)}
            />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowProfileModal(true)}
              className="text-white hover:bg-white/20 rounded-full w-8 h-8 md:w-9 md:h-9 relative transition-all"
            >
              <Avatar className="w-7 h-7 md:w-8 md:h-8 border-1.5 border-white/50 shadow-sm">
                <AvatarImage src={user.profile_photo} />
                <AvatarFallback className="bg-blue-700 text-white font-bold text-xs">
                  {user.name?.charAt(0) || user.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettingsModal(true)}
              className="text-white hover:bg-white/20 rounded-full w-8 h-8 md:w-9 md:h-9 transition-all"
            >
              <Settings className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area - Flexible and Only Scrollable Region */}
      <main className="flex-1 min-h-0 bg-gray-50 overflow-hidden relative">
        <div className={`absolute inset-0 ${activeTab === 'chats' || activeTab === 'groups' || activeTab === 'marketplace' ? 'block' : 'hidden'}`}>
          {activeTab === 'marketplace' ? (
            <JobMarketplace currentUser={user} />
          ) : (
            <div className="flex h-full min-h-0 bg-white border-r border-gray-100 overflow-hidden">
              {(!isMobileView || !isMobileChatOpen) && (
                <div className={`${isMobileView ? "w-full" : "w-[380px]"} flex-shrink-0 flex flex-col border-r border-gray-100 bg-white`}>
                  <div className="px-5 py-4 md:px-6 md:py-5 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex flex-col">
                      <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                        {activeTab === 'groups' ? 'Communities' : 'Messages'}
                      </h1>
                      <div className="h-1 w-6 bg-blue-600 rounded-full mt-1" />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowUserSearchOpen(true)}
                        className="w-9 h-9 hover:bg-slate-100 text-slate-600 rounded-full transition-all duration-300"
                      >
                        <Search className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {activeTab === 'groups' ? (
                      <CommunityView currentUser={user} />
                    ) : (
                      <ChatList
                        currentUser={user}
                        selectedChatId={selectedChatId || undefined}
                        onSelectChat={handleSelectChat}
                        onSearchChat={handleSearchChat}
                        onViewMedia={handleViewMedia}
                        onPinChat={(id: string, pin: boolean) => {
                          const pinned = JSON.parse(localStorage.getItem(`pinned_${user.id}`) || '[]');
                          const newPinned = pin ? [...pinned, id] : pinned.filter((p: string) => p !== id);
                          localStorage.setItem(`pinned_${user.id}`, JSON.stringify(newPinned));
                          window.dispatchEvent(new Event('storage'));
                        }}
                        onMuteChat={(id: string, mute: boolean) => {
                          const muted = JSON.parse(localStorage.getItem(`muted_${user.id}`) || '[]');
                          const newMuted = mute ? [...muted, id] : muted.filter((m: string) => m !== id);
                          localStorage.setItem(`muted_${user.id}`, JSON.stringify(newMuted));
                          window.dispatchEvent(new Event('storage'));
                        }}
                        onArchiveChat={(id: string, archive: boolean) => {
                          const archived = JSON.parse(localStorage.getItem(`archived_${user.id}`) || '[]');
                          const newArchived = archive ? [...archived, id] : archived.filter((a: string) => a !== id);
                          localStorage.setItem(`archived_${user.id}`, JSON.stringify(newArchived));
                          window.dispatchEvent(new Event('storage'));
                        }}
                        onDeleteChat={async (id: string) => {
                          if (confirm('Are you sure you want to delete this chat? This cannot be undone.')) {
                            const { error } = await supabase.from('chats').delete().eq('id', id);
                            if (!error) {
                              setSelectedChatId(null);
                              window.dispatchEvent(new Event('storage'));
                            }
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
              {(!isMobileView || isMobileChatOpen) && (
                <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
                  {selectedChatId && selectedChatData ? (
                    loading ? (
                      <div className="flex flex-1 items-center justify-center bg-white/50 backdrop-blur-sm">
                        <div className="text-center">
                          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                          <p className="mt-2 text-sm text-gray-600">Loading chat...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full flex-1 flex flex-col min-h-0">
                        <ChatWindow
                          chatId={selectedChatId}
                          currentUser={user}
                          otherUser={selectedChatData.other_user}
                          isGroup={selectedChatData.is_group}
                          groupName={selectedChatData.group?.name}
                          groupAdminId={selectedChatData.group?.admin_id || ''}
                          onVoiceCall={() => handleCallButtonClick('voice')}
                          onVideoCall={() => handleCallButtonClick('video')}
                          onMessageSent={() => {
                            if (selectedChatId) {
                              loadChatData(selectedChatId);
                            }
                          }}
                          initialMessage={prefilledMessage}
                          onBack={isMobileView ? handleBackToChatList : undefined}
                          onViewProfile={(userId) => {
                            if (userId === user.id) setShowProfileModal(true);
                            else setViewingProfileId(userId);
                          }}
                        />
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full text-center p-8 bg-white">
                      <img src="/logo.png" alt="Harf Logo" className="w-24 h-24 mb-6 rounded-3xl shadow-xl object-cover ring-4 ring-white" />
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Harf</h3>
                      <p className="text-gray-500 max-w-md text-lg">Select a conversation or start a new professional connection.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`absolute inset-0 ${activeTab === 'feed' ? 'block' : 'hidden'}`}>
          <Feed 
            currentUser={user} 
            onStartChat={handleStartChat} 
            onViewProfile={(userId) => {
              if (userId === user.id) setShowProfileModal(true);
              else setViewingProfileId(userId);
            }}
          />
        </div>

        <div className={`absolute inset-0 ${activeTab === 'network' ? 'block' : 'hidden'}`}>
          <Network 
            currentUser={user} 
            onStartChat={handleStartChat} 
            onViewProfile={(userId) => {
              if (userId === user.id) setShowProfileModal(true);
              else setViewingProfileId(userId);
            }}
          />
        </div>

        <div className={`absolute inset-0 transition-transform duration-300 ease-in-out ${activeTab === 'explore' ? 'translate-x-0' : 'translate-x-full'}`}>
          <DiscoveryView 
            currentUser={user} 
            onStartChat={handleStartChat} 
            onViewProfile={(userId) => {
              if (userId === user.id) setShowProfileModal(true);
              else setViewingProfileId(userId);
            }}
          />
        </div>
      </main>

      {/* Bottom Navigation - Fixed and Balanced */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 z-30 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around py-1.5 px-1 max-w-2xl mx-auto overflow-x-auto no-scrollbar">
          <Button
            variant="ghost"
            className={`flex flex-col items-center gap-1 h-auto py-2 px-2.5 rounded-xl min-w-[60px] ${activeTab === "chats" ? "text-blue-600 bg-blue-50" : "text-slate-400"}`}
            onClick={() => { setActiveTab("chats"); setIsMobileChatOpen(false); }}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-[10px] font-bold">Chats</span>
          </Button>

          <Button
            variant="ghost"
            className={`flex flex-col items-center gap-1 h-auto py-2 px-2.5 rounded-xl min-w-[60px] ${activeTab === "feed" ? "text-blue-600 bg-blue-50" : "text-slate-400"}`}
            onClick={() => setActiveTab("feed")}
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[10px] font-bold">Feed</span>
          </Button>

          <Button
            variant="ghost"
            className={`flex flex-col items-center gap-1 h-auto py-2 px-2.5 rounded-xl min-w-[60px] ${activeTab === "network" ? "text-blue-600 bg-blue-50" : "text-slate-400"}`}
            onClick={() => setActiveTab("network")}
          >
            <NetworkIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold">Network</span>
          </Button>

          <Button
            variant="ghost"
            className={`flex flex-col items-center gap-1 h-auto py-2 px-2.5 rounded-xl min-w-[60px] ${activeTab === "explore" ? "text-blue-600 bg-blue-50" : "text-slate-400"}`}
            onClick={() => setActiveTab("explore")}
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-bold">Explore</span>
          </Button>

          <Button
            variant="ghost"
            className={`flex flex-col items-center gap-1 h-auto py-2 px-2.5 rounded-xl min-w-[60px] ${activeTab === "groups" ? "text-blue-600 bg-blue-50" : "text-slate-400"}`}
            onClick={() => setActiveTab("groups")}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold">Groups</span>
          </Button>

          <Button
            variant="ghost"
            className={`flex flex-col items-center gap-1 h-auto py-2 px-2.5 rounded-xl min-w-[60px] ${activeTab === "marketplace" ? "text-blue-600 bg-blue-50" : "text-slate-400"}`}
            onClick={() => setActiveTab("marketplace")}
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-[10px] font-bold">Jobs</span>
          </Button>
        </div>
      </div>

      <PublicProfileModal 
        userId={viewingProfileId}
        isOpen={!!viewingProfileId}
        onClose={() => setViewingProfileId(null)}
        onStartChat={(uid) => {
          setViewingProfileId(null);
          handleStartChat(uid);
        }}
        currentUserId={user.id}
      />

      <ProfileModal
        user={user}
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
        onProfileUpdate={handleProfileUpdate}
      />

      <SettingsModal
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
        user={user}
        onUserUpdate={handleProfileUpdate}
      />
      <CreateGroupModal
        open={showCreateGroupModal}
        onOpenChange={setShowCreateGroupModal}
        onGroupCreated={handleGroupCreated}
        currentUserId={user.id}
      />
      <UserSearch
        onChatCreated={handleChatCreated}
        open={showUserSearchOpen}
        onOpenChange={setShowUserSearchOpen}
      />
      <CallsModal
        open={showCallsModal}
        onOpenChange={setShowCallsModal}
        onVoiceCall={() => selectedChatData?.other_user && initiateCall(selectedChatData.other_user, 'voice')}
        onVideoCall={() => selectedChatData?.other_user && initiateCall(selectedChatData.other_user, 'video')}
      />

      {/* Call Overlay */}
      {callState.active && callState.targetUser && (
        <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4">
          {callState.type === 'video' && callState.localStream ? (
            <div className="relative w-full max-w-sm aspect-[3/4] mb-8 bg-gray-800 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-gray-800">
              <VideoPlayer stream={callState.localStream} />
              <div className="absolute top-4 right-4 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-white text-xs font-semibold tracking-wider">REC</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 pb-6 px-6 text-center">
                <p className="text-white text-2xl font-bold truncate">
                  {callState.targetUser.username || callState.targetUser.email || callState.targetUser.name}
                </p>
                <p className="text-blue-300 font-medium mt-1">Video call in progress...</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center mb-12">
              <div className="relative">
                <Avatar className="w-32 h-32 mb-6 ring-4 ring-blue-500/30 shadow-2xl">
                  <AvatarImage src={callState.targetUser.profile_photo} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-4xl font-light">
                    {getInitials(callState.targetUser.name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-6 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-gray-900 animate-pulse"></div>
              </div>
              <p className="text-white text-3xl font-bold mb-2 truncate max-w-xs text-center">
                {callState.targetUser.username || callState.targetUser.email || callState.targetUser.name}
              </p>
              <p className="text-blue-400 font-medium tracking-wide uppercase text-sm">
                Voice call in progress...
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-6 mt-4">
            <Button
              variant="outline"
              size="icon"
              className="w-14 h-14 rounded-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white"
            >
              <Mic className="w-6 h-6" />
            </Button>
            <Button
              onClick={endCall}
              className="bg-red-500 hover:bg-red-600 w-20 h-20 rounded-full shadow-lg shadow-red-500/20 flex items-center justify-center transition-transform hover:scale-105"
            >
              <Phone className="w-8 h-8 transform rotate-[135deg]" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-14 h-14 rounded-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white"
            >
              {callState.type === 'video' ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}