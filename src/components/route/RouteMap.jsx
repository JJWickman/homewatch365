import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function RouteMap({ stops = [], startAddress, isOptimized }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  const validStops = stops.filter(s => s.lat && s.lng);
  const hasValidData = validStops.length > 0;

  useEffect(() => {
    if (mapInstanceRef.current && stops.length > 0) {
      updateMap();
    }
  }, [stops, startAddress, isOptimized]);

  const loadGoogleMaps = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if already loaded
      if (window.google?.maps) {
        initializeMap();
        return;
      }

      // Get API key from backend
      const response = await base44.functions.invoke('googleMapsConfig');
      const apiKey = response.data.apiKey;
      
      if (!apiKey) {
        throw new Error('Google Maps API key not found');
      }
      
      // Load Google Maps script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeMap();
      };
      script.onerror = () => {
        setError('Failed to load Google Maps');
        setLoading(false);
      };
      document.head.appendChild(script);
    } catch (err) {
      console.error('Error loading Google Maps:', err);
      setError('Failed to load map');
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      zoom: 10,
      center: { lat: 39.8283, lng: -98.5795 }, // Center of US
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    setLoading(false);
    setMapReady(true);
    updateMap();
  };

  const updateMap = () => {
    const map = mapInstanceRef.current;
    if (!map || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // Filter stops with valid coordinates
    const validStops = stops.filter(stop => stop.lat && stop.lng);
    console.log('RouteMap - Updating map with stops:', validStops);
    
    if (validStops.length === 0) {
      console.log('RouteMap - No valid stops to display');
      return;
    }

    // Add markers for each stop
    validStops.forEach((stop, index) => {
      console.log(`RouteMap - Adding marker ${index + 1}:`, {
        name: stop.name,
        lat: stop.lat,
        lng: stop.lng,
        order: stop.order
      });
      
      const marker = new window.google.maps.Marker({
        position: { lat: parseFloat(stop.lat), lng: parseFloat(stop.lng) },
        map,
        label: {
          text: String(stop.order || index + 1),
          color: 'white',
          fontWeight: 'bold',
          fontSize: '12px'
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: isOptimized ? '#1e293b' : '#64748b',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: stop.name
      });

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="font-weight: 600; margin: 0 0 4px 0;">${stop.order ? `Stop ${stop.order}: ` : ''}${stop.name}</h3>
            <p style="margin: 0; font-size: 12px; color: #666;">${stop.address || ''}</p>
            ${stop.estimated_arrival ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #0066cc;">ETA: ${stop.estimated_arrival}</p>` : ''}
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    // Draw route line if optimized
    if (isOptimized && validStops.length > 1) {
      const routePath = validStops.map(stop => ({ lat: stop.lat, lng: stop.lng }));
      
      polylineRef.current = new window.google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: '#1e293b',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map
      });
    }

    // Fit bounds to show all markers
    const bounds = new window.google.maps.LatLngBounds();
    validStops.forEach(stop => {
      bounds.extend({ lat: stop.lat, lng: stop.lng });
    });
    map.fitBounds(bounds);

    // Add slight padding
    const padding = { top: 50, right: 50, bottom: 50, left: 50 };
    map.fitBounds(bounds, padding);
  };

  // Show placeholder if no valid data
  if (!hasValidData) {
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

  if (!mapReady && !loading && !error) {
    loadGoogleMaps();
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-lg">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Loading map...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-lg">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-lg">
        <div className="text-center text-red-600">
          <p className="font-medium">{error}</p>
          <p className="text-sm mt-1">Please check your Google Maps API configuration</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full rounded-lg" />;
}