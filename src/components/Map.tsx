import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Event } from '../types';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icon
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  events: Event[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

// Component to update map center when props change
const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

export const Map = ({ events, center = [37.7749, -122.4194], zoom = 13, className }: MapProps) => {
  // Default to San Francisco if no center provided, or use the first event's location
  const mapCenter: [number, number] = center;

  if (events.length > 0 && !center) {
    // If we have events but no explicit center, try to center on the first event with coordinates
    const firstEventWithCoords = events.find(e => e.latitude && e.longitude);
    if (firstEventWithCoords) {
        // We can't easily change the center variable here without state, 
        // but MapUpdater will handle re-centering if we pass a computed center.
        // For now, the parent should pass the correct center.
    }
  }

  return (
    <MapContainer 
      center={mapCenter} 
      zoom={zoom} 
      scrollWheelZoom={false} 
      className={`w-full h-full rounded-xl z-0 ${className}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {center && <MapUpdater center={center} />}

      {events.map((event) => (
        event.latitude && event.longitude ? (
          <Marker key={event.id} position={[event.latitude, event.longitude]}>
            <Popup>
              <div className="min-w-[200px]">
                <img 
                  src={event.cover_image_url} 
                  alt={event.title} 
                  className="w-full h-24 object-cover rounded-t-lg mb-2"
                />
                <h3 className="font-bold text-sm mb-1">{event.title}</h3>
                <p className="text-xs text-gray-500 mb-2">{event.location_name}</p>
                <Link 
                  to={`/events/${event.id}`}
                  className="block w-full text-center py-1 bg-primary text-white text-xs rounded hover:bg-primary-700 transition-colors"
                >
                  View Details
                </Link>
              </div>
            </Popup>
          </Marker>
        ) : null
      ))}
    </MapContainer>
  );
};
