# 🚀 Deployment Guide - ChatConnect

This guide covers deploying your chat application to production.

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:
- ✅ Supabase project created
- ✅ Database schema deployed (from `DATABASE_SCHEMA.sql`)
- ✅ Storage bucket created (`profile-photos`)
- ✅ All environment variables configured
- ✅ App tested locally

---

## 🗄️ Database Deployment

### Step 1: Create Production Database

Your Supabase database is automatically production-ready, but verify:

1. **Go to Supabase Dashboard** → Your Project
2. **Navigate to Database** → Check tables exist:
   - users
   - chats
   - chat_participants
   - messages
   - groups

3. **Verify RLS Policies**:
   - Go to **Table Editor** → Click any table → **Policies** tab
   - Ensure policies are enabled (green icons)

4. **Check Triggers**:
   - Go to **Database** → **Triggers**
   - Verify these exist:
     - `trigger_update_chat_timestamp`
     - `trigger_increment_unread_count`
     - `on_auth_user_created`

### Step 2: Enable Realtime

1. Go to **Database** → **Replication**
2. Make sure these tables have Realtime enabled:
   - ✅ messages
   - ✅ chat_participants
   - ✅ users
3. Click the toggle to enable if needed

---

## 📦 Storage Configuration

### Profile Photos Bucket

1. **Go to Storage** in Supabase Dashboard
2. **Create bucket**: `profile-photos`
   - Make it **public**
   - Set max file size: 2MB
   - Allowed MIME types: image/png, image/jpeg, image/jpg

3. **Set up policies** (if not done via SQL):

```sql
-- Allow public to view
CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos' AND
  auth.role() = 'authenticated'
);
```

---

## 🔐 Environment Variables

Your app uses these from Supabase:
- `SUPABASE_URL` - Your project URL
- `SUPABASE_ANON_KEY` - Public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server only)

These are automatically available in:
- `/utils/supabase/info.tsx` (frontend)
- Edge Functions (backend)

**Important**: Never expose service role key in frontend code!

---

## 🌐 Frontend Deployment

The app is already deployed via Figma Make, but if you need to redeploy:

### Option 1: Figma Make (Current)
Your app is automatically deployed when you save changes in Figma Make.

### Option 2: Export & Deploy Separately

If you want to deploy elsewhere:

1. **Export your code** from Figma Make
2. **Choose a hosting platform**:
   - Vercel (recommended)
   - Netlify
   - Cloudflare Pages
   - GitHub Pages

3. **Deploy to Vercel**:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts to configure
```

4. **Configure environment variables**:
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`

---

## ⚡ Edge Function Deployment

Your signup endpoint needs to be deployed to Supabase.

### Deploy Edge Function

1. **Install Supabase CLI**:
```bash
npm install -g supabase
```

2. **Login to Supabase**:
```bash
supabase login
```

3. **Link your project**:
```bash
supabase link --project-ref YOUR_PROJECT_ID
```

4. **Deploy functions**:
```bash
supabase functions deploy make-server-32bfa1bd
```

5. **Set environment variables**:
```bash
supabase secrets set SUPABASE_URL=your-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key
```

---

## 🔒 Security Hardening

### 1. Enable Email Verification (Optional)

By default, users are auto-confirmed. To enable email verification:

1. Go to **Authentication** → **Settings**
2. Enable **Enable email confirmations**
3. Configure email templates
4. Update signup function to remove `email_confirm: true`

### 2. Set Up Rate Limiting

Supabase provides automatic rate limiting, but you can customize:

1. Go to **Settings** → **API**
2. Configure rate limits:
   - Auth requests: 30/min per IP
   - Database requests: 100/min per user
   - Storage requests: 50/min per user

### 3. Configure CORS

If deploying to custom domain:

1. Go to **Settings** → **API**
2. Add your production URL to allowed origins
3. Example: `https://yourchat.com`

### 4. Enable SSL/HTTPS

Supabase automatically provides HTTPS. For custom domains:
1. Use Cloudflare or similar CDN
2. Enable Always Use HTTPS
3. Set up SSL certificate

---

## 📊 Monitoring & Logging

### Enable Logging

1. Go to **Logs** in Supabase Dashboard
2. View different log types:
   - API logs
   - Auth logs
   - Database logs
   - Edge Function logs

### Set Up Alerts

1. Go to **Logs** → **Webhooks**
2. Configure alerts for:
   - Failed auth attempts
   - Database errors
   - Function timeouts

### Monitor Performance

Key metrics to watch:
- **Response Time**: Database query speed
- **Error Rate**: Failed requests
- **Active Connections**: Concurrent users
- **Storage Usage**: File storage consumption

---

## 🧪 Testing in Production

### 1. Create Test Users

