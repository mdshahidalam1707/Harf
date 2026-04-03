import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Database, CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';

interface SetupStatus {
  users: boolean;
  chats: boolean;
  chat_participants: boolean;
  messages: boolean;
  groups: boolean;
}

export function DatabaseSetupChecker({ onSetupComplete }: { onSetupComplete: () => void }) {
  const [checking, setChecking] = useState(true);
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    users: false,
    chats: false,
    chat_participants: false,
    messages: false,
    groups: false,
  });
  const [allTablesExist, setAllTablesExist] = useState(false);

  useEffect(() => {
    checkDatabaseSetup();
  }, []);

  const checkDatabaseSetup = async () => {
    setChecking(true);
    const status: SetupStatus = {
      users: false,
      chats: false,
      chat_participants: false,
      messages: false,
      groups: false,
    };

    try {
      // Check each table
      const tables = ['users', 'chats', 'chat_participants', 'messages', 'groups'];
      
      for (const table of tables) {
        try {
          const { error } = await supabase
            .from(table)
            .select('id')
            .limit(1);
          
          status[table as keyof SetupStatus] = !error;
        } catch (err) {
          status[table as keyof SetupStatus] = false;
        }
      }

      setSetupStatus(status);
      
      const allExist = Object.values(status).every(exists => exists);
      setAllTablesExist(allExist);
      
      if (allExist) {
        onSetupComplete();
      }
    } catch (error) {
      // Expected error when tables don't exist, no need to log
      console.log('Database setup check complete');
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Checking database setup...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (allTablesExist) {
    return null; // Setup complete, app will render
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-8 h-8 text-blue-600" />
            <CardTitle className="text-2xl">Database Setup Required</CardTitle>
          </div>
          <CardDescription>
            Your database needs to be configured before you can use ChatConnect
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Alert */}
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Some required database tables are missing. Please follow the setup instructions below.
            </AlertDescription>
          </Alert>

          {/* Table Status */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 mb-3">Required Tables:</h3>
            {Object.entries(setupStatus).map(([table, exists]) => (
              <div key={table} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">{table}</span>
                {exists ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm">Ready</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    <span className="text-sm">Missing</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Setup Instructions */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Setup Instructions:</h3>
            <ol className="space-y-4 text-sm text-gray-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-semibold text-xs">
                  1
                </span>
                <div className="flex-1">
                  <p className="font-medium mb-1">Open Supabase Dashboard</p>
                  <a
                    href="https://app.supabase.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Go to Supabase Dashboard
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </li>
              
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-semibold text-xs">
                  2
                </span>
                <div className="flex-1">
                  <p className="font-medium mb-1">Navigate to SQL Editor</p>
                  <p className="text-gray-600">
                    Select your project → Click "SQL Editor" in the left sidebar
                  </p>
                </div>
              </li>
              
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-semibold text-xs">
                  3
                </span>
                <div className="flex-1">
                  <p className="font-medium mb-1">Create New Query</p>
                  <p className="text-gray-600 mb-2">Click "New Query" button</p>
                </div>
              </li>
              
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-semibold text-xs">
                  4
                </span>
                <div className="flex-1">
                  <p className="font-medium mb-1">Copy and Run SQL Schema</p>
                  <p className="text-gray-600 mb-2">
                    Open the <code className="bg-gray-200 px-2 py-1 rounded">DATABASE_SCHEMA.sql</code> file
                    in your project files, copy all the SQL code, paste it into the SQL Editor, and click "Run"
                  </p>
                </div>
              </li>
              
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-semibold text-xs">
                  5
                </span>
                <div className="flex-1">
                  <p className="font-medium mb-1">Wait for completion</p>
                  <p className="text-gray-600">
                    The SQL will create all necessary tables, policies, and triggers. 
                    Wait for the success message.
                  </p>
                </div>
              </li>
              
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-semibold text-xs">
                  6
                </span>
                <div className="flex-1">
                  <p className="font-medium mb-1">Return here and check again</p>
                  <p className="text-gray-600 mb-3">
                    Click the button below to verify the setup
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={checkDatabaseSetup}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Database className="w-4 h-4 mr-2" />
              Check Setup Again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://app.supabase.com', '_blank')}
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Supabase
            </Button>
          </div>

          {/* Help Link */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">
              Need help? Check the{' '}
              <a
                href="/SETUP_GUIDE.md"
                target="_blank"
                className="text-blue-600 hover:underline font-medium"
              >
                Setup Guide
              </a>
              {' '}for detailed instructions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}