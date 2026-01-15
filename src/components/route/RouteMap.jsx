import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { MapPin, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom numbered marker
const createNumberedIcon = (number, isOptimized) => {
  return L.divIcon({
    className: 'custom-numbered-marker',
    html: `<div style="
      background: ${isOptimized ? '#1e293b' : '#64748b'};
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${number}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

// Component to fit bounds
function FitBounds({ stops }) {
  const map = useMap();
  
  useEffect(() => {
    if (stops.length > 0) {
      const validStops = stops.filter(s => s.lat && s.lng);
      if (validStops.length > 0) {
        const bounds = L.latLngBounds(validStops.map(s => [s.lat, s.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [stops, map]);
  
  return null;
}

export default function RouteMap({ stops = [], startAddress, isOptimized }) {
  const [center, setCenter] = useState([39.8283, -98.5795]); // Center of US
  const [zoom, setZoom] = useState(4);
  
  const validStops = stops.filter(s => s.lat && s.lng);
  
  // Generate route line coordinates
  const routeCoordinates = validStops.map(s => [s.lat, s.lng]);

  if (validStops.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-100 rounded-lg">
        <div className="text-center text-slate-500">
          <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No locations to display</p>
          <p className="text-sm">Select a date with scheduled inspections</p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={validStops.length > 0 ? [validStops[0].lat, validStops[0].lng] : center}
      zoom={zoom}
      className="h-full w-full rounded-lg"
      style={{ minHeight: '400px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <FitBounds stops={validStops} />
      
      {/* Route line */}
      {isOptimized && routeCoordinates.length > 1 && (
        <Polyline
          positions={routeCoordinates}
          color="#1e293b"
          weight={3}
          opacity={0.7}
          dashArray="10, 10"
        />
      )}
      
      {/* Stop markers */}
      {validStops.map((stop, index) => (
        <Marker
          key={index}
          position={[stop.lat, stop.lng]}
          icon={createNumberedIcon(stop.order || index + 1, isOptimized)}
        >
          <Popup>
            <div className="min-w-[150px]">
              <p className="font-semibold">{stop.name}</p>
              <p className="text-sm text-slate-600">{stop.address}</p>
              {stop.estimated_arrival && (
                <p className="text-sm text-blue-600 mt-1">ETA: {stop.estimated_arrival}</p>
              )}
              {stop.drive_time_minutes && (
                <p className="text-xs text-slate-500">
                  {stop.drive_time_minutes} min • {stop.distance_miles} mi
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}