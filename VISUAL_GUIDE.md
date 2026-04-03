# 📸 Visual Setup Guide - ChatConnect

A step-by-step visual guide to set up your chat application.

---

## 🎯 What You'll See

### Step 1: Database Setup Screen

When you first open the app, you'll see this screen:

```
┌─────────────────────────────────────────────────┐
│  🗄️ Database Setup Required                    │
│                                                  │
│  ⚠️ Some required database tables are missing   │
│                                                  │
│  Required Tables:                                │
│  ✅ users              ✓ Ready                   │
│  ❌ chats              ✗ Missing                 │
│  ❌ chat_participants  ✗ Missing                 │
│  ❌ messages           ✗ Missing                 │
│  ❌ groups             ✗ Missing                 │
│                                                  │
│  [Check Setup Again]  [Open Supabase]           │
└─────────────────────────────────────────────────┘
```

**What this means**: The database tables haven't been created yet.

**What to do**: Follow the setup instructions on the screen.

---

## 📝 Step 2: Copy SQL Schema

### Where to Find the SQL

In your project files, locate: `/DATABASE_SCHEMA.sql`

### What It Looks Like

```sql
-- ============================================
-- SUPABASE DATABASE SCHEMA FOR CHAT APPLICATION
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE (Public Profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ...
```

