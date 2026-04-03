# ⚠️ Error Reference - Quick Guide

Quick reference for all error messages you might see.

---

## ✅ Expected Errors (Safe to Ignore)

These errors are **normal** and **handled automatically** by the app:

### Before Database Setup:

```
❌ "Could not find the table 'public.users' in the schema cache"
❌ PGRST205 error
❌ "relation does not exist"
```

**What it means**: Database tables don't exist yet

**What happens**: App shows setup screen automatically

**Action needed**: ✅ Follow setup instructions on screen

---

### Missing User Profile (Auto-Fixed):

```
❌ "Cannot coerce the result to a single JSON object"
❌ PGRST116 error
❌ "The result contains 0 rows"
```

**What it means**: User profile doesn't exist in database

**What happens**: App automatically creates the profile

**Action needed**: ✅ None - handled automatically

---

### Clipboard Error:

```
❌ NotAllowedError: Failed to execute 'writeText' on 'Clipboard'
❌ Clipboard API has been blocked
```

**What it means**: Browser blocked clipboard access

**What happens**: Nothing - this feature has been removed

**Action needed**: ✅ Ignore this error completely

---

## ❗ Errors That Need Fixing

### Database Errors:

#### After running SQL:
```
❌ "Could not find the table 'public.users'"
```
**Fix**: Re-run the SQL schema in Supabase SQL Editor

---

#### RLS Error:
```
❌ "new row violates row-level security policy"
❌ "permission denied for table users"
```
**Fix**: Re-run the RLS policies section of SQL schema

---

### Authentication Errors:

#### Invalid Credentials:
```
❌ "Invalid login credentials"
```
**Fix**: Check email and password are correct

---

#### Email Already Exists:
```
❌ "User already registered"
❌ "duplicate key value violates unique constraint"
```
**Fix**: Use a different email or login instead

---

#### Weak Password:
```
❌ "Password should be at least 6 characters"
```
**Fix**: Use a longer password (minimum 6 characters)

---

#### Edge Function Error:
```
❌ "Signup failed"
❌ "Failed to fetch"
❌ TypeError: Failed to fetch
```
**Fix**: ✅ **No Edge Function needed!** But if you're still seeing this error:

**Possible Causes**:
1. **Network/Internet Issue** - Check your connection
2. **Supabase Project Down** - Check Supabase status
3. **CORS/Browser Issue** - Try incognito mode
4. **Supabase Configuration** - Verify project ID and API key

**Debugging Steps**:
1. Open browser console (F12)
2. Look for these messages:
   ```
   ✅ Initializing Supabase client...
   ✅ URL: https://YOUR_PROJECT.supabase.co
   ✅ Key exists: true
   ✅ Supabase client initialized successfully
   ```
3. If you see `❌ Supabase configuration missing!`:
   - Your project ID or API key is invalid
   - Contact support or create a new Supabase project

4. When you click "Sign Up", look for:
   ```
   Starting signup process for: email@example.com
   Calling Supabase signUp...
   SignUp response: { authData: {...}, signupError: null }
   User created in auth, creating profile...
   Profile created successfully
   Signing out user...
   Signup complete!
   ```

5. If you see "Failed to fetch" at the "Calling Supabase signUp..." step:
   - **Check internet connection**
   - **Try different network** (mobile hotspot, different WiFi)
   - **Try incognito/private browsing mode**
   - **Disable browser extensions** (ad blockers, privacy tools)
   - **Try different browser** (Chrome, Firefox, Safari)
   - **Check if Supabase is down**: https://status.supabase.com

**Quick Fixes**:
```bash
✅ Refresh page (Ctrl+R or Cmd+R)
✅ Clear browser cache
✅ Try incognito mode
✅ Try different browser
✅ Check internet connection
✅ Verify Supabase project exists in dashboard
```

**If nothing works**:
- Your Supabase project might be paused/deleted
- Go to https://supabase.com/dashboard
- Create a new project
- Update project ID and API key in the app

---

### Real-Time Errors:

#### Subscription Failed:
```
❌ "Realtime subscription error"
❌ "Channel error"
```
**Fix**: 
1. Enable Realtime on tables (Database → Replication)
2. Refresh the page

