# 🔍 Debugging "Failed to Fetch" Error

**Error**: `TypeError: Failed to fetch`  
**When it occurs**: During signup process  
**Severity**: Critical - prevents new user registration

---

## 🎯 Quick Diagnosis

Open your browser console (F12) and look for these messages when you try to sign up:

### ✅ GOOD - Everything Working:
```
✅ Initializing Supabase client...
✅ URL: https://oopfzfhzdosafvsatzgz.supabase.co
✅ Key exists: true
✅ Supabase client initialized successfully
Starting signup process for: test@example.com
Calling Supabase signUp...
SignUp response: { authData: {...}, signupError: null }
User created in auth, creating profile...
Profile created successfully
Signing out user...
Signup complete!
```

### ❌ BAD - Configuration Problem:
```
❌ Supabase configuration missing!
projectId: undefined
publicAnonKey exists: false
```
**FIX**: Your Supabase project isn't configured - see [Configuration Problem](#configuration-problem) below

### ❌ BAD - Network Problem:
```
✅ Supabase client initialized successfully
Starting signup process for: test@example.com
Calling Supabase signUp...
❌ TypeError: Failed to fetch
```
**FIX**: Network or connectivity issue - see [Network Problem](#network-problem) below

---

## 🔧 Fix #1: Configuration Problem

### Symptoms:
- `❌ Supabase configuration missing!`
- App loads but signup immediately fails
- No network request is made

### Root Cause:
Your Supabase project ID or API key is missing/invalid

### Solution:

1. **Verify Supabase Project Exists**:
   - Go to https://supabase.com/dashboard
   - Make sure you have an active project
   - Project should be green/running (not paused)

2. **Check Project Credentials**:
   - In Supabase dashboard, go to Settings → API
   - Copy these values:
     - **Project URL**: `https://xxxxx.supabase.co`
     - **Project ID**: The `xxxxx` part
     - **Anon/Public Key**: Long JWT token starting with `eyJ...`

3. **Verify Configuration File**:
   - The file `/utils/supabase/info.tsx` should contain:
     ```typescript
     export const projectId = "your-project-id"
     export const publicAnonKey = "eyJhbGc..."
     ```
   - These should match your Supabase project

4. **If Configuration is Wrong**:
   - **You cannot edit this file** (it's auto-generated)
   - You need to restart with correct Supabase credentials
   - Contact support for help updating credentials

---

## 🔧 Fix #2: Network Problem

### Symptoms:
- Supabase client initializes successfully
- Signup starts but fails with "Failed to fetch"
- Network request doesn't complete

### Root Cause:
Can't reach Supabase servers - network/connectivity issue

### Solutions:

#### Step 1: Check Internet Connection
```bash
✅ Open a new tab
✅ Visit https://www.google.com
✅ If it loads → Internet works
✅ If it doesn't → Fix internet first
```

#### Step 2: Check Supabase Status
```bash
✅ Visit https://status.supabase.com
✅ Check if all systems are operational
✅ If there's an outage → Wait for Supabase to fix it
```

#### Step 3: Check Your Supabase Project
```bash
✅ Go to https://supabase.com/dashboard
✅ Select your project
✅ Check project status (should be green/active)
✅ If paused → Click "Restore" or "Resume"
✅ If deleted → You need a new project
```

#### Step 4: Browser Issues

**Try Incognito/Private Mode**:
```bash
Chrome: Ctrl+Shift+N (Cmd+Shift+N on Mac)
Firefox: Ctrl+Shift+P (Cmd+Shift+P on Mac)
Safari: Cmd+Shift+N
Edge: Ctrl+Shift+N
```
If it works in incognito:
- Clear browser cache
- Disable extensions (especially ad blockers, privacy tools)
- Check browser permissions

**Try Different Browser**:
```bash
✅ Chrome
✅ Firefox  
✅ Safari
✅ Edge
```
If it works in a different browser → Original browser has issues

#### Step 5: Network Restrictions

**Corporate/School Network?**
- Network might block Supabase
- Try from home network
- Try mobile hotspot
- Contact IT department

**VPN/Proxy?**
- Temporarily disable VPN
- Try without proxy
- Some VPNs block API calls

**Firewall/Antivirus?**
- Check if firewall blocks Supabase
- Whitelist `*.supabase.co`
- Temporarily disable to test

#### Step 6: CORS Issues

**Developer Mode?**
If you're running locally:
```bash
# Supabase has CORS enabled for all origins
# This shouldn't be an issue
# But if you're running on localhost:
# Make sure you're accessing via the Figma Make URL
# Not directly opening the HTML file
```

---

## 🔧 Fix #3: Supabase Project Issues

### Symptoms:
- Was working before
- Suddenly stopped working
- "Failed to fetch" on all requests

### Possible Causes:

#### Project Paused:
```
✅ Go to Supabase dashboard
✅ Check if project shows "Paused"
✅ Click "Restore" to resume
✅ Wait 2-3 minutes for project to start
✅ Refresh app and try again
```

#### Project Deleted:
```
❌ Project doesn't appear in dashboard
❌ Need to create new project
❌ Update project ID and API key
```

#### Free Tier Limits:
```
# Supabase free tier limits:
- 500 MB database
- 1 GB file storage  
- 2 GB bandwidth per month
- 50,000 monthly active users

✅ Check usage in dashboard
✅ If exceeded → Upgrade plan or wait for reset
```

#### API Key Rotated:
```
✅ Go to Settings → API
✅ Check if API keys changed
✅ If yes → Need to update in app
```

---

## 🔧 Fix #4: Advanced Debugging

### Check Network Tab (F12 → Network):

1. **Open Developer Tools**: Press F12
2. **Go to Network Tab**
3. **Try to sign up**
4. **Look for requests to Supabase**

#### What to Look For:

**Request to** `https://oopfzfhzdosafvsatzgz.supabase.co/auth/v1/signup`

**Status Codes**:
- ✅ **200 OK** → Worked! (shouldn't see error)
- ❌ **0** or **Failed** → Network issue
- ❌ **403** → Permission denied (API key wrong)
- ❌ **404** → Endpoint not found (project doesn't exist)
- ❌ **500** → Supabase server error
- ❌ **503** → Supabase unavailable

**If Status = 0 or Failed**:
- Network blocked request
- CORS issue
- Connection timeout
- Check firewall/antivirus

**If Status = 403**:
- API key is wrong/expired
- Project doesn't exist
- Need to check credentials

**If Status = 500/503**:
- Supabase having issues
- Check https://status.supabase.com
- Wait and retry

---

## 🎯 Step-by-Step Troubleshooting

Follow these steps IN ORDER:

### ✅ Step 1: Verify Basics
```bash
□ Internet connection working?
□ Supabase dashboard accessible?
□ Project exists and is active?
□ Browser console open (F12)?
```

### ✅ Step 2: Check Initialization
```bash
□ See "✅ Supabase client initialized successfully"?
□ URL shows your correct project?
□ Key exists = true?
```
**If NO** → [Configuration Problem](#configuration-problem)

### ✅ Step 3: Check Network
```bash
□ Try incognito mode
□ Try different browser
□ Try different network (mobile hotspot)
□ Check Supabase status page
```
**If fails everywhere** → [Network Problem](#network-problem)

### ✅ Step 4: Check Project
```bash
□ Project active in dashboard?
□ Not paused or deleted?
□ Within usage limits?
□ API keys valid?
```
**If issues found** → [Supabase Project Issues](#supabase-project-issues)

### ✅ Step 5: Deep Debug
```bash
□ Check Network tab in DevTools
□ Look at actual request/response
□ Check console for all errors
□ Try signup with different email
```
**If still failing** → [Advanced Debugging](#advanced-debugging)

---

## 🚨 Emergency Workarounds

### If You Can't Fix It:

#### Option 1: Use Different Email
```
Sometimes specific emails trigger issues
Try: test123@gmail.com instead of test@test.com
```

#### Option 2: Login Instead
```
If you created account before error started:
- Try logging in instead
- Might work even if signup doesn't
```

#### Option 3: Wait and Retry
```
Temporary Supabase issues usually resolve in:
- 5-10 minutes (minor)
- 30-60 minutes (major)
- Check status.supabase.com for updates
```

#### Option 4: Create New Project
```
Last resort:
1. Create new Supabase project
2. Get new project ID and API key
3. Run database schema in new project
4. Update app with new credentials
```

---

## 📊 Common Scenarios

### Scenario 1: "It worked yesterday!"

**Likely causes**:
1. Supabase project paused (free tier auto-pauses after 1 week inactivity)
2. Internet/network changed
3. Browser updated and has new restrictions

**Solutions**:
1. Check if project is paused → Restore it
2. Clear browser cache
3. Try incognito mode

---

### Scenario 2: "Works on my phone but not my computer!"

**Likely causes**:
1. Computer has firewall/antivirus blocking
2. Corporate/school network restrictions
3. Browser extensions interfering

**Solutions**:
1. Disable firewall temporarily to test
2. Try from home network instead
3. Disable all browser extensions

---

### Scenario 3: "Works in Chrome but not Firefox!"

**Likely causes**:
1. Browser-specific caching issue
2. Extension conflict
3. Different browser settings

**Solutions**:
1. Clear Firefox cache
2. Try Firefox private window
3. Check Firefox permissions/settings

---

### Scenario 4: "Worked during setup, fails on signup!"

**Likely causes**:
1. Database setup check works, but auth doesn't
2. Different network endpoints
3. Intermittent connectivity

**Solutions**:
1. This is unusual - check Supabase status
2. Try from different network
3. Check browser console for specific error

---

## 📝 Checklist for Support

If you need to ask for help, have this ready:

```
✅ Browser name and version: _____________
✅ Operating system: _____________
✅ Error appears in console? Yes / No
✅ Full error message: _____________
✅ Supabase client initialized? Yes / No
✅ Project ID visible in logs? Yes / No
✅ Tried incognito mode? Yes / No
✅ Tried different browser? Yes / No
✅ Tried different network? Yes / No
✅ Supabase dashboard accessible? Yes / No
✅ Project status in dashboard: _____________
✅ Network tab shows request? Yes / No
✅ Request status code: _____________
```

---

## ✅ Success Indicators

You'll know it's fixed when you see:

```
✅ Initializing Supabase client...
✅ Supabase client initialized successfully
Starting signup process for: your@email.com
Calling Supabase signUp...
SignUp response: { authData: {user: {...}}, signupError: null }
User created in auth, creating profile...
Profile created successfully
Signing out user...
Signup complete!
```

And in the UI:
```
✅ "Account created successfully! Please log in."
✅ Form switches to Login tab
✅ Can login with new credentials
✅ Enters chat app successfully
```

---

## 🎓 Understanding the Error

### What "Failed to fetch" Really Means:

This is a **browser error**, not a Supabase error. It means:
- The browser **tried** to make a network request
- The request **didn't complete**
- Could be network, CORS, or server unreachable

### Why It's Generic:

Browsers hide details for security:
- Don't reveal if site exists
- Don't expose internal network details
- Same error for many different root causes

### How We Fixed It:

We added detailed logging so you can see:
- ✅ Is Supabase configured?
- ✅ Did client initialize?
- ✅ What stage of signup failed?
- ✅ What was the actual Supabase error?

---

## 🔗 Related Resources

- **Supabase Status**: https://status.supabase.com
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Supabase Docs**: https://supabase.com/docs
- **Browser Console**: Press F12

---

## 💡 Prevention Tips

To avoid this error in the future:

1. **Keep project active**: Use it at least once a week
2. **Monitor status**: Check Supabase status page periodically
3. **Stable network**: Use reliable internet connection
4. **Update credentials**: If you rotate API keys, update app
5. **Check limits**: Monitor free tier usage

---

**Remember**: The detailed console logs will tell you exactly where the problem is. Always check the console first! 🔍
