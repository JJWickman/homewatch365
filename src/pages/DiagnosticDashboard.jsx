import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function DiagnosticDashboard() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentDomain, setCurrentDomain] = useState('');
  const [currentAppId, setCurrentAppId] = useState('');

  useEffect(() => {
    setCurrentDomain(window.location.origin);
    setCurrentAppId(base44?.appId || 'unknown');
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('diagnoseAppContext', {});
      setDiagnostics(response.data);
      console.log('Diagnostics:', response.data);
    } catch (error) {
      console.error('Diagnostic error:', error);
      setDiagnostics({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">App Context Diagnostic</h1>

      {/* Current State */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Frontend Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-slate-500">Current Domain</p>
            <p className="font-mono text-sm font-medium break-all">{currentDomain}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Base44 App ID in Frontend</p>
            <p className="font-mono text-sm font-medium">{currentAppId}</p>
          </div>
        </CardContent>
      </Card>

      {/* Diagnostic Button */}
      <div className="mb-6">
        <Button onClick={runDiagnostics} disabled={loading} className="bg-slate-900 hover:bg-slate-800">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Diagnostics...
            </>
          ) : (
            'Run Backend Diagnostics'
          )}
        </Button>
      </div>

      {/* Results */}
      {diagnostics && (
        <Card className={diagnostics.error ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {diagnostics.error ? (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-900">Diagnostic Error</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-green-900">Backend Context</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {diagnostics.error ? (
              <div className="text-red-800">
                <p className="font-semibold mb-2">Error:</p>
                <p className="font-mono text-sm">{diagnostics.error}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Request Host:</p>
                  <p className="font-mono text-sm text-slate-600">{diagnostics.requestHost || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Request Origin:</p>
                  <p className="font-mono text-sm text-slate-600">{diagnostics.requestOrigin || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Base44 App ID (Backend):</p>
                  <p className="font-mono text-sm text-slate-600">{diagnostics.appId}</p>
                </div>
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center gap-2">
                    {diagnostics.hasBase44Header ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">
                      Base44-App-Id Header: <span className="font-mono">{diagnostics.hasBase44Header ? 'Present' : 'MISSING'}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {diagnostics.hasAuthHeader ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">
                      Authorization Header: <span className="font-mono">{diagnostics.hasAuthHeader ? 'Present' : 'MISSING'}</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Troubleshooting Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-800">
          <ol className="list-decimal list-inside space-y-2">
            <li>Click "Run Backend Diagnostics" and check if Base44-App-Id header is present</li>
            <li>Compare the request host/origin with your expected domain</li>
            <li>If missing headers, the issue is domain/app routing, not Stripe</li>
            <li>Test this page on all three domains (default Base44 URL, estatewatch365.app, homewatch365.app)</li>
            <li>If headers are present here but missing on CheckoutSuccess, the issue is specific to that flow</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}