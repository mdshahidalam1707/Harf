import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

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

import { Search, MessageCircle, Loader2, Star } from 'lucide-react';
import { ReviewModal } from './review-modal';

interface UserSearchResult {
  id: string;
  name: string | null;
  username: string | null;
  profile_photo: string | null;
  profession: string | null;
  skills: string[] | null;
  availability: string | null;
  reviews?: { rating: number }[];
}

// Helper to calculate average rating
const getAvgRating = (reviews?: { rating: number }[]): { avg: number; count: number } => {
  if (!reviews || reviews.length === 0) return { avg: 0, count: 0 };
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return { avg: Math.round((total / reviews.length) * 10) / 10, count: reviews.length };
};

// Safe getInitials function to prevent crashes
const getInitials = (name: string | null): string => {
  if (!name) return "??";
  const words = name.trim().split(" ");
  if (words.length === 1) return words[0][0]?.toUpperCase() || "?";
  return (words[0][0] + words[1][0]).toUpperCase();
};
interface UserSearchProps {
  onChatCreated: (chatId: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UserSearch({ onChatCreated, open: externalOpen, onOpenChange: externalOnOpenChange }: UserSearchProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewUserId, setReviewUserId] = useState('');
  const [reviewUserName, setReviewUserName] = useState('');

  const isControlled = externalOpen !== undefined;
  const isOpen = isControlled ? externalOpen : internalOpen;

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSearching(false);
      setCreating(null);
      setAvailabilityFilter('');
      setSkillFilter('');
    }
  }, [isOpen]);

  const handleSetOpen = (open: boolean) => {
    if (isControlled && externalOnOpenChange) {
      externalOnOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  };

  // ✅ FIXED SEARCH FUNCTION - search by username, profession, or skills with filters
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSearching(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("User not found");
        setSearching(false);
        return;
      }

      console.log("Current user ID:", user.id);
      console.log("Search input:", query);
      console.log("Availability filter:", availabilityFilter);
      console.log("Skill filter:", skillFilter);

      // Build query dynamically - fetch users with their reviews
      let queryBuilder = supabase
        .from("users")
        .select("*, reviews!reviewed_user_id(rating)")
        .neq("id", user.id);

      // Trim input
      const cleanSearch = query.trim();

      // Handle empty search - return all users (with optional filters)
      if (!cleanSearch) {
        // Add availability filter
        if (availabilityFilter) {
          queryBuilder = queryBuilder.eq('availability', availabilityFilter);
        }
        // Add skill filter
        if (skillFilter.trim()) {
          queryBuilder = queryBuilder.eq('skills', `{${skillFilter.trim()}}`);
        }
      } else {
        // Add text search filters - name, username, profession, skills
        queryBuilder = queryBuilder.or(`name.ilike.%${cleanSearch}%,username.ilike.%${cleanSearch}%,profession.ilike.%${cleanSearch}%,skills.cs.{${cleanSearch}}`);
        
        // Add availability filter
        if (availabilityFilter) {
          queryBuilder = queryBuilder.eq('availability', availabilityFilter);
        }

        // Add skill filter
        if (skillFilter.trim()) {
          queryBuilder = queryBuilder.eq('skills', `{${skillFilter.trim()}}`);
        }
      }

      const { data, error } = await queryBuilder.limit(20);

      console.log("Search:", cleanSearch);
      console.log("Results:", data?.length || 0);
      console.log("ERROR:", error);

      if (error) {
        console.error("Supabase search error:", error);
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

  // Trigger search when filters change or search clears
  useEffect(() => {
    // Allow search with empty query when filters are active
    if (availabilityFilter || skillFilter) {
      handleSearch(searchQuery);
    } else if (searchQuery.trim().length >= 2) {
      handleSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [availabilityFilter, skillFilter]);

  // Trigger debounced search on input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch(searchQuery);
      } else if (!searchQuery.trim() && !availabilityFilter && !skillFilter) {
        setSearchResults([]);
      } else {
        handleSearch(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Open review modal
  const handleOpenReview = (userId: string, userName: string) => {
    setReviewUserId(userId);
    setReviewUserName(userName || 'User');
    setShowReviewModal(true);
  };

  // Handle chat creation - check if exists, create if not, navigate
  const handleStartChat = async (targetUserId: string) => {
    console.log("🔵 Chat button clicked for user:", targetUserId);
    setCreating(targetUserId);

    try {
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error("Auth error:", authError);
        alert("Please login first");
        return;
      }

      if (!currentUser) {
        console.error("No current user found");
        alert("Please login first");
        return;
      }

      console.log("Current user ID:", currentUser.id);
      console.log("Target user ID:", targetUserId);

      // Check if chat already exists
      const { data: existingChats, error: queryError } = await supabase
        .from('chat_participants')
        .select('chat_id, chats!inner(is_group)')
        .eq('user_id', currentUser.id);

      if (queryError) {
        console.error("Query error:", queryError);
      }

      let foundChatId: string | null = null;

      if (existingChats && existingChats.length > 0) {
        for (const participant of existingChats) {
          if (!(participant.chats as any).is_group) {
            const { data: otherParticipant } = await supabase
              .from('chat_participants')
              .select('user_id')
              .eq('chat_id', participant.chat_id)
              .eq('user_id', targetUserId)
              .single();

            if (otherParticipant) {
              foundChatId = participant.chat_id;
              console.log("Found existing chat:", foundChatId);
              break;
            }
          }
        }
      }

      if (foundChatId) {
        console.log("Using existing chat:", foundChatId);
        onChatCreated(foundChatId);
        handleSetOpen(false);
        return;
      }

      // Create new chat
      console.log("Creating new chat...");
      
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({ is_group: false })
        .select()
        .single();

      if (chatError || !newChat) {
        console.error("Error creating chat:", chatError);
        alert("Failed to create chat");
        return;
      }

      console.log("Chat created with ID:", newChat.id);

      // Add participants
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert([
          { chat_id: newChat.id, user_id: currentUser.id },
          { chat_id: newChat.id, user_id: targetUserId },
        ]);

      if (participantsError) {
        console.error("Error adding participants:", participantsError);
        alert("Failed to add participants");
        return;
      }

      console.log("✅ Chat created successfully! Chat ID:", newChat.id);
      
      // Navigate to chat
      onChatCreated(newChat.id);
      handleSetOpen(false);
      alert("Chat started!");

    } catch (error) {
      console.error('Error creating chat:', error);
      alert("Failed to start chat. Please try again.");
    } finally {
      setCreating(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleSetOpen}>
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
            placeholder="Search users by name, profession, or skills..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* FILTERS */}
        <div className="flex gap-2">
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-md text-sm"
          >
            <option value="">All Availability</option>
            <option value="available">🟢 Available</option>
            <option value="busy">🔴 Busy</option>
            <option value="hiring">🟡 Hiring</option>
          </select>
          <Input
            type="text"
            placeholder="Filter by skill..."
            value={skillFilter}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSkillFilter(e.target.value)}
            className="flex-1"
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
                      <AvatarImage src={user.profile_photo || ""} />
                      <AvatarFallback>
                        {getInitials(user.name || user.username || "U")}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <p className="font-medium">
                        {user.name || user.username || "Unknown User"}
                      </p>
                      {user.username && (
                        <p className="text-sm text-gray-500">
                          @{user.username}
                        </p>
                      )}
                      {/* Rating Display */}
                      {(user as any).reviews && (user as any).reviews.length > 0 ? (
                        (() => {
                          const { avg, count } = getAvgRating((user as any).reviews);
                          return (
                            <p className="text-sm text-yellow-600 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-500" />
                              {avg} ({count} reviews)
                            </p>
                          );
                        })()
                      ) : (
                        <p className="text-sm text-gray-400">No rating yet</p>
                      )}
                      {/* Availability Badge */}
                      {user.availability && (
                        <p className="text-sm">
                          {user.availability === 'available' && <span className="text-green-600">🟢 Available</span>}
                          {user.availability === 'busy' && <span className="text-red-600">🔴 Busy</span>}
                          {user.availability === 'hiring' && <span className="text-yellow-600">🟡 Hiring</span>}
                          {!user.availability && <span className="text-green-600">🟢 Available</span>}
                        </p>
                      )}
                      {user.profession && (
                        <p className="text-sm text-gray-500">
                          Profession: {user.profession}
                        </p>
                      )}
                      {user.skills && user.skills.length > 0 && (
                        <p className="text-sm text-gray-500">
                          Skills: {user.skills.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleStartChat(user.id)}
                      disabled={creating === user.id}
                    >
                      {creating === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MessageCircle className="w-4 h-4 mr-1" />
                      )}
                      Chat
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenReview(user.id, user.name || 'User')}
                    >
                      <Star className="w-4 h-4 mr-1" />
                      Rate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>

      {/* Review Modal */}
      <ReviewModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        reviewedUserId={reviewUserId}
        reviewedUserName={reviewUserName}
        onReviewSubmitted={() => {
          // Refresh search to get updated ratings
          handleSearch(searchQuery);
        }}
      />
    </Dialog>
  );
}