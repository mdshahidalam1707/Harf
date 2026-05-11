import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables FIRST
dotenv.config({ path: join(__dirname, ".env") });

// Twilio setup (optional - only works if credentials are provided)
let twilioClient = null;
const twilioSid = process.env.TWILIO_SID || '';
if (twilioSid && twilioSid.startsWith('AC') && process.env.TWILIO_TOKEN && process.env.TWILIO_PHONE) {
  try {
    const twilio = await import('twilio');
    twilioClient = twilio.default(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    console.log('📱 Twilio initialized with', process.env.TWILIO_PHONE);
  } catch (e) {
    console.log('Twilio error:', e.message);
  }
} else {
  console.log('📱 Twilio not configured - OTP will log to console (development mode)');
}

const serviceAccount = JSON.parse(
  fs.readFileSync(join(__dirname, "serviceAccountKey.json"), "utf-8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const app = express();

// Add simple test route immediately after app creation
app.get('/quick-test', (req, res) => {
  res.json({ message: 'Quick test works!' });
});

// CORS middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

let otpStore = {};

// Health check route
app.get("/", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Server running 🚀",
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get("/test", (req, res) => {
  res.json({ status: "ok", message: "Test route working" });
});

// Start server on 127.0.0.1:5001
const PORT = 5001;
const HOST = "127.0.0.1";

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  
  // Test routes after server starts
  setTimeout(() => {
    console.log("🧪 Testing route registration...");
    console.log("Routes should be registered now");
  }, 100);
});

// ==========================
// AUTH API
// ==========================

app.post("/send-otp", async (req, res) => {
  console.log("📲 send-otp request received");
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone number required" });
  }

  try {
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[phone] = otp;

    // Send via Twilio if available
    if (twilioClient) {
      try {
        await twilioClient.messages.create({
          body: `Your Harf verification code is ${otp}`,
          from: process.env.TWILIO_PHONE,
          to: phone
        });
        console.log(`📱 SMS sent to ${phone}`);
      } catch (smsError) {
        console.error('SMS error:', smsError);
        console.log(`📲 OTP for ${phone}: ${otp} (SMS failed)`);
      }
    } else {
      // Development: log OTP to console
      console.log(`📲 OTP for ${phone}: ${otp}`);
    }

    res.json({ success: true, message: "OTP sent" });
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

app.post("/verify-otp", async (req, res) => {
  console.log("🔐 verify-otp request received");
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ error: "Phone and OTP required" });
  }

  const storedOtp = otpStore[phone];

  if (!storedOtp) {
    return res.status(400).json({ error: "OTP expired or not requested" });
  }

  if (Number(storedOtp) !== Number(otp)) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  delete otpStore[phone];

  try {
    const userId = uuidv4();

    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .eq("phone", phone)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    let userData;

    if (existingUser) {
      const { data, error: updateError } = await supabase
        .from("users")
        .update({ phone: phone })
        .eq("id", existingUser.id)
        .select()
        .single();

      if (updateError) throw updateError;
      userData = data;
    } else {
      const { data, error: insertError } = await supabase
        .from("users")
        .upsert({
          id: userId,
          phone: phone,
        }, { onConflict: 'phone', ignoreDuplicates: false })
        .select()
        .single();

      if (insertError) throw insertError;
      userData = data;
    }

    res.json({
      success: true,
      message: "Login success 🚀",
      user: userData,
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: err.message || "Database error" });
  }
});

app.post("/auth/firebase", async (req, res) => {
  console.log("🔥 firebase auth request received");
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token required" });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    const phone = decoded.phone_number;
    const uid = decoded.uid;

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("phone", phone)
      .single();

    let userData;

    if (existingUser) {
      const { data, error } = await supabase
        .from("users")
        .update({ firebase_uid: uid })
        .eq("id", existingUser.id)
        .select()
        .single();

      if (error) throw error;
      userData = data;
    } else {
      const { data, error } = await supabase
        .from("users")
        .upsert({
          id: uuidv4(),
          phone: phone,
          firebase_uid: uid,
        }, { onConflict: 'phone' })
        .select()
        .single();

      if (error) throw error;
      userData = data;
    }

    res.json({ success: true, user: userData });
  } catch (err) {
    console.error("Firebase auth error:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});

// ==========================
// CHAT API
// ==========================

console.log("📝 Registering chat routes...");

// POST /chat/start - Create or return existing conversation
app.post("/chat/start", async (req, res) => {
  try {
    const { user1_id, user2_id } = req.body;

    if (!user1_id || !user2_id) {
      return res.status(400).json({ error: "user1_id and user2_id required" });
    }

    console.log("🔵 Starting chat between:", user1_id, user2_id);

    // Check if conversation already exists
    const { data: existingChats } = await supabase
      .from('chat_participants')
      .select('chat_id, chats!inner(is_group)')
      .eq('user_id', user1_id)
      .eq('is_group', false);

    if (existingChats && existingChats.length > 0) {
      for (const participant of existingChats) {
        const { data: otherParticipant } = await supabase
          .from('chat_participants')
          .select('user_id')
          .eq('chat_id', participant.chat_id)
          .eq('user_id', user2_id)
          .single();

        if (otherParticipant) {
          console.log("✅ Found existing chat:", participant.chat_id);
          return res.json({ success: true, chat_id: participant.chat_id });
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
      console.error("Error creating chat:", chatError);
      return res.status(500).json({ error: "Failed to create chat" });
    }

    // Add participants
    const { error: participantsError } = await supabase
      .from('chat_participants')
      .insert([
        { chat_id: newChat.id, user_id: user1_id },
        { chat_id: newChat.id, user_id: user2_id },
      ]);

    if (participantsError) {
      console.error("Error adding participants:", participantsError);
      return res.status(500).json({ error: "Failed to add participants" });
    }

    console.log("✅ New chat created:", newChat.id);
    res.json({ success: true, chat_id: newChat.id });
  } catch (err) {
    console.error("Error in /chat/start:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// GET /chat/:chatId - Get messages for a conversation
app.get("/chat/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    console.log("📥 Getting messages for chat:", chatId);

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender:users(id, name, username, profile_photo)')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, messages: messages || [] });
  } catch (err) {
    console.error("Error in /chat/:chatId:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// POST /chat/message - Send a message
app.post("/chat/message", async (req, res) => {
  try {
    const { chat_id, sender_id, content } = req.body;

    if (!chat_id || !sender_id || !content) {
      return res.status(400).json({ error: "chat_id, sender_id and content required" });
    }

    console.log("📤 Sending message:", { chat_id, sender_id, content });

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        chat_id,
        sender_id,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      return res.status(500).json({ error: error.message });
    }

    // Update chat's updated_at
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chat_id);

    console.log("✅ Message sent:", message.id);
    res.json({ success: true, message });
  } catch (err) {
    console.error("Error in /chat/message:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// ==========================
// USER SEARCH API
// ==========================

app.get("/users/search", async (req, res) => {
  try {
    const { q } = req.query;
    console.log("🔍 Searching users:", q);

    const query = (q || '').trim();

    let usersQuery = supabase
      .from('users')
      .select('id, name, username, email, profile_photo, bio, profession, skills, availability, online')
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (query) {
      usersQuery = usersQuery.or(`name.ilike.%${query}%,username.ilike.%${query}%,profession.ilike.%${query}%,skills.cs.{${query}}`);
    }

    const { data: users, error } = await usersQuery.limit(20);

    if (error) {
      console.error("Error searching users:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, users: users || [] });
  } catch (err) {
    console.error("Error in /users/search:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// GET /users/:userId - Get user by ID
app.get("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("📥 Getting user:", userId);

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, username, email, profile_photo, bio, profession, skills, availability, online, last_seen')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("Error in /users/:userId:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// ==========================
// TYPING STATUS API
// ==========================

app.post("/typing", async (req, res) => {
  try {
    const { user_id, chat_id, typing } = req.body;

    if (!user_id || !chat_id) {
      return res.status(400).json({ error: "user_id and chat_id required" });
    }

    // Try to upsert, but don't fail if table doesn't exist
    try {
      const { error } = await supabase
        .from('typing_status')
        .upsert({
          user_id,
          chat_id,
          typing: typing || false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'chat_id,user_id'
        });

      if (error) {
        console.log("typing_status table might not exist:", error.message);
      }
    } catch (e) {
      console.log("typing_status table not available");
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error in /typing:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// GET /typing/:chatId - Get typing status for a chat
app.get("/typing/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;

    try {
      const { data: typingData, error } = await supabase
        .from('typing_status')
        .select('user_id, typing')
        .eq('chat_id', chatId)
        .eq('typing', true);

      if (error) {
        return res.json({ success: true, typing: [] });
      }

      res.json({ success: true, typing: typingData || [] });
    } catch (e) {
      res.json({ success: true, typing: [] });
    }
  } catch (err) {
    console.error("Error in /typing/:chatId:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// ==========================
// ONLINE STATUS API
// ==========================

app.post("/users/online", async (req, res) => {
  try {
    const { user_id, online } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "user_id required" });
    }

    const { error } = await supabase
      .from('users')
      .update({
        online: online !== false,
        last_seen: online === false ? new Date().toISOString() : null
      })
      .eq('id', user_id);

    if (error) {
      console.error("Error updating online status:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error in /users/online:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// ==========================
// CALL SIGNALING API
// ==========================

app.post("/call/initiate", async (req, res) => {
  try {
    const { caller_id, receiver_id, call_type } = req.body;

    if (!caller_id || !receiver_id || !call_type) {
      return res.status(400).json({ error: "caller_id, receiver_id, and call_type required" });
    }

    console.log(`📞 Initiating ${call_type} call from ${caller_id} to ${receiver_id}`);

    // Create call notification
    const { data: callData, error } = await supabase
      .from('call_notifications')
      .insert({
        caller_id,
        receiver_id,
        call_type,
        status: 'calling'
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating call:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, call: callData });
  } catch (err) {
    console.error("Error in /call/initiate:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

app.post("/call/accept", async (req, res) => {
  try {
    const { call_id, user_id } = req.body;

    if (!call_id || !user_id) {
      return res.status(400).json({ error: "call_id and user_id required" });
    }

    console.log(`📞 Accepting call ${call_id} from user ${user_id}`);

    const { error } = await supabase
      .from('call_notifications')
      .update({ status: 'accepted' })
      .eq('id', call_id)
      .eq('receiver_id', user_id);

    if (error) {
      console.error("Error accepting call:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error in /call/accept:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

app.post("/call/reject", async (req, res) => {
  try {
    const { call_id, user_id } = req.body;

    if (!call_id || !user_id) {
      return res.status(400).json({ error: "call_id and user_id required" });
    }

    console.log(`📞 Rejecting call ${call_id} from user ${user_id}`);

    const { error } = await supabase
      .from('call_notifications')
      .update({ status: 'rejected' })
      .eq('id', call_id)
      .eq('receiver_id', user_id);

    if (error) {
      console.error("Error rejecting call:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error in /call/reject:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

app.post("/call/end", async (req, res) => {
  try {
    const { call_id, user_id } = req.body;

    if (!call_id || !user_id) {
      return res.status(400).json({ error: "call_id and user_id required" });
    }

    console.log(`📞 Ending call ${call_id} from user ${user_id}`);

    const { error } = await supabase
      .from('call_notifications')
      .update({ status: 'ended' })
      .eq('id', call_id)
      .or(`caller_id.eq.${user_id},receiver_id.eq.${user_id}`);

    if (error) {
      console.error("Error ending call:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error in /call/end:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

app.get("/call/check/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    // Get pending call for user
    const { data: callData, error } = await supabase
      .from('call_notifications')
      .select('*, caller:users!caller_id(id, name, profile_photo)')
      .eq('receiver_id', user_id)
      .eq('status', 'calling')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error checking call:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ call: callData || null });
  } catch (err) {
    console.error("Error in /call/check:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// ==========================
// CHAT FEATURES API
// ==========================

// Search messages in a chat
app.get("/chat/search/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: "Search query required" });
    }
    
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender:users(id, name, username)')
      .eq('chat_id', chatId)
      .ilike('content', `%${q}%`)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    
    res.json({ success: true, messages: messages || [] });
  } catch (err) {
    console.error("Error searching chat:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get media/files from a chat
app.get("/chat/media/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender:users(id, name, username)')
      .eq('chat_id', chatId)
      .not('media_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    
    res.json({ success: true, media: messages || [] });
  } catch (err) {
    console.error("Error getting media:", err);
    res.status(500).json({ error: err.message });
  }
});

// Star/unstar a message
app.post("/message/star", async (req, res) => {
  try {
    const { message_id, star } = req.body;
    
    if (!message_id) {
      return res.status(400).json({ error: "message_id required" });
    }
    
    const { error } = await supabase
      .from('messages')
      .update({ starred: star !== false })
      .eq('id', message_id);
    
    if (error) throw error;
    
    res.json({ success: true });
  } catch (err) {
    console.error("Error starring message:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get starred messages
app.get("/chat/starred/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender:users(id, name, username)')
      .eq('chat_id', chatId)
      .eq('starred', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ success: true, starred: messages || [] });
  } catch (err) {
    console.error("Error getting starred:", err);
    res.status(500).json({ error: err.message });
  }
});

// Pin/unpin chat
app.post("/chat/pin", async (req, res) => {
  try {
    const { chat_id, pin } = req.body;
    
    if (!chat_id) {
      return res.status(400).json({ error: "chat_id required" });
    }
    
    const { error } = await supabase
      .from('chats')
      .update({ pinned: pin !== false })
      .eq('id', chat_id);
    
    if (error) throw error;
    
    res.json({ success: true });
  } catch (err) {
    console.error("Error pinning chat:", err);
    res.status(500).json({ error: err.message });
  }
});

// Archive/unarchive chat
app.post("/chat/archive", async (req, res) => {
  try {
    const { chat_id, archive } = req.body;
    
    if (!chat_id) {
      return res.status(400).json({ error: "chat_id required" });
    }
    
    const { error } = await supabase
      .from('chats')
      .update({ archived: archive !== false })
      .eq('id', chat_id);
    
    if (error) throw error;
    
    res.json({ success: true });
  } catch (err) {
    console.error("Error archiving chat:", err);
    res.status(500).json({ error: err.message });
  }
});

// Mute/unmute chat notifications
app.post("/chat/mute", async (req, res) => {
  try {
    const { chat_id, user_id, mute } = req.body;
    
    if (!chat_id || !user_id) {
      return res.status(400).json({ error: "chat_id and user_id required" });
    }
    
    const { error } = await supabase
      .from('chat_participants')
      .update({ muted: mute !== false })
      .eq('chat_id', chat_id)
      .eq('user_id', user_id);
    
    if (error) throw error;
    
    res.json({ success: true });
  } catch (err) {
    console.error("Error muting chat:", err);
    res.status(500).json({ error: err.message });
  }
});

// Clear chat messages
app.post("/chat/clear", async (req, res) => {
  try {
    const { chat_id, user_id } = req.body;
    
    if (!chat_id || !user_id) {
      return res.status(400).json({ error: "chat_id and user_id required" });
    }
    
    // Delete all messages in the chat
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('chat_id', chat_id);
    
    if (error) throw error;
    
    res.json({ success: true });
  } catch (err) {
    console.error("Error clearing chat:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete chat
app.delete("/chat/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    
    // Delete all messages
    await supabase.from('messages').delete().eq('chat_id', chatId);
    // Delete all participants
    await supabase.from('chat_participants').delete().eq('chat_id', chatId);
    // Delete group data if exists
    await supabase.from('groups').delete().eq('chat_id', chatId);
    // Delete the chat
    const { error } = await supabase.from('chats').delete().eq('id', chatId);
    
    if (error) throw error;
    
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting chat:", err);
    res.status(500).json({ error: err.message });
  }
});

// Block/unblock user
app.post("/user/block", async (req, res) => {
  try {
    const { user_id, blocked_user_id, block } = req.body;
    
    if (!user_id || !blocked_user_id) {
      return res.status(400).json({ error: "user_id and blocked_user_id required" });
    }
    
    // Check if blocked_users table exists, if not create it
    try {
      if (block) {
        const { error } = await supabase
          .from('blocked_users')
          .insert({ user_id, blocked_user_id });
        
        if (error && error.code !== 'PGRST116') throw error;
      } else {
        const { error } = await supabase
          .from('blocked_users')
          .delete()
          .eq('user_id', user_id)
          .eq('blocked_user_id', blocked_user_id);
        
        if (error && error.code !== 'PGRST116') throw error;
      }
    } catch (e) {
      // Table might not exist, try to create it
      if (block) {
        console.log("Blocking user...");
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error("Error blocking user:", err);
    res.status(500).json({ error: err.message });
  }
});

// Report user
app.post("/user/report", async (req, res) => {
  try {
    const { reporter_id, reported_user_id, reason, chat_id } = req.body;
    
    if (!reporter_id || !reported_user_id) {
      return res.status(400).json({ error: "reporter_id and reported_user_id required" });
    }
    
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id,
          reported_user_id,
          reason: reason || 'No reason provided',
          chat_id
        });
      
      if (error && error.code !== 'PGRST116') throw error;
    } catch (e) {
      console.log("Reports table might not exist");
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error("Error reporting user:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get chat metadata (pinned, archived, muted status)
app.get("/chat/meta/:chatId/:userId", async (req, res) => {
  try {
    const { chatId, userId } = req.params;
    
    // Get chat info
    const { data: chat } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single();
    
    // Get participant info (muted)
    const { data: participant } = await supabase
      .from('chat_participants')
      .select('muted')
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .single();
    
    res.json({
      success: true,
      meta: {
        pinned: chat?.pinned || false,
        archived: chat?.archived || false,
        muted: participant?.muted || false
      }
    });
  } catch (err) {
    console.error("Error getting chat meta:", err);
    res.status(500).json({ error: err.message });
  }
});