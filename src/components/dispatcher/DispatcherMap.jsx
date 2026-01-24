import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function DispatcherMap({ properties, visits }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      const apiKey = 'YOUR_GOOGLE_MAPS_API_KEY'; // Will use env variable
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, []);

  useEffect(() => {
    if (map && properties.length > 0) {
      updateMarkers();
    }
  }, [map, properties, visits]);

  const initMap = () => {
    if (!mapRef.current) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      zoom: 11,
      center: { lat: 28.5383, lng: -81.3792 }, // Default to Orlando
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    setMap(mapInstance);
    setLoading(false);
  };

  const updateMarkers = () => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasValidLocations = false;

    properties.forEach((property) => {
      if (!property.latitude || !property.longitude) return;

      const visit = visits.find(v => v.property_id === property.id);
      
      // Determine marker color based on visit status
      let markerColor = '#3B82F6'; // Blue for scheduled
      if (visit?.status === 'completed') markerColor = '#10B981'; // Green
      if (visit?.status === 'in_progress') markerColor = '#F59E0B'; // Amber

      const marker = new google.maps.Marker({
        position: { lat: property.latitude, lng: property.longitude },
        map: map,
        title: property.name || property.address,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: markerColor,
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="font-weight: 600; margin-bottom: 4px;">${property.name || 'Property'}</h3>
            <p style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${property.address}</p>
            ${visit ? `
              <div style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
                <span style="background: ${markerColor}; color: white; padding: 2px 8px; border-radius: 4px;">
                  ${visit.status.replace('_', ' ')}
                </span>
                ${visit.assigned_to_name ? `<span>👤 ${visit.assigned_to_name}</span>` : ''}
              </div>
            ` : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
      bounds.extend({ lat: property.latitude, lng: property.longitude });
      hasValidLocations = true;
    });

    if (hasValidLocations) {
      map.fitBounds(bounds);
    }
  };

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 rounded-lg z-10">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      )}
      <div 
        ref={mapRef} 
        className="w-full h-[400px] rounded-lg"
        style={{ minHeight: '400px' }}
      />
      {properties.length === 0 && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 rounded-lg">
          <p className="text-slate-500">No properties scheduled for today</p>
        </div>
      )}
    </div>
  );
}