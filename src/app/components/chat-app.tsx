import { useEffect, useState } from "react";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface ChatAppProps {
  user: User;
  onLogout: () => void;
}

export function ChatApp({ user, onLogout }: ChatAppProps) {
  const [selectedChatId, setSelectedChatId] = useState<
    string | null
  >(null);
  const [selectedChatData, setSelectedChatData] =
    useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

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
    if (selectedChatId) {
      loadChatData(selectedChatId);
    }
  }, [selectedChatId]);

  const loadChatData = async (chatId: string) => {
    setLoading(true);
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
        // Get other participant
        const { data: participantData } = await supabase
          .from("chat_participants")
          .select("user_id, users(*)")
          .eq("chat_id", chatId)
          .neq("user_id", user.id)
          .single();

        if (participantData) {
          chatDetails.other_user = (
            participantData as any
          ).users;
        }
      }

      setSelectedChatData(chatDetails);
    } catch (error) {
      console.error("Error loading chat data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  const handleChatCreated = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  const handleProfileUpdate = (updatedUser: User) => {
    // Update the user state with new profile data
    // Note: In a real app, you might want to update the global user state
    console.log('Profile updated:', updatedUser);
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
    <div className="h-screen flex flex-col bg-white">
      {/* Top Header */}
      <header className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-8 h-8" />
          <h1 className="text-xl font-bold">NEST</h1>
        </div>

        <div className="flex items-center gap-2">
          <UserSearch onChatCreated={handleChatCreated} />

          <Button
            variant="ghost"
            className="text-white border-white hover:bg-white/20"
            onClick={() => setShowCreateGroupModal(true)}
          >
            <Users className="w-4 h-4 mr-1" />
            Group
          </Button>

          <Button
            variant="ghost"
            className="text-white border-white hover:bg-white/20"
            onClick={() => setShowProfileModal(true)}
          >
            <UserIcon className="w-4 h-4 mr-1" />
            Profile
          </Button>

          <Button
            variant="ghost"
            className="text-white border-white hover:bg-white/20"
            onClick={() => setShowSettingsModal(true)}
          >
            <Settings className="w-4 h-4 mr-1" />
            Settings
          </Button>

          <Button
            variant="outline"
            className="text-white border-white hover:bg-white/20"
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4 mr-1" />
            Logout
          </Button>

          <DropdownMenu>

            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="hover:bg-blue-600"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.profile_photo} />
                  <AvatarFallback className="bg-white text-blue-600">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-2 border-b">
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>

              <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
                <UserIcon className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setShowSettingsModal(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={onLogout}
                className="text-red-600 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat List Sidebar */}
        <div className="w-full md:w-96 border-r border-gray-200 bg-white overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Chats
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateGroupModal(true)}
                className="text-xs"
              >
                <Users className="w-4 h-4 mr-1" />
                Group
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatList
              currentUser={user}
              selectedChatId={selectedChatId || undefined}
              onSelectChat={handleSelectChat}
              onLogout={onLogout}
            />
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-gray-50 hidden md:flex">
          {selectedChatId && selectedChatData ? (
            loading ? (
              <div className="flex items-center justify-center w-full">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="mt-2 text-sm text-gray-600">
                    Loading chat...
                  </p>
                </div>
              </div>
            ) : (
              <ChatWindow
                chatId={selectedChatId}
                currentUser={user}
                otherUser={selectedChatData.other_user}
                isGroup={selectedChatData.is_group}
                groupName={selectedChatData.group?.group_name}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center w-full text-center p-8">
              <MessageCircle className="w-24 h-24 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Welcome to NEST
              </h3>
              <p className="text-gray-500 max-w-md">
                Select a chat from the list or start a new
                conversation by clicking the "New Chat" button
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 p-2 flex items-center justify-around z-30">
        <Button
          variant="ghost"
          className="flex flex-col items-center text-xs"
          onClick={() => setShowProfileModal(true)}
        >
          <UserIcon className="w-5 h-5" />
          Profile
        </Button>
        <Button
          variant="ghost"
          className="flex flex-col items-center text-xs"
          onClick={() => setShowSettingsModal(true)}
        >
          <Settings className="w-5 h-5" />
          Settings
        </Button>
        <Button
          variant="ghost"
          className="flex flex-col items-center text-xs text-red-600"
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        user={user}
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
        onProfileUpdate={handleProfileUpdate}
      />

      {/* Settings Modal */}
      <SettingsModal
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        open={showCreateGroupModal}
        onOpenChange={setShowCreateGroupModal}
        onGroupCreated={handleChatCreated}
      />
    </div>
  );
}