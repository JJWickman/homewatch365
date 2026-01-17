import React, { useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

export default function StaticRouteMap({ stops = [], startAddress }) {
  const [mapUrl, setMapUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const validStops = stops.filter(s => {
    const lat = parseFloat(s.lat || s.latitude);
    const lng = parseFloat(s.lng || s.longitude);
    return !isNaN(lat) && !isNaN(lng);
  });

  useEffect(() => {
    if (validStops.length > 0) {
      generateStaticMapUrl();
    }
  }, [stops]);

  const generateStaticMapUrl = async () => {
    setLoading(true);
    try {
      // Get API key from backend
      const response = await fetch('/api/base44Client/functions/googleMapsConfig');
      const data = await response.json();
      const apiKey = data.apiKey;

      if (!apiKey) {
        console.error('Google Maps API key not found');
        setLoading(false);
        return;
      }

      // Build markers for static map
      const markers = validStops
        .map((stop, idx) => {
          const lat = parseFloat(stop.lat || stop.latitude);
          const lng = parseFloat(stop.lng || stop.longitude);
          const color = idx === 0 ? '0x1e293b' : '0x64748b';
          const label = String(stop.order || idx + 1);
          return `color:${color}|label:${label}|${lat},${lng}`;
        })
        .join('&markers=');

      // Calculate center and zoom based on bounds
      const lats = validStops.map(s => parseFloat(s.lat || s.latitude));
      const lngs = validStops.map(s => parseFloat(s.lng || s.longitude));
      const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
      const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;

      // Build the static map URL
      const url = `https://maps.googleapis.com/maps/api/staticmap?` +
        `center=${centerLat},${centerLng}` +
        `&zoom=11` +
        `&size=1200x500` +
        `&scale=2` +
        `&markers=${markers}` +
        `&style=feature:poi|element:labels|visibility:off` +
        `&key=${apiKey}`;

      setMapUrl(url);
    } catch (error) {
      console.error('Error generating static map:', error);
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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 rounded-lg">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!mapUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-100 rounded-lg">
        <div className="text-center text-slate-500">
          <p className="font-medium">Unable to load map</p>
          <p className="text-sm">Please check your configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden bg-slate-50">
      <img
        src={mapUrl}
        alt="Route map"
        className="w-full h-full object-cover"
      />
    </div>
  );
}