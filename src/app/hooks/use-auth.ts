import { useState, useEffect } from 'react';
import { supabase, User } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [verificationEmail, setVerificationEmail] = useState<string | undefined>(undefined);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    checkDatabaseAndUser();
  }, []);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    if (type === 'recovery' && accessToken) {
      setIsResettingPassword(true);
    }
  }, []);

  const checkDatabaseAndUser = async () => {
    try {
      const { error: dbError } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (dbError) {
        setSetupComplete(false);
        setCheckingSetup(false);
        setLoading(false);
        return;
      }

      setSetupComplete(true);
      setCheckingSetup(false);
      await checkUser();
    } catch (error) {
      setSetupComplete(false);
      setCheckingSetup(false);
      setLoading(false);
    }
  };

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user profile:', error);
          setLoading(false);
          return;
        }

        if (!userData) {
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert({
              id: session.user.id,
              name: session.user.email?.split('@')[0] || 'User',
              email: session.user.email,
              bio: '',
              profession: '',
              skills: [],
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating user profile:', createError);
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }

          if (newProfile) {
            setUser(newProfile);
          }
        } else {
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Error checking user session:', error);
    } finally {
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

      localStorage.setItem('pendingSignup', JSON.stringify({ email, password, name }));
      
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin }
      });

      if (otpError) throw new Error(otpError.message);
      setVerificationEmail(email);

    } catch (error: any) {
      throw new Error(error.message || 'Signup failed');
    }
  };

  const handleVerifyOtp = async (email: string, token: string) => {
    try {
      const pendingSignup = localStorage.getItem('pendingSignup');
      if (!pendingSignup) throw new Error('No pending signup found');

      const { email: signupEmail, password, name } = JSON.parse(pendingSignup);

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email, token, type: 'email'
      });

      if (verifyError) throw new Error(verifyError.message);
      if (!data.user) throw new Error('Verification failed');

      await supabase.from('users').insert({
        id: data.user.id,
        name: name || signupEmail.split('@')[0],
        email: signupEmail,
        bio: '',
        profession: '',
        skills: [],
      });

      localStorage.removeItem('pendingSignup');
      setVerificationEmail(undefined);
      await handleLogin(signupEmail, password);

    } catch (error: any) {
      throw new Error(error.message || 'Verification failed');
    }
  };

  const handleResendOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    if (error) throw new Error(error.message);
  };

  const handleForgotPassword = async (email: string) => {
    if (!email) throw new Error('Please enter your email');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    if (error) throw new Error(error.message);
    return true;
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
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
    verificationEmail,
    isResettingPassword,
    newPassword,
    setNewPassword,
    resetError,
    resetSuccess,
    handleLogin,
    handleSignup,
    handleVerifyOtp,
    handleResendOtp,
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
