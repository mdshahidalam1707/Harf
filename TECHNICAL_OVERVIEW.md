# Technical Overview - Chat Application

## Architecture

This is a full-stack web application built with:
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase Edge Functions (Deno runtime with Hono framework)
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth

## Project Structure

```
/src/app/
  ├── App.tsx                    # Main application entry point
  ├── components/
      ├── auth-page.tsx          # Login/Signup UI
      ├── home-page.tsx          # Authenticated user dashboard
      └── ui/                    # Reusable UI components (shadcn/ui)

/supabase/functions/server/
  ├── index.tsx                  # Edge function server (Hono routes)
  └── kv_store.tsx               # Key-value store utilities

/utils/supabase/
  └── info.tsx                   # Supabase configuration
```

## Data Flow

### User Signup Flow
```
1. User fills signup form (AuthPage)
   ↓
2. Form data sent to /make-server-32bfa1bd/signup endpoint
   ↓
3. Server validates input (password length, required fields)
   ↓
4. Server creates user via Supabase Admin API
   ↓
5. User account created with email_confirm: true
   ↓
6. Success response returned to frontend
   ↓
7. User can now log in
```

### User Login Flow
```
1. User enters credentials (AuthPage)
   ↓
2. Frontend calls supabase.auth.signInWithPassword()
   ↓
3. Supabase validates credentials
   ↓
4. If valid, session created and returned
   ↓
5. User data stored in React state
   ↓
6. User redirected to HomePage
```

### Session Management
```
1. On app load, check for existing session
   ↓
2. supabase.auth.getSession() called
   ↓
3. If session exists, user auto-logged in
   ↓
4. User state populated, HomePage shown
```

## Components

### App.tsx (Main Component)
**Responsibilities:**
- Manages global authentication state
- Initializes Supabase client
- Handles routing (show AuthPage or HomePage)
- Provides auth methods to child components

**Key State:**
- `user`: Current authenticated user (null if not logged in)
- `loading`: Loading state during session check

**Key Methods:**
- `checkUser()`: Verifies existing session on mount
- `handleLogin()`: Authenticates user with email/password
- `handleSignup()`: Creates new user account
- `handleLogout()`: Signs out current user

### AuthPage.tsx (Authentication UI)
**Features:**
- Tab-based interface (Login/Signup)
- Form validation (client-side)
- Error/success message display
- Loading states with spinners
- Accessible form inputs

**Props:**
- `onLogin`: Callback for login submission
- `onSignup`: Callback for signup submission

**State Management:**
- Separate state for login and signup forms
- `isLoading`: Prevents multiple submissions
- `error`: Displays error messages
- `successMessage`: Shows success feedback

### HomePage.tsx (Authenticated Dashboard)
**Features:**
- User profile display
- Feature preview cards
- Account information summary
- Logout button

**Props:**
- `user`: Current user object
- `onLogout`: Callback for logout action

## Backend API

### Endpoint: POST /make-server-32bfa1bd/signup

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Response (Error):**
```json
{
  "error": "Password must be at least 6 characters"
}
```

**Validation Rules:**
- Email required and must be valid
- Password required, minimum 6 characters
- Name required
- Email must be unique

**Security:**
- Uses `SUPABASE_SERVICE_ROLE_KEY` for admin operations
- Password hashing handled by Supabase
- CORS enabled for cross-origin requests
- `email_confirm: true` bypasses email verification

## Security Considerations

### Authentication
- Passwords are hashed using bcrypt (Supabase default)
- Session tokens stored in Supabase client
- Service role key never exposed to frontend
- HTTPS enforced by Supabase

### Authorization
- Frontend checks user state before showing HomePage
- Session validation on page load
- Automatic redirect to login if session invalid

### Input Validation
- Client-side validation for immediate feedback
- Server-side validation for security
- SQL injection prevented by Supabase query builder

## Environment Variables

Required in Supabase Edge Function:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Admin key for user creation
- `SUPABASE_ANON_KEY`: Public key for client operations

## Technology Stack Details

### Frontend Dependencies
- **React 18**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS
- **@supabase/supabase-js**: Supabase client
- **lucide-react**: Icon library
- **shadcn/ui**: Pre-built accessible components

### Backend Dependencies
- **Hono**: Fast edge-compatible web framework
- **@supabase/supabase-js**: Server-side Supabase operations
- **Deno**: Runtime environment

## Future Enhancements

### Phase 1 (Completed)
✅ User authentication (signup/login/logout)
✅ Session management
✅ Basic UI/UX

### Phase 2 (Planned)
- [ ] User profile customization
- [ ] Profile photo upload
- [ ] Online/offline status
- [ ] Last seen timestamp

### Phase 3 (Planned)
- [ ] Real-time one-to-one chat
- [ ] Message persistence
- [ ] Typing indicators
- [ ] Read receipts

### Phase 4 (Planned)
- [ ] Group chat functionality
- [ ] Media sharing (images, videos)
- [ ] Voice messages
- [ ] Push notifications

## Performance Optimizations

### Current
- Lazy loading of components possible
- Minimal re-renders via proper state management
- Supabase handles connection pooling

### Future
- Implement React.memo for expensive components
- Add code splitting for large features
- Optimize image loading with lazy loading
- Implement virtual scrolling for message lists

## Testing Strategy

### Unit Tests (To Implement)
- Component rendering
- Form validation logic
- Authentication state management

### Integration Tests (To Implement)
- Signup flow end-to-end
- Login flow end-to-end
- Session persistence

### E2E Tests (To Implement)
- Complete user journey
- Cross-browser compatibility
- Mobile responsiveness

## Deployment

### Prerequisites
- Supabase project created
- Environment variables configured
- Edge function deployed

### Build Process
```bash
npm run build
```

### Deployment Steps
1. Deploy Edge Function to Supabase
2. Configure environment variables
3. Deploy frontend to hosting service (Vercel, Netlify, etc.)
4. Update CORS settings if needed

## Troubleshooting

### Common Issues

**Issue**: "Invalid credentials" on login
**Solution**: Verify email/password, check if user exists

**Issue**: Signup fails silently
**Solution**: Check server logs in Supabase dashboard

**Issue**: Session not persisting
**Solution**: Verify Supabase client initialization

**Issue**: CORS errors
**Solution**: Ensure Edge Function has proper CORS headers

## API Rate Limits

Supabase free tier limits:
- 50,000 monthly active users
- 500 MB database space
- 1 GB file storage
- 2 GB bandwidth

## Monitoring and Logging

### Current Logging
- Server-side console.log in Edge Function
- Client-side console.error for auth failures

### Recommended Additions
- Structured logging with timestamps
- Error tracking service (Sentry)
- Analytics for user actions
- Performance monitoring (Web Vitals)

## Contributing Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint rules
- Use Prettier for formatting
- Write descriptive component names

### Git Workflow
- Feature branches from main
- Descriptive commit messages
- PR reviews required
- Squash commits before merge

## License

This project is for educational purposes.
