# ⚡ "FAILED TO FETCH" ERROR - CHEAT SHEET

**Print this page for quick reference!**

---

## 🎯 FASTEST FIX (Try This First!)

```
1. Go to: https://supabase.com/dashboard
2. Find your project
3. Is it "PAUSED"? → Click "Restore"
4. Wait 2-3 minutes
5. Refresh app page
6. Try signup again
```

**This fixes 90% of cases!**

---

## 🔍 IN-APP DIAGNOSTIC

When you see the error:

```
1. Look for red error box
2. Click "🔍 Run Connection Diagnostic"
3. Click "▶️ Run Tests"
4. Read results
5. Follow recommendations
```

---

## 📊 DIAGNOSTIC RESULTS

### All Green ✅
→ Everything works!  
→ Close diagnostic and try again

### Red on Test 1/2 ❌
→ Configuration problem  
→ Refresh page or contact support

### Red on Test 3 ❌
→ Network problem  
→ Check internet, try incognito, check Supabase status

### Red on Test 5 ❌
→ Project paused  
→ Go to dashboard and restore project

---

## 🚨 EMERGENCY FIXES

### Fix #1: Incognito Mode
```
Ctrl+Shift+N (Cmd+Shift+N on Mac)
Open app in incognito
Try signup
```

### Fix #2: Different Browser
```
Try Chrome, Firefox, or Safari
```

### Fix #3: Different Network
```
Use mobile hotspot
Or different WiFi
```

### Fix #4: Disable VPN
```
Disconnect VPN/proxy
Try again
```

---

## 🖥️ CONSOLE ERRORS

### Press F12 → Console Tab

**Good Messages:**
```
✅ Supabase client initialized successfully
✅ Starting signup process
✅ SignUp response: {authData: ...}
✅ Signup complete!
```

**Bad Messages:**
```
❌ Supabase configuration missing
   → Refresh page

❌ Failed to fetch
   → Check network/Supabase status

❌ User already registered
   → Use Login instead
```

---

## ✅ QUICK CHECKLIST

Before asking for help, try:

```
□ Restore paused Supabase project
□ Refresh page (Ctrl+R)
□ Try incognito mode
□ Try different browser
□ Try different network/WiFi
□ Check https://status.supabase.com
□ Disable VPN
□ Run in-app diagnostic
□ Check browser console (F12)
```

---

## 📞 LINKS

**Supabase:**
- Dashboard: https://supabase.com/dashboard
- Status: https://status.supabase.com

**Documentation:**
- Quick Fix: FAILED_TO_FETCH_QUICK_FIX.md
- Detailed Debug: DEBUG_FAILED_TO_FETCH.md
- Console Guide: CONSOLE_GUIDE.md
- All Errors: ERROR_REFERENCE.md

---

## 💡 SUCCESS = WHEN YOU SEE:

```
✅ "Account created successfully!"
✅ Can switch to Login tab
✅ Can login with credentials
✅ Enters chat app
```

---

**Keep this cheat sheet handy!** 📄✨
