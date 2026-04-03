# 🔧 Troubleshooting Guide - ChatConnect

Common issues and how to fix them.

---

## 🗄️ Database Setup Issues

### Issue: "Could not find the table 'public.users' in the schema cache"

**What it means**: The database tables haven't been created yet.

**Solution**:
1. ✅ This is **expected** and **normal** on first run
2. ✅ The app will automatically show a setup screen
3. ✅ Follow the instructions to run the SQL schema
4. ✅ Click "Check Setup Again" after running the SQL

**Note**: This error will appear in the browser console - this is okay! The app handles it gracefully.

---

### Issue: "Cannot coerce the result to a single JSON object" (PGRST116)

**What it means**: User profile doesn't exist in the database even though user is authenticated.

**What happens**: ✅ **Auto-fixed!** The app automatically creates the missing profile.

**Solution**:
1. ✅ No action needed - the app handles this automatically
2. ✅ Profile is created with default values
3. ✅ User is logged in successfully

**Note**: This can happen if the database trigger didn't run during signup. The app now handles this gracefully.

---

### Issue: Setup screen still shows after running SQL

**Check**:
1. Did you run **ALL** the SQL code from `DATABASE_SCHEMA.sql`?
2. Did you get a "Success" message in Supabase SQL Editor?
3. Are all 5 tables visible in Table Editor?

**Solution**:
1. Go to Supabase Dashboard → Table Editor
2. Verify these tables exist:
   - users
   - chats
   - chat_participants
   - messages
   - groups
3. If any are missing, re-run the SQL for that table
4. Click "Check Setup Again" in the app

---

### Issue: SQL Editor shows errors

**Common errors**:

**"relation already exists"**
- ✅ This is **okay** - means table was already created
- Continue with the rest of the SQL

**"permission denied"**
- ❌ You might not have admin access
- Make sure you're the project owner
- Or ask project admin to run the SQL

**"syntax error"**
- ❌ SQL might be incomplete
- Make sure you copied **ALL** the code
- Don't edit the SQL - use it as-is

---

## 🔐 Authentication Issues

### Issue: Can't sign up - no error message

**Check**:
1. Is the Edge Function deployed?
2. Are environment variables set?

**Solution**:
✅ **No longer needed!** The app now uses Supabase Auth directly.

**Old method (deprecated)**:
```bash
# This is NO LONGER REQUIRED
# Signup works without Edge Function deployment
```

**What to do**:
1. Just use the signup form
2. No Edge Function deployment needed
3. No environment variables to set
4. Works out of the box! ✅

---

### Issue: "Signup failed" error or "Failed to fetch"

**What it means**: ✅ **This error is now fixed!**

**Previous issue**: Edge Function wasn't deployed

**Current solution**: 
1. Signup works directly with Supabase Auth
2. No Edge Function needed
3. No deployment required
4. Just fill out the signup form and it works!

**If you still see this error**:
1. Refresh the page
2. Clear browser cache
3. Make sure database is set up (ran SQL schema)
4. Check password is at least 6 characters

---

### Issue: User created but can't login

**Check**:
1. Are you using the correct email/password?
2. Did you switch to the Login tab?

**Solution**:
1. Make sure you're on the **Login** tab (not Sign Up)
2. Enter the **exact** email and password used during signup
3. Passwords are case-sensitive

---

## 💬 Real-Time Messaging Issues

### Issue: Messages not appearing instantly

**Check**: Is Realtime enabled?

**Solution**:
1. Go to Supabase Dashboard
2. Navigate to **Database** → **Replication**
3. Find these tables and enable Realtime:
   - ✅ messages
   - ✅ users
   - ✅ chat_participants
4. Toggle the switch to enable
5. Refresh your app

---

### Issue: Messages appear but status doesn't update

**Check**: 
1. Is the other user online?
2. Are you both in the same chat?

**Solution**:
1. ✓ = Sent (always shows immediately)
2. ✓✓ = Delivered (only when receiver is online)
3. ✓✓ (blue) = Seen (only when receiver opens the chat)

**Note**: If the other user is offline, status stays at "sent" until they come online.

---

### Issue: Chat list doesn't update

**Solution**:
1. Refresh the page
2. Check Realtime is enabled (see above)
3. Check browser console for errors
4. Try sending a new message

---

## 👥 User Search Issues

### Issue: Can't find other users

**Check**:
1. Did you create other users?
2. Are you searching correctly?

**Solution**:
1. Create a second user (in incognito window)
2. Search by **exact name** or **email**
3. Search is case-insensitive
4. Can't find yourself (you're excluded from search)

---

### Issue: Search shows no results

**Check**:
1. Type at least 2 characters
2. User must exist in database

**Solution**:
1. Go to Table Editor → users table
2. Check if user exists
3. If not, create the user via Sign Up

---

## 🟢 Online Status Issues

### Issue: User always shows offline

**Check**: Is the user actually online?

