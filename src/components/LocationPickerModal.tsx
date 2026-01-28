import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Search, X, Loader2, MapPin } from 'lucide-react';
import L from 'leaflet';

const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Location {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: Location) => void;
  initialLocation?: { lat: number; lng: number };
}

// Click handler component
const LocationMarker = ({ onLocationFound }: { onLocationFound: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onLocationFound(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Map updater
const MapUpdater = ({ center }: { center: [number, number] }) => {
    const map = useMapEvents({});
    useEffect(() => {
        if (center) map.flyTo(center, map.getZoom());
    }, [center]);
    return null;
}

export const LocationPickerModal = ({ isOpen, onClose, onSelect, initialLocation }: LocationPickerModalProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(initialLocation ? [initialLocation.lat, initialLocation.lng] : null);

  // Default to Beijing
  const defaultCenter: [number, number] = [39.9042, 116.4074];

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!query) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const selectResult = (item: any) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setSelectedCoords([lat, lng]);
    setResults([]);
  };
  
  const handleMapClick = (lat: number, lng: number) => {
      setSelectedCoords([lat, lng]);
  }

  const handleConfirm = async () => {
      if (!selectedCoords) return;
      setSearching(true);
      try {
          // Reverse geocode to get name/address if we just clicked the map
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedCoords[0]}&lon=${selectedCoords[1]}`);
          const data = await res.json();
          onSelect({
              name: data.name || data.display_name.split(',')[0],
              address: data.display_name,
              lat: selectedCoords[0],
              lng: selectedCoords[1]
          });
          onClose();
      } catch (e) {
          console.error(e);
          // Fallback
          onSelect({
              name: `${selectedCoords[0].toFixed(4)}, ${selectedCoords[1].toFixed(4)}`,
              address: '',
              lat: selectedCoords[0],
              lng: selectedCoords[1]
          });
          onClose();
      } finally {
          setSearching(false);
      }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden shadow-2xl animate-fade-in-up">
        <div className="p-4 border-b flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              className="w-full bg-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="搜索地点 (例如: 上海中心大厦)..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" size={16} />}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {results.length > 0 && (
            <div className="border-b max-h-40 overflow-y-auto bg-slate-50 z-10">
                {results.map((item, i) => (
                    <button key={i} onClick={() => selectResult(item)} className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm border-b last:border-0 truncate">
                        {item.display_name}
                    </button>
                ))}
            </div>
        )}

        <div className="flex-1 relative">
           <MapContainer center={selectedCoords || defaultCenter} zoom={13} className="w-full h-full">
             <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
             {selectedCoords && <MapUpdater center={selectedCoords} />}
             <LocationMarker onLocationFound={handleMapClick} />
             {selectedCoords && <Marker position={selectedCoords} />}
           </MapContainer>
           
           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
               <button 
                onClick={handleConfirm}
                disabled={!selectedCoords || searching}
                className="bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
               >
                   {searching ? <Loader2 className="animate-spin" size={18} /> : <MapPin size={18} />}
                   {searching ? '获取信息...' : '确认地点'}
               </button>
           </div>
        </div>
      </div>
    </div>
  );
};
