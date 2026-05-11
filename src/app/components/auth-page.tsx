import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Loader2, MessageCircle, Eye, EyeOff, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { ConnectionTest } from '@/app/components/connection-test';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, name: string) => Promise<void>;
  onVerifyOtp: (email: string, token: string) => Promise<void>;
  onResendOtp: (email: string) => Promise<void>;
  onForgotPassword?: (email: string) => Promise<boolean>;
  onSendPhoneOtp?: (phone: string) => Promise<void>;
  onVerifyPhoneOtp?: (phone: string, otp: string) => Promise<void>;
  onGoogleLogin?: () => Promise<void>;
  verificationEmail?: string;
}

export function AuthPage({ onLogin, onSignup, onVerifyOtp, onResendOtp, onForgotPassword, onSendPhoneOtp, onVerifyPhoneOtp, onGoogleLogin, verificationEmail }: AuthPageProps) {
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
  
  // Phone OTP state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState<'phone' | 'otp'>('phone');
  
  // OTP verification state
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showConnectionTest, setShowConnectionTest] = useState(false);
  
  // Password visibility
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpLoading(true);

    try {
      await onVerifyOtp(verificationEmail!, otpCode);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setOtpError('');
    try {
      await onResendOtp(verificationEmail!);
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Failed to resend OTP. Please try again.');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-[#f0f7ff] via-white to-[#f5f3ff] overflow-y-auto p-4 font-sans">
      {/* Premium Ethereal Background */}
      <div className="absolute inset-0 z-0">
        {/* Subdued Geometric Pattern */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#3b82f6 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }} />
        
        {/* Soft Ambient Glows */}
        <motion.div 
          animate={{ 
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-blue-100/40 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ 
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1.1, 1, 1.1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-indigo-100/40 rounded-full blur-[120px]"
        />
      </div>
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
          <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10 py-6"
      >
        {/* App Header - Reduced Spacing */}
        <div className="text-center mb-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-[2rem] mb-3 shadow-[0_0_40px_rgba(59,130,246,0.25)] overflow-hidden border border-gray-800 p-0"
          >
            <img 
              src="/logo.png" 
              alt="Harf" 
              className="w-full h-full object-cover"
            />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-black text-slate-900 mb-1 tracking-tighter"
          >
            Harf
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-500 text-sm font-medium flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Connect. Professional. Seamless.
          </motion.p>
        </div>
        {/* Authentication Card */}
        <Card className="bg-white border-slate-200/60 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] rounded-[2rem]">
          <CardHeader className="pb-2 pt-6">
            <CardTitle className="text-2xl text-center text-slate-900 font-extrabold tracking-tight">Sign In</CardTitle>
            <CardDescription className="text-center text-slate-400 text-sm font-medium">
              Access your professional dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8">


            {/* Error or Success Alert */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  <div className="flex flex-col gap-3">
                    <span className="font-semibold">{error}</span>
                    {error.includes('Failed to fetch') && (
                      <div className="mt-2 p-3 bg-red-900/20 rounded border border-red-300">
                        <p className="font-bold text-sm mb-2">⚡ Quick Fix:</p>
                        <ol className="text-sm space-y-1 list-decimal list-inside">
                          <li>Check if your Supabase project is paused</li>
                          <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline font-semibold">supabase.com/dashboard</a></li>
                          <li>If project shows "PAUSED", click "Restore"</li>
                          <li>Wait 2-3 minutes, then try again</li>
                        </ol>
                        <button
                          onClick={() => setShowConnectionTest(true)}
                          className="mt-3 text-sm bg-white text-red-700 px-4 py-2 rounded font-semibold hover:bg-red-50 transition w-full"
                        >
                          🔍 Run Connection Diagnostic
                        </button>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            {successMessage && (
              <Alert className="mb-4 border-green-500 text-green-700 bg-green-50">
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            {/* OTP Verification View */}
            {verificationEmail && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">Verify Your Email</h3>
                  <p className="text-sm text-gray-600">
                    Enter the 6-digit code sent to<br />
                    <span className="font-medium text-blue-600">{verificationEmail}</span>
                  </p>
                </div>

                {otpError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{otpError}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp-code">Verification Code</Label>
                    <Input
                      id="otp-code"
                      type="text"
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      required
                      disabled={otpLoading}
                      className="text-center text-2xl tracking-widest"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={otpLoading || otpCode.length !== 6}
                  >
                    {otpLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify OTP'
                    )}
                  </Button>
                </form>

                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0}
                    className="text-sm"
                  >
                    {resendCooldown > 0 
                      ? `Resend code in ${resendCooldown}s` 
                      : 'Resend verification code'}
                  </Button>
                </div>
              </div>
            )}

            {!verificationEmail && (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-50 p-1 rounded-xl mb-8 border border-slate-100">
                  <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-400 transition-all rounded-lg font-bold py-2.5">Email</TabsTrigger>
                  <TabsTrigger value="phone" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-400 transition-all rounded-lg font-bold py-2.5">Phone</TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-400 transition-all rounded-lg font-bold py-2.5">Sign Up</TabsTrigger>
                </TabsList>

                {/* Phone Login Tab */}
                <TabsContent value="phone">
                  {phoneStep === 'phone' ? (
                    <form onSubmit={async (e) => { e.preventDefault(); setPhoneStep('otp'); onSendPhoneOtp?.(phoneNumber); }} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-slate-700 ml-1 font-semibold">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+923456789012"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required
                          disabled={isLoading}
                          className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 h-12 rounded-2xl focus:ring-4 focus:ring-blue-100 transition-all text-lg shadow-sm"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-blue-200 text-lg" 
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Send OTP'}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={async (e) => { e.preventDefault(); onVerifyPhoneOtp?.(phoneNumber, phoneOtp); }} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone-otp" className="text-slate-700 ml-1 font-semibold">Enter OTP</Label>
                        <Input
                          id="phone-otp"
                          type="text"
                          placeholder="123456"
                          value={phoneOtp}
                          onChange={(e) => setPhoneOtp(e.target.value)}
                          required
                          disabled={isLoading}
                          className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 h-12 rounded-2xl focus:ring-4 focus:ring-blue-100 transition-all text-lg shadow-sm text-center tracking-[0.5em]"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setPhoneStep('phone')} 
                          disabled={isLoading}
                          className="h-12 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all px-8"
                        >
                          Back
                        </Button>
                        <Button 
                          type="submit" 
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-blue-200 text-lg" 
                          disabled={isLoading}
                        >
                          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verify'}
                        </Button>
                      </div>
                    </form>
                  )}
                </TabsContent>

                {/* Login Tab */}
                <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-slate-700 ml-1 font-semibold">Email Address</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 h-12 rounded-2xl focus:ring-4 focus:ring-blue-100 transition-all text-lg shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-slate-700 ml-1 font-semibold">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 h-12 rounded-2xl pr-14 focus:ring-4 focus:ring-blue-100 transition-all text-lg shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        {showLoginPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
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
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-14 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-blue-200 text-lg" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Log In'
                    )}
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">or</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-3 h-12 rounded-2xl bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-sm font-bold"
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
                    <svg viewBox="0 0 24 24" width="22" height="22">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {isLoading ? 'Connecting...' : 'Continue with Google'}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-slate-700 ml-1 font-semibold">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Shahid"
                      value={signupName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSignupName(e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 h-12 rounded-2xl focus:ring-4 focus:ring-blue-100 transition-all text-lg shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-slate-700 ml-1 font-semibold">Email Address</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signupEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSignupEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 h-12 rounded-2xl focus:ring-4 focus:ring-blue-100 transition-all text-lg shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-slate-700 ml-1 font-semibold">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSignupPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 h-12 rounded-2xl pr-14 focus:ring-4 focus:ring-blue-100 transition-all text-lg shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        {showSignupPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                      </button>
                    </div>
                    <p className="text-sm text-slate-400 ml-1 font-medium">At least 6 characters</p>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-blue-200 text-lg"
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
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">or</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-3 h-12 rounded-2xl bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-sm font-bold"
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
                    <svg viewBox="0 0 24 24" width="22" height="22">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {isLoading ? 'Connecting...' : 'Sign Up with Google'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-sm text-slate-400 mt-12 font-medium tracking-wide flex items-center justify-center gap-2"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          System Operational & Secure
        </motion.p>
      </motion.div>
    </div>
  );
}