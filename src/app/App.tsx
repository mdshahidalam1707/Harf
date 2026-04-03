import { useState, useEffect } from 'react';
import { supabase, User } from '@/lib/supabase';
import { AuthPage } from '@/app/components/auth-page';
import { ChatApp } from '@/app/components/chat-app';
import { DatabaseSetupChecker } from '@/app/components/database-setup-checker';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  // Check if user is already logged in when app loads
  useEffect(() => {
    checkDatabaseAndUser();
  }, []);

  // Function to check database setup and user session
  const checkDatabaseAndUser = async () => {
    try {
      // First check if database tables exist
      // This may error if tables don't exist - this is expected and handled
      const { error: dbError } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (dbError) {
        // Expected error when database is not set up yet
        // No need to log - just show setup screen
        setSetupComplete(false);
        setCheckingSetup(false);
        setLoading(false);
        return;
      }

      // Database exists, mark setup as complete
      setSetupComplete(true);
      setCheckingSetup(false);

      // Now check for user session
      await checkUser();
    } catch (error) {
      // Expected error when database is not set up
      setSetupComplete(false);
      setCheckingSetup(false);
      setLoading(false);
    }
  };

  // Function to check current user session
  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Get user profile from users table
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle(); // Use maybeSingle() instead of single() to handle missing profiles

        if (error) {
          console.error('Error fetching user profile:', error);
          setLoading(false);
          return;
        }

        if (!userData) {
          // User profile doesn't exist - create it
          console.log('User profile not found, creating...');
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              about: 'Hey there! I am using ChatConnect',
              online: false,
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating user profile:', createError);
            // If creation fails, sign out the user
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

  // Handle login
  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.user) {
      // Get user profile
      const { data: userData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching user profile after login:', profileError);
        throw new Error('Failed to load user profile');
      }

      if (!userData) {
        // Create profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.name || email.split('@')[0],
            about: 'Hey there! I am using ChatConnect',
            online: false,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating user profile:', createError);
          throw new Error('Failed to create user profile');
        }

        if (newProfile) {
          setUser(newProfile);
        }
      } else {
        setUser(userData);
      }
    }
  };

  // Handle signup
  const handleSignup = async (email: string, password: string, name: string) => {
    try {
      console.log('Starting signup process for:', email);
      
      // Validate inputs
      if (!email || !password || !name) {
        throw new Error('Please fill in all fields');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      console.log('Calling Supabase signUp...');
      
      // Create user directly with Supabase Auth
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      console.log('SignUp response:', { authData, signupError });

      if (signupError) {
        console.error('Supabase signup error:', signupError);
        
        // Handle specific error cases
        if (signupError.message.includes('User already registered')) {
          throw new Error('This email is already registered. Please login instead.');
        }
        
        if (signupError.message.includes('Invalid email')) {
          throw new Error('Please enter a valid email address');
        }
        
        throw new Error(signupError.message);
      }

      if (!authData.user) {
        throw new Error('Failed to create user - no user data returned');
      }

      console.log('User created in auth, creating profile...');

      // Create user profile in the users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          name: name,
          about: 'Hey there! I am using ChatConnect',
          online: false,
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        // Profile creation failed, but auth user was created
        // The auto-fix on login will handle this
      } else {
        console.log('Profile created successfully');
      }

      console.log('Signing out user...');
      
      // Sign out the user so they can login manually
      // This ensures the session is clean
      await supabase.auth.signOut();

      console.log('Signup complete!');

    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Provide user-friendly error messages
      if (error.message) {
        throw new Error(error.message);
      }
      
      throw new Error('Signup failed. Please try again or check your internet connection.');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Show loading state while checking setup
  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Checking database setup...</p>
        </div>
      </div>
    );
  }

  // Show setup checker if database not ready
  if (!setupComplete) {
    return <DatabaseSetupChecker onSetupComplete={() => {
      setSetupComplete(true);
      checkUser();
    }} />;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show appropriate page based on authentication status
  return (
    <>
      {user ? (
        <ChatApp user={user} onLogout={handleLogout} />
      ) : (
        <AuthPage onLogin={handleLogin} onSignup={handleSignup} />
      )}
    </>
  );
}