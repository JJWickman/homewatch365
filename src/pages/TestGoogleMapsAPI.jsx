import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');

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

      if (response.data?.validation?.isValid) {
        setLatitude('N/A');
        setLongitude('N/A');
        setError(null);
      } else {
        setError(response.data?.validation?.error || 'Failed to validate address');
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to validate address');
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
      
      if (response.data?.coordinates) {
        setLatitude(response.data.coordinates.lat);
        setLongitude(response.data.coordinates.lng);
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadGoogleMaps = async () => {
    try {
      if (window.google?.maps) {
        initializeMap();
        return;
      }

      const response = await base44.functions.invoke('googleMapsConfig');
      const apiKey = response.data.apiKey;
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => initializeMap();
      document.head.appendChild(script);
    } catch (err) {
      console.error('Error loading Google Maps:', err);
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      zoom: 15,
      center: { lat: 42.0, lng: -83.5 },
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });
  };

  const updateMapMarker = (lat, lng) => {
    if (!mapInstanceRef.current || !window.google) return;

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    const position = { lat: parseFloat(lat), lng: parseFloat(lng) };
    
    markerRef.current = new window.google.maps.Marker({
      position,
      map: mapInstanceRef.current,
      title: `${address}, ${city}, ${state}`,
    });

    mapInstanceRef.current.setCenter(position);
    mapInstanceRef.current.setZoom(18);
  };

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    if (result && !mapInstanceRef.current) {
      loadGoogleMaps();
    }
  }, [result]);

  const loadProperties = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        const props = await base44.entities.Property.filter({ company_id: members[0].company_id });
        setProperties(props);
      }
    } catch (err) {
      console.error('Error loading properties:', err);
    }
  };

  const handlePropertySelect = async (propertyId) => {
    setSelectedProperty(propertyId);
    const property = properties.find(p => p.id === propertyId);
    
    if (property) {
      setAddress(property.address || '');
      setCity(property.city || '');
      setState(property.state || '');
      setZip(property.zip || '');
      
      if (property.latitude && property.longitude) {
        setLatitude(property.latitude);
        setLongitude(property.longitude);
        
        // Set result to trigger map rendering
        setResult({
          validation: {
            isValid: true,
            status: 'OK',
            formattedAddress: `${property.address}, ${property.city}, ${property.state} ${property.zip}`
          },
          coordinates: {
            lat: property.latitude,
            lng: property.longitude
          }
        });
        
        // Initialize map if needed
        if (!mapInstanceRef.current) {
          await loadGoogleMaps();
        }
        
        // Update map marker
        if (mapInstanceRef.current) {
          updateMapMarker(property.latitude, property.longitude);
        }
      }
    }
  };

  useEffect(() => {
    if (latitude && longitude && mapInstanceRef.current) {
      updateMapMarker(latitude, longitude);
    }
  }, [latitude, longitude]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Google Maps API Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Property or Enter Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="property-select">Select Property</Label>
            <Select value={selectedProperty} onValueChange={handlePropertySelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a property..." />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name || property.address} - {property.city}, {property.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or enter manually</span>
            </div>
          </div>
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
            </CardContent>
          </Card>

          {result.coordinates && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Coordinates</CardTitle>
              </CardHeader>
              <CardContent>
                <p><strong>Latitude:</strong> {result.coordinates.lat}</p>
                <p><strong>Longitude:</strong> {result.coordinates.lng}</p>
              </CardContent>
            </Card>
          )}

          {result.aerialViewUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Aerial View</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <img 
                  src={result.aerialViewUrl} 
                  alt="Aerial View"
                  className="w-full rounded-lg border border-slate-200"
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Map View</CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={mapRef} className="w-full h-[400px] rounded-lg border" />
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}