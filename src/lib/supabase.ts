import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// Validate configuration
if (!projectId || !publicAnonKey) {
  console.error('❌ Supabase configuration missing!');
  console.error('projectId:', projectId);
  console.error('publicAnonKey exists:', !!publicAnonKey);
  throw new Error('Supabase configuration is missing. Please check your setup.');
}

const supabaseUrl = `https://${projectId}.supabase.co`;

console.log('✅ Initializing Supabase client...');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!publicAnonKey);

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  supabaseUrl,
  publicAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

console.log('✅ Supabase client initialized successfully');

// Database types
export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  profile_photo?: string;
  about?: string;
  last_seen?: string;
  online: boolean;
  created_at?: string;
  bio?: string;
  profession?: string;
  skills?: string[];
  availability?: string;
  headline?: string;
  company?: string;
  education?: string;
  portfolio_url?: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower?: User;
  following?: User;
}

export type NotificationType = 
  | 'connection_request' 
  | 'connection_accepted' 
  | 'new_follower'
  | 'like'
  | 'comment'
  | 'follow'
  | 'message'
  | 'missed_call'
  | 'job_application'
  | 'application_update';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  sender_id: string;
  data: any;
  is_read: boolean;
  created_at: string;
  source_id?: string;
  sender?: User;
}

export interface Chat {
  id: string;
  is_group: boolean;
  created_at: string;
  updated_at: string;
  last_message?: Message;
  other_user?: User;
  group?: Group;
  unread_count?: number;
  pinned?: boolean;
  muted?: boolean;
}

export interface ChatParticipant {
  id: string;
  chat_id: string;
  user_id: string;
  unread_count: number;
  joined_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  media_url?: string;
  media_type?: string;
  status?: string;
  created_at: string;
  sender?: User;
}

export interface Group {
  id: string;
  chat_id: string;
  name: string;
  group_icon?: string;
  admin_id: string;
  created_at: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  review: string;
  created_at: string;
  reviewer?: User;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  media_url?: string;
  media_type?: string;
  created_at: string;
  user?: User;
  likes_count?: number;
  comments_count?: number;
  has_liked?: boolean;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  created_at: string;
  user?: User;
  likes_count?: number;
  has_liked?: boolean;
}

export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  skills: string[];
  poster_id: string;
  created_at: string;
  poster?: User;
}

export interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  other_user?: User;
}

// Helper function to get or create a one-on-one chat
export async function getOrCreateChat(otherUserId: string): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Check if chat already exists between these two users
    const { data: existingChats } = await supabase
      .from('chat_participants')
      .select('chat_id, chats!inner(is_group)')
      .eq('user_id', user.id);

    if (existingChats) {
      // Find a one-on-one chat that includes the other user
      for (const participant of existingChats) {
        if (!(participant.chats as any).is_group) {
          const { data: otherParticipant } = await supabase
            .from('chat_participants')
            .select('user_id')
            .eq('chat_id', participant.chat_id)
            .eq('user_id', otherUserId)
            .single();

          if (otherParticipant) {
            return participant.chat_id;
          }
        }
      }
    }

    // Create new chat
    const { data: newChat, error: chatError } = await supabase
      .from('chats')
      .insert({ is_group: false })
      .select()
      .single();

    if (chatError || !newChat) {
      console.error('Error creating chat:', chatError);
      return null;
    }

    // Add both users as participants
    const { error: participantsError } = await supabase
      .from('chat_participants')
      .insert([
        { chat_id: newChat.id, user_id: user.id },
        { chat_id: newChat.id, user_id: otherUserId },
      ]);

    if (participantsError) {
      console.error('Error adding participants:', participantsError);
      return null;
    }

    return newChat.id;
  } catch (error) {
    console.error('Error in getOrCreateChat:', error);
    return null;
  }
}

// Helper function to send a message
export async function sendMessage(
  chatId: string,
  content: string,
  mediaUrl?: string,
  mediaType?: string
): Promise<Message | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No authenticated user');
      return null;
    }

    console.log('📤 Sending message:', { chatId, content, senderId: user.id, mediaUrl });

    const insertData: any = {
      chat_id: chatId,
      sender_id: user.id,
      content,
    };
    
    if (mediaUrl) insertData.media_url = mediaUrl;
    if (mediaType) insertData.media_type = mediaType;

    const { data: message, error } = await supabase
      .from('messages')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error sending message:', error);
      return null;
    }

    console.log('✅ Message sent successfully:', message);

    // Trigger notification for other participants
    try {
      const { data: participants } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('chat_id', chatId)
        .neq('user_id', user.id);
      
      if (participants) {
        for (const p of participants) {
          createNotification(p.user_id, 'message', user.id, { content: content.substring(0, 50) }, chatId);
        }
      }
    } catch (err) {
      console.error('Error triggering message notification:', err);
    }

    return message;
  } catch (error) {
    console.error('❌ Error in sendMessage:', error);
    return null;
  }
}

