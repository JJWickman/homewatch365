import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';

export default function TestGoogleMapsAPI() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await base44.functions.invoke('testGoogleMapsAPI', {
        address: '7223 Lake Shore Dr',
        city: 'Chelsea',
        state: 'MI',
        zip: '48118'
      });
      
      setResult(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Google Maps API Test</h1>
      
      <Button onClick={testAPI} disabled={loading} className="mb-6">
        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Test Address: 7223 Lake Shore Dr, Chelsea, MI 48118
      </Button>

      {error && (
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardContent className="pt-6">
            <p className="text-red-800 font-mono text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Validation Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Valid:</strong> {result.validation.isValid ? 'Yes' : 'No'}</p>
              <p><strong>Formatted Address:</strong> {result.validation.formattedAddress}</p>
              <p><strong>Latitude:</strong> {result.validation.lat}</p>
              <p><strong>Longitude:</strong> {result.validation.lng}</p>
            </CardContent>
          </Card>

          {result.streetViewUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Street View</CardTitle>
              </CardHeader>
              <CardContent>
                <img 
                  src={result.streetViewUrl} 
                  alt="Street View" 
                  className="w-full rounded-lg border border-slate-200"
                />
              </CardContent>
            </Card>
          )}


        </div>
      )}
    </div>
  );
}