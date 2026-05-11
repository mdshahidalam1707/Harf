import { Suspense, lazy } from 'react';
import { useAuth } from '@/app/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';

// Lazy load components for production performance
const AuthPage = lazy(() => import('@/app/components/auth-page').then(m => ({ default: m.AuthPage })));
const ChatApp = lazy(() => import('@/app/components/chat-app').then(m => ({ default: m.ChatApp })));
const DatabaseSetupChecker = lazy(() => import('@/app/components/database-setup-checker').then(m => ({ default: m.DatabaseSetupChecker })));

const LoadingFallback = ({ message = "Loading..." }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      <p className="mt-4 text-gray-600 font-medium">{message}</p>
    </div>
  </div>
);

export default function App() {
  const {
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
  } = useAuth();

  // Loading state - only show one loading at a time
  if (checkingSetup) {
    return <LoadingFallback message="Checking database setup..." />;
  }

  // Database not set up
  if (!setupComplete) {
    return (
      <Suspense fallback={<LoadingFallback message="Loading setup checker..." />}>
        <DatabaseSetupChecker onSetupComplete={() => {
          setSetupComplete(true);
          checkUser();
        }} />
      </Suspense>
    );
  }

  // Password reset from email link
  if (isResettingPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
          </CardHeader>
          <CardContent>
            {resetSuccess ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✓</span>
                </div>
                <p className="font-semibold text-green-700">Password reset successful!</p>
                <p className="text-sm text-gray-600 mt-2">Redirecting to login...</p>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {resetError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {resetError}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Reset Password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading user data
  if (loading) {
    return <LoadingFallback message="Loading your profile..." />;
  }

  // Render only ONE layout at a time - no mixing
  if (user) {
    return (
      <Suspense fallback={<LoadingFallback message="Launching Harf Workspace..." />}>
        <div className="h-screen w-screen overflow-hidden">
          <ChatApp user={user} onLogout={handleLogout} onUserUpdate={setUser} />
        </div>
      </Suspense>
    );
  }

  // Show auth page when no user
  return (
    <Suspense fallback={<LoadingFallback message="Entering Secure Auth Zone..." />}>
      <div className="min-h-screen w-screen overflow-auto">
        <AuthPage 
          onLogin={handleLogin} 
          onSignup={handleSignup}
          onVerifyOtp={handleVerifyOtp}
          onResendOtp={handleResendOtp}
          onForgotPassword={handleForgotPassword}
          onGoogleLogin={handleGoogleLogin}
          verificationEmail={verificationEmail}
        />
      </div>
    </Suspense>
  );
}