// Helper function to upload chat media
export async function uploadChatMedia(file: File, chatId: string): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${chatId}/${fileName}`;

    console.log('📤 Uploading chat media:', filePath);

    const { error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(filePath, file);

    if (uploadError) {
      console.error('❌ Error uploading media:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('chat-media')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('❌ Error in uploadChatMedia:', error);
    return null;
  }
}

// Helper function to mark messages as seen
export async function markMessagesAsSeen(chatId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update message status to 'seen' for messages in this chat not sent by current user
    await supabase
      .from('messages')
      .update({ status: 'seen' })
      .eq('chat_id', chatId)
      .neq('sender_id', user.id)
      .in('status', ['sent', 'delivered']);

    // Reset unread count for current user
    await supabase
      .from('chat_participants')
      .update({ unread_count: 0 })
      .eq('chat_id', chatId)
      .eq('user_id', user.id);
  } catch (error) {
    console.error('Error marking messages as seen:', error);
  }
}

// Helper function to update online status
export async function updateOnlineStatus(online: boolean): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('users')
      .update({
        online,
        last_seen: new Date().toISOString(),
      })
      .eq('id', user.id);
  } catch (error) {
    console.error('Error updating online status:', error);
  }
}

// Helper function to update user profile
export async function updateUserProfile(updates: Partial<User>): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return false;
  }
}

// Helper function to update user settings
export async function updateUserSettings(settings: any): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    localStorage.setItem('user_settings', JSON.stringify(settings));
    
    // Also save to users table if there's a settings column, or just metadata
    await supabase.auth.updateUser({
      data: { settings }
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
  }
}

// Helper function to create a group
export async function createGroup(
  groupName: string,
  participantIds: string[],
  groupIcon?: string
): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Create chat
    const { data: newChat, error: chatError } = await supabase
      .from('chats')
      .insert({ is_group: true })
      .select()
      .single();

    if (chatError || !newChat) {
      console.error('Error creating group chat:', chatError);
      return null;
    }

    // Create group metadata
    const { error: groupError } = await supabase
      .from('groups')
      .insert({
        chat_id: newChat.id,
        name: groupName,
        group_icon: groupIcon,
        admin_id: user.id,
      });

    if (groupError) {
      console.error('Error creating group:', groupError);
      return null;
    }

    // Add all participants including the creator
    const participants = [user.id, ...participantIds].map(userId => ({
      chat_id: newChat.id,
      user_id: userId,
    }));

    const { error: participantsError } = await supabase
      .from('chat_participants')
      .insert(participants);

    if (participantsError) {
      console.error('Error adding group participants:', participantsError);
      return null;
    }

    return newChat.id;
  } catch (error) {
    console.error('Error in createGroup:', error);
    return null;
  }
}

// Helper function to search users
export async function searchUsers(query: string): Promise<User[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .neq('id', user.id)
      .or(`name.ilike.%${query}%,profession.ilike.%${query}%,skills.cs.{${query}}`)
      .limit(20);

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchUsers:', error);
    return [];
  }
}

// Helper function to upload profile image
export async function uploadProfileImage(file: File): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No authenticated user');
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`; // Use timestamp for unique filename
    const filePath = `${user.id}/${fileName}`; // Store in user folder

    console.log('📤 Uploading profile image:', filePath);

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('❌ Error uploading image:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    const publicUrl = data.publicUrl;

    console.log('✅ Image uploaded, public URL:', publicUrl);

    // Update user profile
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_photo: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      return null;
    }

    console.log('✅ Profile updated with new image');
    return publicUrl;
  } catch (error) {
    console.error('❌ Error in uploadProfileImage:', error);
    return null;
  }
}

// Helper function to submit a review
export async function submitReview(
  reviewedUserId: string,
  rating: number,
  reviewText: string
): Promise<Review | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No authenticated user');
      return null;
    }

    if (user.id === reviewedUserId) {
      console.error('❌ Cannot review yourself');
      return null;
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        reviewer_id: user.id,
        reviewed_user_id: reviewedUserId,
        rating,
        review: reviewText,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error submitting review:', error);
      return null;
    }

    console.log('✅ Review submitted:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in submitReview:', error);
    return null;
  }
}

// Helper function to get reviews for a user
export async function getUserReviews(userId: string): Promise<Review[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, reviewer:users!reviewer_id(id, name, profile_photo)')
      .eq('reviewed_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching reviews:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in getUserReviews:', error);
    return [];
  }
}

// Helper function to calculate average rating
export function calculateAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

// Networking Helpers
export async function sendConnectionRequest(receiverId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('connections')
    .insert({
      requester_id: user.id,
      receiver_id: receiverId,
      status: 'pending'
    });

  if (error) {
    console.error('Error sending connection request:', error);
    return false;
  }

  // Create notification
  await createNotification(receiverId, 'connection_request', user.id);

  return true;
}

export async function acceptConnectionRequest(connectionId: string, requesterId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('connections')
    .update({ status: 'accepted' })
    .eq('id', connectionId);

  if (error) {
    console.error('Error accepting connection:', error);
    return false;
  }

  // Create notification for the requester
  await createNotification(requesterId, 'connection_accepted', user.id);

  return true;
}

export async function toggleFollow(targetUserId: string, isFollowing: boolean): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  if (isFollowing) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: user.id, following_id: targetUserId });
    
    if (error) {
      console.error('Error unfollowing:', error);
      return false;
    }
  } else {
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: user.id, following_id: targetUserId });
    
    if (error) {
      console.error('Error following:', error);
      return false;
    }

    // Create notification
    await createNotification(targetUserId, 'follow', user.id);
  }

  return true;
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  senderId?: string,
  data: any = {},
  sourceId?: string
) {
  if (userId === senderId) return; // Don't notify yourself

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    sender_id: senderId,
    data,
    source_id: sourceId
  });

  if (error) {
    console.error('Error creating notification:', error);
  }
}

export async function getMutualConnections(otherUserId: string): Promise<User[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc('get_mutual_connections', {
    user_a: user.id,
    user_b: otherUserId
  });

  if (error) {
    console.error('Error fetching mutual connections:', error);
    return [];
  }

  return data || [];
}