Create 2-3 test accounts:
```
test1@yourchat.com
test2@yourchat.com
test3@yourchat.com
```

### 2. Test Core Flows

- ✅ Sign up new user
- ✅ Log in existing user
- ✅ Search for users
- ✅ Create one-on-one chat
- ✅ Send messages
- ✅ Receive messages in real-time
- ✅ Check message status updates
- ✅ Test online/offline status
- ✅ Create group chat
- ✅ Send group messages
- ✅ Test logout

### 3. Test Edge Cases

- Multiple tabs open (same user)
- Slow network (throttle in DevTools)
- Offline mode (disconnect network)
- Large messages (500+ characters)
- Rapid message sending (spam test)
- Browser refresh during chat

---

## 🚨 Troubleshooting Production Issues

### Issue: Messages not real-time
**Check**:
- Realtime enabled on tables
- WebSocket connection (check Network tab)
- CORS settings
- SSL/HTTPS configuration

**Fix**:
```sql
-- Re-enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### Issue: Auth errors
**Check**:
- JWT secret is correct
- Email confirmation setting
- User exists in database

**Fix**:
- Verify environment variables
- Check Supabase Auth logs
- Ensure RLS policies allow access

### Issue: Slow queries
**Check**:
- Database indexes exist
- Query complexity
- Number of concurrent users

**Fix**:
```sql
-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_messages_chat_created 
ON messages(chat_id, created_at DESC);
```

### Issue: Storage upload fails
**Check**:
- File size limit (2MB)
- MIME type allowed
- Storage policies

**Fix**:
- Increase bucket size limit
- Add MIME types to allowed list
- Verify storage policies

---

## 📈 Scaling Considerations

### Database Scaling

Supabase automatically scales, but monitor:
- **Connection limit**: Default 100 concurrent
- **Storage**: 500MB free, upgrade for more
- **Bandwidth**: 2GB/month free

**Upgrade when**:
- Consistent 80%+ connection usage
- Regular query timeouts
- Storage almost full

### Supabase Pricing Tiers

**Free Tier** (Current):
- 500MB database
- 1GB file storage
- 2GB bandwidth/month
- 50,000 monthly active users

**Pro Tier** ($25/month):
- 8GB database
- 100GB file storage
- 250GB bandwidth/month
- Unlimited monthly active users
- Daily backups
- Email support

**Team/Enterprise**:
- Custom resources
- SLA guarantees
- Priority support
- Advanced security

### Performance Optimization

**When to optimize**:
- Page load > 3 seconds
- Message delivery > 1 second
- Chat list loading > 2 seconds

**Optimization techniques**:
1. Add database indexes
2. Implement pagination
3. Use React.memo
4. Lazy load components
5. Optimize images
6. Use service workers
7. Implement caching

---

## 🔄 Continuous Deployment

### Set Up CI/CD

**Option 1: GitHub Actions**
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: supabase/setup-cli@v1
      - run: supabase functions deploy
```

**Option 2: Vercel/Netlify**
- Connect GitHub repo
- Set environment variables
- Auto-deploys on push to main

---

## 📱 Mobile App (Future)

To create mobile apps:

### React Native
1. Use same Supabase backend
2. Install React Native libraries
3. Adapt UI components
4. Deploy to App Store/Play Store

### Progressive Web App (PWA)
1. Add manifest.json
2. Implement service worker
3. Enable "Add to Home Screen"
4. Works like native app

---

## ✅ Production Checklist

Before going live:
- [ ] Database schema deployed
- [ ] RLS policies enabled
- [ ] Realtime enabled on tables
- [ ] Storage bucket created
- [ ] Storage policies configured
- [ ] Edge functions deployed
- [ ] Environment variables set
- [ ] SSL/HTTPS enabled
- [ ] CORS configured
- [ ] Rate limiting set
- [ ] Monitoring enabled
- [ ] Backup strategy planned
- [ ] Test users created
- [ ] All features tested
- [ ] Performance optimized
- [ ] Documentation updated

---

## 🎉 Launch Checklist

Final steps before launch:
1. [ ] Test with real users (beta)
2. [ ] Monitor error logs
3. [ ] Check performance metrics
4. [ ] Prepare support process
5. [ ] Document known issues
6. [ ] Plan for scaling
7. [ ] Set up status page
8. [ ] Announce launch!

---

## 📞 Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **React Docs**: https://react.dev
- **Stack Overflow**: Tag questions with 'supabase'

---

## 🎊 You're Live!

Congratulations! Your chat application is now in production. Monitor logs, gather user feedback, and iterate!

**Remember**:
- Start small and scale as needed
- Monitor performance metrics
- Keep security updated
- Listen to user feedback
- Deploy updates regularly

Happy chatting! 💬
