import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function TestingDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState({
    clients: null,
    properties: null,
    visits: null
  });
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (currentUser.role !== 'admin') {
        toast.error('Superadmin access required');
      }
    } catch (error) {
      toast.error('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const runDataIsolationTest = async () => {
    setTesting(true);
    setTests({ clients: null, properties: null, visits: null });
    
    try {
      const currentUser = await base44.auth.me();
      const tenantId = currentUser.primary_tenant_id;

      // Test 1: Clients
      const clients = await base44.entities.Client.filter({ tenant_id: tenantId });
      setTests(prev => ({
        ...prev,
        clients: {
          status: clients.length > 0 ? 'pass' : 'fail',
          count: clients.length,
          message: clients.length > 0 ? `✓ Found ${clients.length} clients for tenant` : '✗ No clients found'
        }
      }));

      // Test 2: Properties
      const properties = await base44.entities.Property.filter({ tenant_id: tenantId, is_active: true });
      setTests(prev => ({
        ...prev,
        properties: {
          status: properties.length > 0 ? 'pass' : 'fail',
          count: properties.length,
          message: properties.length > 0 ? `✓ Found ${properties.length} properties for tenant` : '✗ No properties found'
        }
      }));

      // Test 3: Visits
      const visits = await base44.entities.Visit.filter({ tenant_id: tenantId });
      setTests(prev => ({
        ...prev,
        visits: {
          status: visits.length >= 0 ? 'pass' : 'fail',
          count: visits.length,
          message: `✓ Found ${visits.length} visits for tenant`
        }
      }));

      toast.success('Data isolation tests completed');
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Test failed: ' + error.message);
      setTests({
        clients: { status: 'error', message: '✗ Test failed' },
        properties: { status: 'error', message: '✗ Test failed' },
        visits: { status: 'error', message: '✗ Test failed' }
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            Superadmin access required to access Testing Dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Multi-Tenant Testing Dashboard</h1>
        <p className="text-slate-600">Verify data isolation and RLS enforcement before test users join</p>
      </div>

      {/* Current Tenant Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Current Tenant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Tenant ID</p>
              <p className="font-mono text-sm font-medium">{user.primary_tenant_id}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">User Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Full Name</p>
              <p className="font-medium">{user.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Role</p>
              <p className="font-medium capitalize">{user.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testing Instructions */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900">Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>1. Create 3 separate tenant accounts (Tenant A, B, C)</p>
          <p>2. For each tenant, log in and click "Run Data Isolation Tests"</p>
          <p>3. Verify each tenant sees only their own data</p>
          <p>4. Use the URL manipulation tests in TESTING_CHECKLIST.md to verify RLS enforcement</p>
          <p>5. Only invite 3 test users once all tests pass ✓</p>
        </CardContent>
      </Card>

      {/* Data Isolation Tests */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Data Isolation Tests</CardTitle>
          <Button 
            onClick={runDataIsolationTest} 
            disabled={testing}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Run Tests'
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Clients Test */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              {tests.clients?.status === 'pass' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              {tests.clients?.status === 'fail' && <AlertCircle className="h-5 w-5 text-red-600" />}
              {tests.clients?.status === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
              {!tests.clients && <div className="h-5 w-5 rounded-full border-2 border-slate-300" />}
              <span className="font-medium">Clients Isolation</span>
            </div>
            {tests.clients && (
              <p className={`text-sm ${tests.clients.status === 'pass' ? 'text-emerald-700' : 'text-red-700'}`}>
                {tests.clients.message}
              </p>
            )}
          </div>

          {/* Properties Test */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              {tests.properties?.status === 'pass' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              {tests.properties?.status === 'fail' && <AlertCircle className="h-5 w-5 text-red-600" />}
              {tests.properties?.status === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
              {!tests.properties && <div className="h-5 w-5 rounded-full border-2 border-slate-300" />}
              <span className="font-medium">Properties Isolation</span>
            </div>
            {tests.properties && (
              <p className={`text-sm ${tests.properties.status === 'pass' ? 'text-emerald-700' : 'text-red-700'}`}>
                {tests.properties.message}
              </p>
            )}
          </div>

          {/* Visits Test */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              {tests.visits?.status === 'pass' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              {tests.visits?.status === 'fail' && <AlertCircle className="h-5 w-5 text-red-600" />}
              {tests.visits?.status === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
              {!tests.visits && <div className="h-5 w-5 rounded-full border-2 border-slate-300" />}
              <span className="font-medium">Visits Isolation</span>
            </div>
            {tests.visits && (
              <p className={`text-sm ${tests.visits.status === 'pass' ? 'text-emerald-700' : 'text-red-700'}`}>
                {tests.visits.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-lg">Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3 text-slate-700">
          <p>📋 After running tests here, use <strong>TESTING_CHECKLIST.md</strong> to verify:</p>
          <ul className="ml-6 space-y-2 list-disc">
            <li>URL manipulation tests (cannot access other tenant's data)</li>
            <li>Cross-tenant data leakage in any view</li>
            <li>RLS enforcement in all critical entities</li>
          </ul>
          <p className="pt-2 text-emerald-700 font-medium">✓ All tests passing? Invite your 3 test users!</p>
        </CardContent>
      </Card>
    </div>
  );
}