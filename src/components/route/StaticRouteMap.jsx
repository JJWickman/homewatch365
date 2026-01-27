import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Plus, Minus } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function StaticRouteMap({ stops = [], startAddress }) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);

  const validStops = stops.filter(s => {
    const lat = parseFloat(s.lat || s.latitude);
    const lng = parseFloat(s.lng || s.longitude);
    return !isNaN(lat) && !isNaN(lng);
  });

  useEffect(() => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyBPbLVxQ6d5dBkDX_5MHQ9dHJZECXX';
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => setError('Failed to load Google Maps');
    if (!window.google) {
      document.body.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (mapLoaded && mapRef.current && validStops.length > 0 && !googleMapRef.current) {
      initializeMap();
    } else if (googleMapRef.current && validStops.length > 0) {
      updateMarkers();
    }
  }, [mapLoaded, validStops.length]);

  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;

    const bounds = new window.google.maps.LatLngBounds();
    validStops.forEach(stop => {
      const lat = parseFloat(stop.lat || stop.latitude);
      const lng = parseFloat(stop.lng || stop.longitude);
      bounds.extend(new window.google.maps.LatLng(lat, lng));
    });

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 13,
      center: bounds.getCenter(),
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: false // We'll add custom zoom controls
    });

    googleMapRef.current = map;
    map.fitBounds(bounds);
    updateMarkers();
  };

  const updateMarkers = () => {
    if (!googleMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    validStops.forEach((stop, index) => {
      const lat = parseFloat(stop.lat || stop.latitude);
      const lng = parseFloat(stop.lng || stop.longitude);

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: googleMapRef.current,
        label: {
          text: `${index + 1}`,
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold'
        },
        title: stop.property_name || stop.address || `Stop ${index + 1}`
      });

      // Info window on click
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <strong>${stop.property_name || 'Property'}</strong>
            <br/>
            <small>${stop.address || ''}</small>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMapRef.current, marker);
      });

      markersRef.current.push(marker);
    });
  };

  const handleZoomIn = () => {
    if (googleMapRef.current) {
      googleMapRef.current.setZoom(googleMapRef.current.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (googleMapRef.current) {
      googleMapRef.current.setZoom(googleMapRef.current.getZoom() - 1);
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

  if (!mapLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 rounded-lg">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Loading map...</p>
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
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden bg-slate-50 relative">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Custom Zoom Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-2">
        <Button
          size="icon"
          variant="outline"
          onClick={handleZoomIn}
          className="bg-white hover:bg-slate-100 shadow-md"
          title="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={handleZoomOut}
          className="bg-white hover:bg-slate-100 shadow-md"
          title="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      {/* Property Count Badge */}
      {validStops.length > 0 && (
        <div className="absolute bottom-3 left-3 bg-white px-3 py-2 rounded-lg shadow-md border border-slate-200">
          <p className="text-xs font-medium text-slate-700">
            {validStops.length} {validStops.length === 1 ? 'property' : 'properties'}
          </p>
        </div>
      )}
    </div>
  );
}