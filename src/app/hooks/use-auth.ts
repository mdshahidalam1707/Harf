import { useState, useEffect } from 'react';
import { supabase, User } from '@/lib/supabase';
import { getAuthRedirectUrl } from '@/utils/url';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false); // Default to false
  const [setupComplete, setSetupComplete] = useState(true);
  const [checkingSetup, setCheckingSetup] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    console.log('🌐 App Origin:', window.location.origin);
    checkDatabaseAndUser();

    // Set up auth state listener for OAuth redirects and session changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth Event:', event);
      if (session?.user) {
        await checkUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Handle password reset links or OAuth tokens in query params
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    
    const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
    const type = hashParams.get('type') || queryParams.get('type');
    
    if (type === 'recovery' && accessToken) {
      setIsResettingPassword(true);
    }
  }, []);

  const checkDatabaseAndUser = async () => {
    console.log('🔍 Starting passive database and session check...');
    
    try {
      // 1. Just check the session. Don't block if it's slow.
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('✅ Session detected, loading profile...');
        setSetupComplete(true);
        await checkUser();
      } else {
        console.log('ℹ️ No session found on initial check');
        // We still assume setup is complete unless we hit an error later
        setSetupComplete(true);
      }
    } catch (error) {
      console.warn('⚠️ Initial check failed, but continuing...', error);
      setSetupComplete(true);
    } finally {
      // ALWAYS stop checking setup within 2 seconds regardless of outcome
      setTimeout(() => setCheckingSetup(false), 500);
    }
  };

  const checkUser = async () => {
    console.log('👤 Fetching user profile...');
    const timeoutId = setTimeout(async () => {
      console.warn('🕒 Profile fetch taking too long, using fallback');
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && !user) {
        setUser({
          id: session.user.id,
          name: session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          profession: 'Loading...',
          skills: []
        } as any);
      }
      setLoading(false);
    }, 3000);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user profile:', error);
          // Fallback to minimal user object
          setUser({
            id: session.user.id,
            name: session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
          } as any);
        } else if (userData) {
          setUser(userData);
        } else {
          // If no profile exists (common for new OAuth/Google users), create it
          console.log('No profile record found, creating one for authenticated user...');
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert({
              id: session.user.id,
              name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email,
              bio: '',
              profession: 'Member',
              skills: [],
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile for new user:', createError);
          } else if (newProfile) {
            setUser(newProfile);
          }
        }
      }
    } catch (error) {
      console.error('Error checking user session:', error);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    if (data.user) {
      const { data: userData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) throw new Error('Failed to load user profile');

      if (!userData) {
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            name: data.user.email?.split('@')[0] || 'User',
            email: data.user.email,
            bio: '',
            profession: '',
            skills: [],
          })
          .select()
          .single();

        if (createError) throw new Error('Failed to create user profile');
        if (newProfile) setUser(newProfile);
      } else {
        setUser(userData);
      }
    }
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    try {
      if (!email || !password || !name) throw new Error('Please fill in all fields');
      if (password.length < 6) throw new Error('Password must be at least 6 characters');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, full_name: name },
          emailRedirectTo: getAuthRedirectUrl()
        }
      });

      if (error) throw new Error(error.message);

      if (data.user) {
        // Create user profile immediately in public.users table
        const { error: profileError } = await supabase.from('users').insert({
          id: data.user.id,
          name: name,
          email: email,
          bio: '',
          profession: '',
          skills: [],
        });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // If profile creation fails but auth succeeded, we still have the auth user.
          // The checkUser function in App.tsx will try to create it again on next load.
        }

        // If a session exists (auto-confirm is on), set the user
        if (data.session) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();
          if (userData) setUser(userData);
        }
      }
      
      // Removed return data; to fix type mismatch with AuthPage
    } catch (error: any) {
      throw new Error(error.message || 'Signup failed');
    }
  };

  const handleForgotPassword = async (email: string) => {
    if (!email) throw new Error('Please enter your email');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthRedirectUrl()
    });
    if (error) throw new Error(error.message);
    return true;
  };

  const handleGoogleLogin = async () => {
    const redirectTo = getAuthRedirectUrl();
    console.log('🚀 Starting Google Login with redirect:', redirectTo);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo,
        skipBrowserRedirect: false
      }
    });
    if (error) throw new Error(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    
    try {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (!accessToken) throw new Error('Invalid reset link');
      
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || ''
      });
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) throw updateError;
      
      setResetSuccess(true);
      setTimeout(() => {
        window.location.hash = '';
        setIsResettingPassword(false);
        setNewPassword('');
      }, 3000);
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password');
    }
  };

  return {
    user,
    loading,
    checkingSetup,
    setupComplete,
    isResettingPassword,
    newPassword,
    setNewPassword,
    resetError,
    resetSuccess,
    handleLogin,
    handleSignup,
    handleForgotPassword,
    handleGoogleLogin,
    handleLogout,
    handleResetPassword,
    setSetupComplete,
    checkUser,
    setIsResettingPassword,
    setUser
  };
}
