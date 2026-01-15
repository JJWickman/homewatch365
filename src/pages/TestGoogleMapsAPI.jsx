import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';

export default function TestGoogleMapsAPI() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [address, setAddress] = useState('7223 Lake Shore Dr');
  const [city, setCity] = useState('Chelsea');
  const [state, setState] = useState('MI');
  const [zip, setZip] = useState('48118');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const getLatLon = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('testGoogleMapsAPI', {
        address,
        city,
        state,
        zip
      });

      if (response.data.validation.isValid) {
        setLatitude(response.data.validation.lat.toString());
        setLongitude(response.data.validation.lng.toString());
      } else {
        setError(response.data.validation.error || 'Failed to get coordinates');
      }
    } catch (err) {
      setError(err.message || 'Failed to get coordinates');
    } finally {
      setLoading(false);
    }
  };

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await base44.functions.invoke('testGoogleMapsAPI', {
        address,
        city,
        state,
        zip
      });
      
      setResult(response.data);
      if (response.data.validation.isValid) {
        setLatitude(response.data.validation.lat.toString());
        setLongitude(response.data.validation.lng.toString());
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Google Maps API Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Enter Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="ST"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="zip">ZIP Code</Label>
            <Input
              id="zip"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="12345"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                value={latitude}
                readOnly
                placeholder="Latitude"
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                value={longitude}
                readOnly
                placeholder="Longitude"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={getLatLon} disabled={loading} className="flex-1">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Get LatLon
            </Button>
            <Button onClick={testAPI} disabled={loading} className="flex-1" variant="outline">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Test Address
            </Button>
          </div>
        </CardContent>
      </Card>

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
              <p><strong>Status:</strong> {result.validation.status}</p>
              {result.validation.error && <p className="text-red-600"><strong>Error:</strong> {result.validation.error}</p>}
              <p><strong>Formatted Address:</strong> {result.validation.formattedAddress}</p>
              <p><strong>Latitude:</strong> {result.validation.lat}</p>
              <p><strong>Longitude:</strong> {result.validation.lng}</p>
            </CardContent>
          </Card>

          {result.aerialView && (
            <Card>
              <CardHeader>
                <CardTitle>Aerial View</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p><strong>State:</strong> {result.aerialView.state}</p>
                
                {result.aerialView.state === 'ACTIVE' && result.aerialView.uris && (
                  <div className="space-y-2">
                    {result.aerialView.uris.MP4_MEDIUM && (
                      <div>
                        <p className="text-sm text-slate-600 mb-2">Video (MP4):</p>
                        <video 
                          src={result.aerialView.uris.MP4_MEDIUM.landscapeUri} 
                          controls 
                          className="w-full rounded-lg border border-slate-200"
                        >
                          Your browser does not support video playback.
                        </video>
                      </div>
                    )}
                    {result.aerialView.metadata && (
                      <div className="text-sm text-slate-600">
                        <p><strong>Capture Date:</strong> {result.aerialView.metadata.captureDate}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {result.aerialView.state === 'PROCESSING' && (
                  <p className="text-amber-600">Video is being processed. Try again later.</p>
                )}
                
                {result.aerialView.error && (
                  <p className="text-slate-600">{result.aerialView.error}</p>
                )}
              </CardContent>
            </Card>
          )}


        </div>
      )}
    </div>
  );
}