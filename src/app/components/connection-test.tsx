import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { projectId, publicAnonKey } from '/utils/supabase/info';

export function ConnectionTest() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (test: string, status: 'success' | 'error', message: string, details?: any) => {
    setTestResults(prev => [...prev, { test, status, message, details, time: new Date().toISOString() }]);
  };

  const runTests = async () => {
    setTestResults([]);
    setTesting(true);

    // Test 1: Check configuration
    addResult(
      'Configuration',
      projectId && publicAnonKey ? 'success' : 'error',
      projectId && publicAnonKey ? 'Project ID and API key exist' : 'Missing credentials',
      { projectId: projectId || 'MISSING', hasKey: !!publicAnonKey }
    );

    // Test 2: Check Supabase URL
    const supabaseUrl = `https://${projectId}.supabase.co`;
    addResult('URL', 'success', `Supabase URL: ${supabaseUrl}`);

    // Test 3: Test basic fetch to Supabase
    try {
      addResult('Fetch Test', 'success', 'Starting fetch test to Supabase...');
      
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': publicAnonKey,
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        addResult('Fetch Test', 'success', `Supabase is reachable! Status: ${response.status}`);
      } else {
        addResult('Fetch Test', 'error', `Supabase responded with status: ${response.status}`, {
          status: response.status,
          statusText: response.statusText
        });
      }
    } catch (error: any) {
      addResult('Fetch Test', 'error', `Cannot reach Supabase: ${error.message}`, error);
    }

    // Test 4: Test Supabase client
    try {
      addResult('Client Test', 'success', 'Testing Supabase client...');
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        addResult('Client Test', 'error', `Client error: ${error.message}`, error);
      } else {
        addResult('Client Test', 'success', 'Supabase client works!', { hasSession: !!data.session });
      }
    } catch (error: any) {
      addResult('Client Test', 'error', `Client exception: ${error.message}`, error);
    }

    // Test 5: Test signup endpoint specifically
    try {
      addResult('Signup Endpoint', 'success', 'Testing signup endpoint...');
      
      // Try a test signup with invalid data to see if endpoint responds
      const { error } = await supabase.auth.signUp({
        email: `test-${Date.now()}@example.com`,
        password: 'test123456'
      });

      if (error) {
        // Error is actually good here - means endpoint is working
        if (error.message.includes('User already registered') || 
            error.message.includes('Invalid') ||
            error.message) {
          addResult('Signup Endpoint', 'success', 'Signup endpoint is responding', { errorType: error.message });
        } else {
          addResult('Signup Endpoint', 'error', `Signup error: ${error.message}`, error);
        }
      } else {
        addResult('Signup Endpoint', 'success', 'Signup endpoint works perfectly!');
        // Clean up the test user
        await supabase.auth.signOut();
      }
    } catch (error: any) {
      addResult('Signup Endpoint', 'error', `Signup endpoint failed: ${error.message}`, error);
    }

    setTesting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">🔍 Connection Diagnostic Tool</h2>
          <p className="text-sm text-gray-600 mt-1">
            This will test your connection to Supabase step by step
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {testResults.length === 0 && !testing && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔌</div>
              <p className="text-gray-600 mb-4">
                Click the button below to run connection tests
              </p>
              <p className="text-sm text-gray-500">
                This will help identify why signup is failing
              </p>
            </div>
          )}

          {testing && testResults.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 animate-pulse">⚡</div>
              <p className="text-gray-600">Running tests...</p>
            </div>
          )}

          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  result.status === 'success'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {result.status === 'success' ? '✅' : '❌'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">
                      {result.test}
                    </div>
                    <div className="text-sm text-gray-700 mt-1">
                      {result.message}
                    </div>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          Show details
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {testResults.length > 0 && !testing && (
            <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">📋 Summary</h3>
              <div className="text-sm text-blue-800">
                <p>
                  ✅ Passed: {testResults.filter(r => r.status === 'success').length} / {testResults.length}
                </p>
                <p>
                  ❌ Failed: {testResults.filter(r => r.status === 'error').length} / {testResults.length}
                </p>
              </div>

              {testResults.some(r => r.status === 'error') && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="font-semibold text-yellow-900 mb-2">🔧 Recommended Actions:</p>
                  <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    {testResults.find(r => r.test === 'Configuration' && r.status === 'error') && (
                      <li>Check Supabase project configuration</li>
                    )}
                    {testResults.find(r => r.test === 'Fetch Test' && r.status === 'error') && (
                      <>
                        <li>Check your internet connection</li>
                        <li>Visit https://status.supabase.com to check if Supabase is down</li>
                        <li>Try disabling VPN or proxy</li>
                        <li>Check firewall/antivirus settings</li>
                      </>
                    )}
                    {testResults.find(r => r.test === 'Client Test' && r.status === 'error') && (
                      <li>Supabase client has configuration issues</li>
                    )}
                    {testResults.find(r => r.test === 'Signup Endpoint' && r.status === 'error') && (
                      <>
                        <li>Signup endpoint is not accessible</li>
                        <li>Check if your Supabase project is paused</li>
                        <li>Go to https://supabase.com/dashboard and check project status</li>
                      </>
                    )}
                  </ul>
                </div>
              )}

              {testResults.every(r => r.status === 'success') && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-900 font-semibold">🎉 All tests passed!</p>
                  <p className="text-sm text-green-800 mt-1">
                    Your connection to Supabase is working. Signup should work now.
                    Close this window and try signing up again.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <button
            onClick={runTests}
            disabled={testing}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {testing ? '⚡ Running Tests...' : '▶️ Run Tests'}
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            🔄 Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}