**How to test**:
1. Open app in two browser windows
2. Login as different users in each
3. Check if green dot appears

**Solution**:
1. User must have the app open
2. User must be logged in
3. Check browser console for connection errors
4. Try refreshing both windows

---

### Issue: "Last seen" not updating

**This is normal**: Last seen only updates when user goes offline.

**How it works**:
1. User opens app → marked as online
2. User closes app → last_seen timestamp recorded
3. "Last seen X minutes ago" calculated from that timestamp

---

## 🔔 Browser Errors

### Issue: "Clipboard API has been blocked"

**What it means**: Browser doesn't allow clipboard access.

**Impact**: Copy button doesn't work (if present).

**Solution**: ✅ **Ignore this error** - it doesn't affect app functionality. The copy feature has been removed to prevent this error.

---

### Issue: Console shows PGRST205 errors

**What it means**: Database tables don't exist yet.

**Solution**: ✅ **This is expected** before running the SQL schema. The app handles this automatically and shows the setup screen.

---

### Issue: CORS errors in console

**What it means**: Cross-origin request blocked.

**Solution**:
1. Check Supabase URL is correct
2. Check you're using the right project
3. Verify ANON key is correct
4. Check Settings → API in Supabase

---

## 🚀 Performance Issues

### Issue: App loads slowly

**Common causes**:
1. Large chat history
2. Slow internet connection
3. Many concurrent users

**Solution**:
1. Clear browser cache
2. Check internet speed
3. Try on a different network
4. Consider pagination (future feature)

---

### Issue: Messages take time to send

**Check**:
1. Network connection
2. Database latency
3. Browser console for errors

**Solution**:
1. Check internet connection
2. Try refreshing the page
3. Check Supabase status: https://status.supabase.com
4. Check browser console for specific errors

---

## 📱 Mobile/Responsive Issues

### Issue: Layout looks broken on mobile

**Solution**:
1. Make sure you're using a modern browser
2. Try landscape mode
3. Clear browser cache
4. Update your browser

---

### Issue: Can't see chat window on mobile

**This is normal**: On mobile, chat list and chat window are separate views.

**How to use**:
1. See chat list first
2. Click a chat to open it
3. Chat window fills the screen
4. Use back button to return to list

---

## 🐛 General Debugging

### How to check browser console:

**Chrome/Edge/Brave**:
1. Press F12 (or Ctrl+Shift+I / Cmd+Option+I on Mac)
2. Click "Console" tab
3. Look for red error messages

**Firefox**:
1. Press F12 (or Ctrl+Shift+K / Cmd+Option+K on Mac)
2. Look for errors in red

**Safari**:
1. Enable Developer menu: Preferences → Advanced → Show Develop menu
2. Develop → Show JavaScript Console
3. Look for errors

---

### What errors are normal:

✅ **Before database setup**:
- "Could not find the table 'public.users'"
- PGRST205 errors

✅ **When not logged in**:
- "No user session found"

✅ **When other user is offline**:
- Messages stay at "sent" status

---

### What errors need fixing:

❌ **After database setup**:
- "Could not find the table..." = Re-run SQL

❌ **After login**:
- "Not authorized" = Check RLS policies
- "Invalid JWT" = Re-login

❌ **When sending messages**:
- "Permission denied" = Check RLS policies
- "Connection failed" = Check internet/Supabase

---

## 🆘 Still Having Issues?

### Quick Checks:
1. ✅ Did you run ALL the SQL code?
2. ✅ Is Realtime enabled on tables?
3. ✅ Are you logged in?
4. ✅ Is internet connection stable?
5. ✅ Did you refresh the page?

### Get Help:
1. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed setup
2. Check [QUICK_START.md](./QUICK_START.md) - Quick walkthrough
3. Check [VISUAL_GUIDE.md](./VISUAL_GUIDE.md) - Visual steps
4. Review browser console errors
5. Check Supabase logs in Dashboard

---

## 📊 Verify Your Setup

### Database Tables Checklist:
- [ ] users table exists
- [ ] chats table exists
- [ ] chat_participants table exists
- [ ] messages table exists
- [ ] groups table exists
- [ ] RLS policies enabled
- [ ] Triggers created
- [ ] Realtime enabled

### Application Checklist:
- [ ] Can access the app
- [ ] See login/signup page (after database setup)
- [ ] Can create account
- [ ] Can login
- [ ] Can search users
- [ ] Can start chat
- [ ] Can send messages
- [ ] Messages appear in real-time

---

## 🎉 Everything Working?

If all checks pass:
- ✅ Database is set up correctly
- ✅ Authentication is working
- ✅ Real-time messaging is functional
- ✅ You're ready to chat!

**Enjoy your chat application!** 💬

---

**Note**: Most "errors" you see are expected and handled by the app. The setup screen guides you through the process automatically. Don't worry if you see errors in the console before completing setup - they're normal!