import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, Loader2, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function StaticRouteMap({ stops = [], startAddress }) {
  const [mapUrl, setMapUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validStops = stops.filter(s => {
    const lat = parseFloat(s.lat || s.latitude);
    const lng = parseFloat(s.lng || s.longitude);
    return !isNaN(lat) && !isNaN(lng);
  });

  useEffect(() => {
    if (validStops.length > 0) {
      generateStaticMapUrl();
    } else {
      setMapUrl(null);
      setError(null);
    }
  }, [stops.length]);

  const generateStaticMapUrl = async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await base44.functions.invoke('generateStaticMapUrl', {
        stops: validStops
      });
      
      if (response.data?.mapUrl) {
        setMapUrl(response.data.mapUrl);
      } else {
        setError('No map URL received');
      }
    } catch (error) {
      console.error('Error generating static map:', error);
      setError(error.message || 'Failed to load map');
    } finally {
      setLoading(false);
    }
  };

  if (!validStops || validStops.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-100 rounded-lg">
        <div className="text-center text-slate-500">
          <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Map will appear here</p>
          <p className="text-sm">Select a user and date to view visit locations</p>
        </div>
      </div>
    );
  }

  if (loading && !mapUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 rounded-lg">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Initializing map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-100 rounded-lg">
        <div className="text-center text-slate-500">
          <p className="font-medium">Unable to load map</p>
          <p className="text-sm">{error}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={generateStaticMapUrl}
            className="mt-3"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!mapUrl && !loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-100 rounded-lg">
        <div className="text-center text-slate-500">
          <p className="font-medium">Map not loaded</p>
          <Button
            size="sm"
            variant="outline"
            onClick={generateStaticMapUrl}
            className="mt-3"
          >
            Load Map
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden bg-slate-50 relative">
      <img
        src={mapUrl}
        alt="Route map"
        className="w-full h-full object-cover"
      />
      <div className="absolute top-3 right-3">
        <Button
          size="icon"
          variant="outline"
          onClick={generateStaticMapUrl}
          disabled={loading}
          className="bg-white hover:bg-slate-100 shadow"
        >
          <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}