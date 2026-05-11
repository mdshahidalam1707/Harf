import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { UserSearch } from './user-search';
import { MessageCircle, LogOut, User } from 'lucide-react';

interface HomePageProps {
  user: {
    email: string;
    name?: string;
  };
  onLogout: () => void;
}

export function HomePage({ user, onLogout }: HomePageProps) {
  // Get user initials for avatar
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email ? email[0].toUpperCase() : 'U';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">ChatConnect</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    {getInitials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <UserSearch onChatCreated={() => { }} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLogout}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name || 'User'}! 👋
          </h2>
          <p className="text-gray-600">
            Your account is all set up and ready to go.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Real-time Chat</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Send instant messages to your friends and family in real-time.
              </p>
              <Button className="w-full mt-4">
                Available
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>User Profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Customize your profile with photos, bio, and status updates.
              </p>
              <Button className="w-full mt-4" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Group Chat</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Create groups and chat with multiple people at the same time.
              </p>
              <Button className="w-full mt-4" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Account Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Your Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{user.name || 'Not set'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Account Status:</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
