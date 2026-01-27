import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import { MapPin, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function StaticRouteMap({ stops = [], startAddress }) {
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // Default NYC
  const [mapZoom, setMapZoom] = useState(13);

  const validStops = stops.filter(s => {
    const lat = parseFloat(s.lat || s.latitude);
    const lng = parseFloat(s.lng || s.longitude);
    return !isNaN(lat) && !isNaN(lng);
  });

  useEffect(() => {
    if (validStops.length > 0) {
      // Calculate center based on all stops
      const avgLat = validStops.reduce((sum, stop) => sum + parseFloat(stop.lat || stop.latitude), 0) / validStops.length;
      const avgLng = validStops.reduce((sum, stop) => sum + parseFloat(stop.lng || stop.longitude), 0) / validStops.length;
      setMapCenter([avgLat, avgLng]);
    }
  }, [validStops.length]);

  // Create custom numbered icons for markers
  const createNumberedIcon = (number) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background: #1e293b;
        color: white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">${number}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  };

  if (!validStops || validStops.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-100 rounded-lg" style={{ minHeight: '400px' }}>
        <div className="text-center text-slate-500">
          <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Map will appear here</p>
          <p className="text-sm">Select a user and date to view visit locations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ minHeight: '400px', height: '500px' }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="topright" />
        
        {validStops.map((stop, index) => {
          const lat = parseFloat(stop.lat || stop.latitude);
          const lng = parseFloat(stop.lng || stop.longitude);
          
          return (
            <Marker
              key={index}
              position={[lat, lng]}
              icon={createNumberedIcon(index + 1)}
            >
              <Popup>
                <div className="p-2">
                  <strong className="block mb-1">{stop.name || stop.property_name || 'Property'}</strong>
                  <small className="text-slate-600">{stop.address}</small>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Property Count Badge */}
      <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md border border-slate-200 z-[1000]">
        <p className="text-xs font-medium text-slate-700">
          {validStops.length} {validStops.length === 1 ? 'property' : 'properties'}
        </p>
      </div>
    </div>
  );
}