**Copy everything** from this file (scroll to the bottom - it's a long file!)

---

## 🔧 Step 3: Supabase Dashboard

### Navigate to SQL Editor

```
Supabase Dashboard Layout:
┌────────────────────────────────────────┐
│ ☰ Menu                    Your Project │
├────────────────────────────────────────┤
│ 📊 Home                                 │
│ 🔧 Table Editor                         │
│ 🔐 Authentication                       │
│ 📦 Storage                              │
│ 🗄️ Database                             │
│   ├── Tables                            │
│   ├── Triggers                          │
│   ├── Functions                         │
│   ├── Extensions                        │
│   └── Replication                       │
│ 💻 SQL Editor         ← Click Here!    │
│ 📡 API                                  │
│ ⚙️ Settings                             │
└────────────────────────────────────────┘
```

---

## ✍️ Step 4: Paste and Run SQL

### SQL Editor View

```
┌─────────────────────────────────────────────────┐
│ SQL Editor                         [+ New Query]│
├─────────────────────────────────────────────────┤
│                                                  │
│  1  -- Paste your SQL here                      │
│  2  CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; │
│  3  CREATE TABLE IF NOT EXISTS public.users ... │
│  4  ...                                          │
│  5  ...                                          │
│                                                  │
│                              [Run] [Ctrl+Enter] │
└─────────────────────────────────────────────────┘
```

**Actions**:
1. Click **New Query**
2. Paste all SQL from DATABASE_SCHEMA.sql
3. Click **Run** button (or press Ctrl/Cmd + Enter)
4. Wait for the green "Success" message

---

## ✅ Step 5: Verify Tables Created

### Table Editor View

```
┌─────────────────────────────────────────────────┐
│ Table Editor                                     │
├─────────────────────────────────────────────────┤
│ All tables (5)                                   │
│                                                  │
│ 📋 users                    500 rows             │
│ 💬 chats                      0 rows             │
│ 👥 chat_participants          0 rows             │
│ 📨 messages                   0 rows             │
│ 👫 groups                     0 rows             │
│                                                  │
└─────────────────────────────────────────────────┘
```

**What to check**: All 5 tables should appear in the list.

---

## 🎊 Step 6: App Detects Setup

### Automatically Detected

After running the SQL, go back to your app and click **"Check Setup Again"**.

The app will automatically detect the tables and show:

```
┌─────────────────────────────────────────────────┐
│  ✅ All tables found!                            │
│  Redirecting to login...                         │
└─────────────────────────────────────────────────┘
```

Then you'll see the **Login/Signup page**! 🎉

---

## 🔐 Step 7: Sign Up

### Signup Screen

```
┌─────────────────────────────────────────────────┐
│              💬 ChatConnect                      │
│         Connect with friends and family          │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │        Welcome                           │   │
│  │  Sign in to your account or create one  │   │
│  │                                          │   │
│  │  [  Login  ] [ Sign Up ]  ← Click here  │   │
│  │                                          │   │
│  │  Name:     [________________]            │   │
│  │  Email:    [________________]            │   │
│  │  Password: [________________]            │   │
│  │            At least 6 characters         │   │
│  │                                          │   │
│  │         [Create Account]                 │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Fill in**:
- Name: Your Name
- Email: your@email.com
- Password: yourpassword (minimum 6 chars)

---

## 📱 Step 8: Chat Interface

### After Login

```
┌─────────────────────────────────────────────────────────┐
│ 💬 ChatConnect        [New Chat]  [@] [▼]               │
├──────────────────┬──────────────────────────────────────┤
│                  │                                       │
│   Chats          │    Welcome to ChatConnect            │
│                  │                                       │
│ [Search users]   │         💬                            │
│                  │                                       │
│ No chats yet     │    Select a chat from the list       │
│                  │    or start a new conversation        │
│                  │                                       │
│                  │                                       │
│                  │                                       │
└──────────────────┴──────────────────────────────────────┘
```

**You're in!** Now you can:
- Click **New Chat** to find users
- Search for people
- Start conversations

---

## 👥 Step 9: Search Users

### Click "New Chat"

```
┌─────────────────────────────────────────────────┐
│  Start a New Chat                               │
│                                                  │
│  🔍 [Search by name or email...    ]            │
│                                                  │
│  ┌───────────────────────────────────────┐     │
│  │  👤 John Doe                    💬    │     │
│  │     john@example.com                  │     │
│  │     "Hey there! I am using ChatConnect"│    │
│  ├───────────────────────────────────────┤     │
│  │  👤 Jane Smith                  💬    │     │
│  │     jane@example.com                  │     │
│  │     "Available to chat"               │     │
│  └───────────────────────────────────────┘     │
└─────────────────────────────────────────────────┘
```

**Actions**:
1. Type a name or email
2. Click the 💬 icon to start chat
3. Chat window opens automatically

---

## 💬 Step 10: Send Messages

### Chat Window

```
┌─────────────────────────────────────────────────────────┐
│ 💬 ChatConnect        [New Chat]  [@] [▼]               │
├──────────────────┬──────────────────────────────────────┤
│                  │ 👤 John Doe        Online      ⋮     │
│   Chats          ├──────────────────────────────────────┤
│                  │                                       │
│ 👤 John Doe  1   │  Hi there!                   3:45 PM │
│ Hi there!        │                         ✓✓ (blue)    │
│ 2m ago           │                                       │
│                  │              Hello! How are you?      │
│                  │           ✓ (gray)           3:46 PM  │
│                  │                                       │
│                  │                                       │
│                  ├──────────────────────────────────────┤
│                  │ [Type a message...        ] [Send]   │
└──────────────────┴──────────────────────────────────────┘
```

**Notice**:
- Messages appear instantly (real-time!)
- ✓ = Sent (gray)
- ✓✓ = Delivered (gray)
- ✓✓ = Seen (blue)
- Unread count badge (1) in chat list

---

## 🟢 Step 11: Online Status

### Online Indicator

```
In Chat List:
┌────────────────────┐
│ 👤 John Doe        │
│ Hey there!         │
│ 🟢 Online          │ ← Green dot!
└────────────────────┘

In Chat Header:
┌────────────────────┐
│ 👤 John Doe        │
│    Online          │ ← Shows "Online"
└────────────────────┘

When Offline:
┌────────────────────┐
│ 👤 John Doe        │
│ Last seen 5m ago   │ ← Shows time
└────────────────────┘
```

---

## 📊 Status Indicators Explained

### Message Status

```
Your message (sent):     [Hello!]  ✓

Delivered to recipient:  [Hello!]  ✓✓

Seen by recipient:       [Hello!]  ✓✓ (blue)
```

### Unread Count

```
Chat with 3 unread messages:
┌────────────────────┐
│ 👤 Jane Smith  [3] │ ← Green badge
│ See you tomorrow!  │
│ 5m ago             │
└────────────────────┘
```

### Online Status

```
🟢 Green dot  = Online now
⚫ Gray dot   = Offline
"Last seen 5m ago" = When they left
```

---

## 🎯 Common Scenarios

### Scenario 1: First Time User

```
1. Open app → See setup screen
2. Go to Supabase → Run SQL
3. Return to app → Click "Check Setup Again"
4. See login page → Click "Sign Up"
5. Create account → Login
6. See empty chat list → Click "New Chat"
7. Search users → Start chatting!
```

### Scenario 2: Returning User

```
1. Open app → Automatically logged in
2. See chat list with conversations
3. Click a chat → View messages
4. Type message → Send instantly
5. Watch status change: ✓ → ✓✓ → ✓✓ (blue)
```

### Scenario 3: Testing Real-Time

```
Browser 1 (User A):
1. Open app → Login as User A
2. Send message: "Hello!"

Browser 2 (User B):
1. Open in incognito → Login as User B
2. Message appears instantly! (no refresh)
3. Reply: "Hi!"

Browser 1 (User A):
1. Reply appears instantly!
2. Checkmarks turn blue when B reads it
```

---

## 🔔 What Happens When...

### When You Send a Message

```
1. Type message → Click Send
2. Message appears in your chat
3. Status shows: ✓ (sent)
4. Database saves message
5. Other user's app gets notified (real-time)
6. Status changes to: ✓✓ (delivered)
```

### When You Receive a Message

```
1. Other user sends message
2. Your app receives real-time notification
3. Chat appears in your list (or updates)
4. Unread badge appears: [1]
5. Click chat → Open conversation
6. Status changes to: ✓✓ (blue = seen)
7. Badge disappears
```

### When You Come Online

```
1. Open app
2. Your status → online: true
3. All active chats get notified
4. Other users see 🟢 green dot
5. They see "Online" in chat header
```

### When You Close the App

```
1. Close tab/browser
2. Your status → online: false
3. last_seen → current timestamp
4. Other users see "Last seen Xm ago"
5. Green dot disappears
```

---

## 🎨 UI Elements Explained

### Avatar Colors

```
👤 Default (no photo):
   - Shows initials (JD for John Doe)
   - Blue gradient background
   - White text
```

### Badges

```
🟢 Green badge = Unread messages
🔵 Blue checkmarks = Message seen
⚪ Gray checkmarks = Message sent/delivered
```

### Buttons

```
[Primary Button]   - Blue background (main actions)
[Secondary Button] - White background (cancel/back)
[Ghost Button]     - Transparent (menu items)
```

---

## 🎉 You're All Set!

Your chat application is now fully functional with:
- ✅ Real-time messaging
- ✅ Status indicators
- ✅ Online presence
- ✅ Unread counts
- ✅ User profiles

**Enjoy chatting!** 💬✨

---

## 📞 Need Help?

If something doesn't look right:
1. Check [QUICK_START.md](./QUICK_START.md) for setup steps
2. See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for troubleshooting
3. Verify all SQL was run successfully
4. Check browser console (F12) for errors

