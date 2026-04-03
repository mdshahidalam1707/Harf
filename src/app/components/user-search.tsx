import { useState } from 'react';
import { supabase, getOrCreateChat } from '../../lib/supabase';

// ✅ UI imports (FIXED)
import { Input } from './ui/input';
import { Button } from './ui/button';

import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from './ui/avatar';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from './ui/dialog';

import { Search, MessageCircle, Loader2 } from 'lucide-react';

interface User {
  id: string;
  username: string | null;
  avatar_url: string | null;
}
interface UserSearchProps {
  onChatCreated: (chatId: string) => void;
}

export function UserSearch({ onChatCreated }: UserSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);

  // ✅ FIXED SEARCH FUNCTION
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);

    try {
      const {
  data: { user },
} = await supabase.auth.getUser();

const { data, error } = await supabase
  .from("users")
  .select("id, username, avatar_url")
  .ilike("username", `%${query.trim()}%`)
  .neq("id", user?.id);

      if (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } else {
        setSearchResults(data || []);
      }

    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setSearching(false);
    }
  };

  // ✅ CHAT CREATE
  const handleStartChat = async (userId: string) => {
    setCreating(userId);

    try {
      const chatId = await getOrCreateChat(userId);

      if (chatId) {
        onChatCreated(chatId);
        setOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }

    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setCreating(null);
    }
  };

  // ✅ INITIALS
  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-500 hover:bg-blue-600">
          <MessageCircle className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Start a New Chat</DialogTitle>
          <DialogDescription>
            Search for a user to start a chat with.
          </DialogDescription>
        </DialogHeader>

        {/* SEARCH INPUT */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

          <Input
            type="text"
            placeholder="Search username..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* RESULTS */}
        <div className="max-h-96 overflow-y-auto">
          {searching ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery.trim().length < 2
                ? "Type to search users"
                : "No users found"}
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatar_url || ""} />
                      <AvatarFallback>
                        {getInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <p className="font-medium">
                        {user.username || "No Name"}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleStartChat(user.id)}
                    disabled={creating === user.id}
                  >
                    {creating === user.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MessageCircle className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}