---

#### Connection Error:
```
❌ "WebSocket connection failed"
```
**Fix**: 
1. Check internet connection
2. Check Supabase status
3. Refresh the page

---

### Message Errors:

#### Permission Denied:
```
❌ "permission denied for relation messages"
```
**Fix**: Re-run RLS policies from SQL schema

---

#### Invalid Message:
```
❌ "new row violates check constraint"
```
**Fix**: Message might be empty or invalid format

---

## 🔍 Quick Diagnostics

### Error Category Reference:

| Error Code | Category | Usually Means |
|------------|----------|---------------|
| PGRST205 | Database | Table doesn't exist |
| PGRST301 | Auth | JWT token invalid |
| 42P01 | Database | Table not found |
| 23505 | Database | Duplicate entry |
| 42501 | Auth | Permission denied |

---

## 🛠️ Common Fix Checklist

When you see an error, try these in order:

1. **Refresh the page**
   - Solves 50% of issues
   - Resets connections

2. **Check database setup**
   - Go to Table Editor
   - Verify all 5 tables exist
   - Check RLS is enabled

3. **Check Realtime**
   - Go to Database → Replication
   - Enable for: messages, users, chat_participants

4. **Re-login**
   - Logout and login again
   - Refreshes JWT token

5. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)
   - Or clear cache in browser settings

6. **Check browser console**
   - Press F12
   - Look for specific error messages
   - Follow error-specific fixes above

---

## 📝 Error Patterns

### Pattern: "Could not find..."
**Category**: Missing resource  
**Common causes**: Database not set up, table not created  
**Fix**: Run SQL schema or create missing resource

---

### Pattern: "Permission denied..."
**Category**: Access control  
**Common causes**: RLS policies not set, not logged in  
**Fix**: Re-run RLS policies, ensure user is logged in

---

### Pattern: "Invalid..."
**Category**: Bad input  
**Common causes**: Wrong credentials, invalid data format  
**Fix**: Check input, use correct format

---

### Pattern: "Failed to fetch..."
**Category**: Network/API  
**Common causes**: Server down, network issue, CORS  
**Fix**: Check connection, check Supabase status, verify API settings

---

### Pattern: "Realtime..."
**Category**: WebSocket/Subscription  
**Common causes**: Realtime not enabled, connection dropped  
**Fix**: Enable Realtime, refresh page, check network

---

## 🎯 Error Priority

### Priority 1: Critical (Fix Immediately)
- "Could not find the table" (after SQL run)
- "Permission denied for table"
- "Failed to fetch" (signup/login)

### Priority 2: Important (Fix Soon)
- Realtime subscription errors
- WebSocket connection errors
- Invalid credentials

### Priority 3: Minor (Can Ignore)
- Clipboard API errors
- "Could not find the table" (before SQL run)
- Network timeout (temporary)

---

## 💡 Pro Tips

### Prevent Errors:

1. **Run ALL SQL code** - Don't skip sections
2. **Enable Realtime** - For all 3 tables
3. **Use valid email** - Proper format
4. **Strong password** - Minimum 6 characters
5. **Stay logged in** - Don't clear cookies unnecessarily

### Debug Faster:

1. **Keep console open** - F12 while developing
2. **Check Network tab** - See API requests
3. **Read full error** - Don't just skim
4. **Check timestamp** - When did error occur?
5. **Try incognito** - Rules out cache issues

---

## 🆘 When to Ask for Help

You should seek help if:
- ❌ Followed all troubleshooting steps
- ❌ Error persists after refresh
- ❌ Can't complete basic setup
- ❌ Error not listed in this guide
- ❌ Multiple errors appearing

Before asking:
- ✅ Check TROUBLESHOOTING.md
- ✅ Read error message completely
- ✅ Note what you were doing when error occurred
- ✅ Check browser console
- ✅ Copy full error message

---

## 📚 Related Guides

- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Detailed solutions
- **[QUICK_START.md](./QUICK_START.md)** - Setup walkthrough
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup guide

---

**Remember**: Most errors before database setup are expected and handled automatically. The app will guide you through the setup process! 🚀