# 🚀 ChatConnect Setup Guide

This guide will walk you through setting up your WhatsApp-like real-time chat application.

## 📋 Prerequisites

You already have:
- ✅ Supabase project connected
- ✅ React app set up in Figma Make
- ✅ All necessary packages installed

## 🗄️ Step 1: Set Up Database

### 1.1 Run the SQL Schema

1. Open your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire contents of `/DATABASE_SCHEMA.sql`
6. Paste it into the SQL Editor
7. Click **Run** (or press Ctrl/Cmd + Enter)

This will create:
- ✅ `users` table (user profiles)
- ✅ `chats` table (conversations)
- ✅ `chat_participants` table (who's in each chat)
- ✅ `messages` table (all messages)
- ✅ `groups` table (group metadata)
- ✅ Row Level Security (RLS) policies
- ✅ Database triggers
- ✅ Realtime subscriptions

### 1.2 Verify Tables Were Created

1. Go to **Table Editor** in Supabase
2. You should see these tables:
   - users
   - chats
   - chat_participants
   - messages
   - groups

## 📦 Step 2: Set Up Storage (Optional - For Profile Photos)

### 2.1 Create Storage Bucket

1. In Supabase Dashboard, go to **Storage**
2. Click **New bucket**
3. Name it: `profile-photos`
4. Make it **Public** (check the box)
5. Click **Create bucket**

### 2.2 Set Storage Policies

1. Click on the `profile-photos` bucket
2. Go to **Policies** tab
3. Click **New policy**
4. Create these two policies:

**Policy 1: Allow public to view photos**
```sql
-- Policy name: Public can view profile photos
-- Allow: SELECT
-- Target roles: public

CREATE POLICY "Public can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');
```

**Policy 2: Users can upload their own photos**
```sql
-- Policy name: Users can upload own profile photo
-- Allow: INSERT
-- Target roles: authenticated

CREATE POLICY "Users can upload own profile photo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## ✅ Step 3: Test Your Setup

### 3.1 Create Test User

1. In your app, click **Sign Up**
2. Enter:
   - Name: Test User
   - Email: test@example.com
   - Password: test123
3. Click **Create Account**
4. You should see: "Account created successfully!"

### 3.2 Verify User in Database

1. Go to Supabase **Table Editor**
2. Open **users** table
3. You should see your test user with:
   - ✅ Name: Test User
   - ✅ Email: test@example.com
   - ✅ Default about text
   - ✅ Online: false
   - ✅ Created timestamp

### 3.3 Log In

1. Switch to **Login** tab
2. Enter:
   - Email: test@example.com
   - Password: test123
3. Click **Log In**
4. You should see the chat interface!

## 🧪 Step 4: Test Chat Features

### 4.1 Create Second User (For Testing)

Open an **incognito/private window**:
1. Go to your app URL
2. Sign up with a different email (e.g., user2@example.com)
3. Log in with the second user

### 4.2 Start a Chat

In the first user's window:
1. Click **New Chat** button
2. Search for "user2" or the second user's name
3. Click the message icon next to their name
4. A new chat should open

### 4.3 Send Messages

1. Type a message: "Hello!"
2. Press Enter or click Send
3. Message should appear instantly

In the second user's window:
1. The chat should appear in the chat list
2. Click on the chat
3. You should see "Hello!" message
4. Reply with "Hi there!"

In the first user's window:
1. The reply should appear **instantly** (no refresh needed!)
2. This is real-time messaging working! 🎉

### 4.4 Test Message Status

1. Send a message from User 1
2. Notice the checkmark (✓) - means "sent"
3. When User 2 opens the app, it changes to double checkmark (✓✓) - means "delivered"
4. When User 2 opens the chat, it turns blue (✓✓) - means "seen"

### 4.5 Test Online Status

1. Keep both users logged in
2. User 1 should see "Online" under User 2's name in the chat
3. Close User 2's browser
4. After a few seconds, User 1 should see "Last seen..." instead

## 🎯 Features Checklist

After setup, you should have:

### ✅ Authentication
- [x] User registration with name, email, password
- [x] Secure password hashing (handled by Supabase)
- [x] Login with JWT token
- [x] Auto-create user profile after signup

### ✅ User Profiles
- [x] Name, email, profile photo
- [x] About/status text ("Hey there! I am using ChatConnect")
- [x] Last seen timestamp
- [x] Online/offline status

### ✅ One-to-One Chat
- [x] Automatic chat creation on first message
- [x] Two participants per chat
- [x] Chats sorted by last message
- [x] Unread message count
- [x] Real-time message delivery

### ✅ Messages
- [x] Text messages
- [x] Message status (sent, delivered, seen)
- [x] Timestamps
- [x] Sender identification
- [x] Real-time updates

### ✅ Real-Time Features
- [x] Instant message delivery
- [x] Status updates (sent → delivered → seen)
- [x] Online/offline detection
- [x] Typing indicators (can be added)
- [x] Unread count updates

### ✅ Group Chat
- [x] Create groups with name
- [x] Multiple participants
- [x] Admin roles
- [x] Group messages
- [x] Real-time group messaging

### ✅ Security
- [x] Row Level Security (RLS)
- [x] Users can only see their chats
- [x] Users can only send to their chats
- [x] Secure authentication

## 🐛 Troubleshooting

### Problem: Tables not created
**Solution**: 
- Make sure you ran the entire SQL script
- Check the SQL Editor for errors (red text)
- Try running the script in smaller sections

### Problem: Can't sign up
**Solution**:
- Check browser console for errors (F12)
- Verify Edge Function is deployed
- Check Supabase logs in Dashboard

### Problem: Messages not appearing in real-time
**Solution**:
- Verify Realtime is enabled on `messages` table
- In Supabase, go to Database > Replication
- Make sure `messages` table is enabled
- Check browser console for subscription errors

### Problem: "Not authorized" errors
**Solution**:
- RLS policies might not be set up correctly
- Go to **Table Editor** > **Policies** tab
- Verify all policies from the SQL script exist
- Try re-running the RLS policies section

### Problem: User profile not created after signup
**Solution**:
- Check if the trigger `on_auth_user_created` exists
- Go to **Database** > **Functions**
- Look for `handle_new_user` function
- Re-run the trigger section of SQL script

## 📊 Monitoring Your App

### Check Active Users
```sql
SELECT name, email, online, last_seen
FROM users
ORDER BY last_seen DESC;
```

### Check Recent Messages
```sql
SELECT 
  m.content,
  m.status,
  u.name as sender_name,
  m.created_at
FROM messages m
JOIN users u ON m.sender_id = u.id
ORDER BY m.created_at DESC
LIMIT 10;
```

### Check Chat Activity
```sql
SELECT 
  c.id,
  c.is_group,
  COUNT(m.id) as message_count,
  MAX(m.created_at) as last_message_time
FROM chats c
LEFT JOIN messages m ON c.id = m.chat_id
GROUP BY c.id
ORDER BY last_message_time DESC;
```

## 🚀 Next Steps

Now that your chat app is working, you can add:

1. **Profile Photo Upload**
   - Use Supabase Storage
   - Add image picker in profile settings

2. **Typing Indicators**
   - Use Supabase Realtime channels
   - Broadcast "typing" events

3. **Image Messages**
   - Upload to Storage
   - Store URL in messages table

4. **Push Notifications**
   - Use browser Push API
   - Send notifications for new messages

5. **Voice Messages**
   - Record audio in browser
   - Upload to Storage

6. **Video Calls**
   - Integrate WebRTC
   - Use Supabase for signaling

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [React Hooks](https://react.dev/reference/react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## 🎉 Success!

Your WhatsApp-like chat application is now fully functional with:
- ✅ Real-time messaging
- ✅ Online/offline status
- ✅ Message delivery status
- ✅ Group chats
- ✅ User search
- ✅ Secure authentication

Happy chatting! 💬
