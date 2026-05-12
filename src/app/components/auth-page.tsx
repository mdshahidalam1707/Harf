import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Loader2, Eye, EyeOff, Sparkles, Database } from 'lucide-react';
import { ConnectionTest } from '@/app/components/connection-test';

interface AuthPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, name: string) => Promise<void>;
  onForgotPassword?: (email: string) => Promise<boolean>;
  onSendPhoneOtp?: (phone: string) => Promise<void>;
  onVerifyPhoneOtp?: (phone: string, otp: string) => Promise<void>;
  onGoogleLogin?: () => Promise<void>;
}

export function AuthPage({ onLogin, onSignup, onForgotPassword, onGoogleLogin }: AuthPageProps) {
  // State for login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  // State for signup form
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');



  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showConnectionTest, setShowConnectionTest] = useState(false);

  // Password visibility
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Detect if accessing via localhost on a mobile device (common issue)
  const isLocalhostOnMobile = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await onLogin(loginEmail, loginPassword);
      setSuccessMessage('Login successful!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await onForgotPassword?.(forgotPasswordEmail);
      setForgotPasswordSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    // Basic validation
    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (!signupName.trim()) {
      setError('Please enter your name');
      setIsLoading(false);
      return;
    }

    try {
      await onSignup(signupEmail, signupPassword, signupName);
      setSuccessMessage('Account created successfully! You can now log in.');
      // Clear signup form
      setSignupEmail('');
      setSignupPassword('');
      setSignupName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#F8FAFC] overflow-y-auto p-4 font-sans">
      {/* Subtle Pattern Background */}
      <div className="absolute inset-0 z-0 opacity-[0.4]" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Connection Test Modal */}
      {showConnectionTest && <ConnectionTest />}

      {/* Forgot Password Modal */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          {forgotPasswordSent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✓</span>
              </div>
              <p className="font-semibold text-green-700 mb-2">Check your email!</p>
              <p className="text-sm text-gray-600">
                We've sent a password reset link to <span className="font-medium">{forgotPasswordEmail}</span>
              </p>
              <Button
                onClick={() => { setShowForgotPassword(false); setForgotPasswordSent(false); setForgotPasswordEmail(''); }}
                className="mt-4 w-full"
              >
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email Address</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="your@email.com"
                  value={forgotPasswordEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForgotPasswordEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || !forgotPasswordEmail}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Send Reset Link
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <div className="w-full max-w-md relative z-10 py-6">
        {/* Authentication Card */}
        <Card className="bg-white border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden">
          <CardHeader className="pb-2 pt-8 px-8 flex flex-col items-center">
            {/* Unified Logo within Card */}
            <div className="w-14 h-14 bg-slate-950 rounded-2xl mb-3 shadow-xl flex items-center justify-center overflow-hidden border-2 border-slate-50">
              <img
                src="/logo.png"
                alt="Harf"
                className="w-full h-full object-cover"
              />
            </div>
            <CardTitle className="text-xl text-slate-900 font-black tracking-tight mb-1">Harf</CardTitle>
            <CardDescription className="text-center text-slate-500 text-[10px] font-medium flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full border border-slate-100">
              <Sparkles className="w-2.5 h-2.5 text-blue-500 fill-blue-500" />
              Connect. Professional. Seamless.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2.5 h-11 rounded-xl bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm font-bold text-sm mb-4"
              onClick={async () => {
                setError('');
                setIsLoading(true);
                try {
                  if (onGoogleLogin) await onGoogleLogin();
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Google login failed');
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {isLoading ? 'Connecting...' : 'Continue with Google'}
            </Button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-[9px] uppercase">
                <span className="bg-white px-3 text-slate-400 font-bold tracking-widest">OR USE EMAIL</span>
              </div>
            </div>

            {/* Error or Success Alert */}
            {error && (
              <Alert variant="destructive" className="mb-3 py-2 px-3 border-red-100 bg-red-50 text-red-900">
                <AlertDescription className="text-xs">
                  {error}
                  {error.includes('Failed to fetch') && (
                    <div className="mt-1 text-[10px]">
                      Check Supabase status or restore project.
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
            {successMessage && (
              <Alert className="mb-3 py-2 px-3 border-green-200 text-green-700 bg-green-50">
                <AlertDescription className="text-xs">{successMessage}</AlertDescription>
              </Alert>
            )}



            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-50 p-1 rounded-lg mb-4 border border-slate-100">
                <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-400 rounded-md font-bold py-1.5 text-xs">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-400 rounded-md font-bold py-1.5 text-xs">Sign Up</TabsTrigger>
              </TabsList>



              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-slate-700 ml-1 font-semibold text-xs">Email Address</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 h-10 rounded-xl focus:ring-2 focus:ring-blue-100 text-sm shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-password" className="text-slate-700 ml-1 font-semibold text-xs">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 h-10 rounded-xl pr-12 focus:ring-2 focus:ring-blue-100 text-sm shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="button" className="text-sm text-blue-600 hover:underline" onClick={() => setShowForgotPassword(true)}>
                      Forgot Password?
                    </button>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-blue-200 text-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Log In'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name" className="text-slate-700 ml-1 font-semibold text-xs">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Shahid"
                      value={signupName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSignupName(e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 h-10 rounded-xl focus:ring-2 focus:ring-blue-100 text-sm shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-slate-700 ml-1 font-semibold text-xs">Email Address</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signupEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSignupEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 h-10 rounded-xl focus:ring-2 focus:ring-blue-100 text-sm shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="signup-password" className="text-slate-700 ml-1 font-semibold text-xs">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSignupPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 h-10 rounded-xl pr-12 focus:ring-2 focus:ring-blue-100 text-sm shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-blue-200 text-sm mt-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 mt-4 font-medium tracking-wide flex items-center justify-center gap-2">
          <div className="w-1 h-1 rounded-full bg-green-500" />
          System Operational & Secure
        </p>
      </div>
    </div>
  );
}