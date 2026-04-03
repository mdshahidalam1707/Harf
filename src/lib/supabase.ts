import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

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
  email: string;
  profile_photo?: string;
  about?: string;
  last_seen?: string;
  online: boolean;
  created_at: string;
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
  message_type: 'text' | 'image' | 'video' | 'audio' | 'file';
  status: 'sent' | 'delivered' | 'seen';
  created_at: string;
  sender?: User;
}

export interface Group {
  id: string;
  chat_id: string;
  group_name: string;
  group_icon?: string;
  admin_id: string;
  created_at: string;
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
  messageType: 'text' | 'image' = 'text'
): Promise<Message | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        content,
        message_type: messageType,
        status: 'sent',
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    return message;
  } catch (error) {
    console.error('Error in sendMessage:', error);
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
        group_name: groupName,
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
      .neq('id', user.id) // Exclude current user
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
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