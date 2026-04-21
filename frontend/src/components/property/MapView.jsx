import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix the broken default marker icon that Vite/webpack asset bundling causes in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom amber marker to match the app's colour scheme
const indigoIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Inner component that auto-fits the map bounds whenever mappable properties change
const BoundsController = ({ mappable }) => {
  const map = useMap();
  useEffect(() => {
    if (mappable.length === 0) return;
    const bounds = mappable.map((p) => [p.latitude, p.longitude]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [mappable.length]);
  return null;
};

const MapView = ({ properties }) => {
  const mappable = (properties || []).filter(
    (p) => p.latitude != null && p.longitude != null,
  );
  const unmappedCount = (properties?.length ?? 0) - mappable.length;

  // Default center: India
  const defaultCenter = [20.5937, 78.9629];

  return (
    <div className="relative w-full">
      {/* Info bar */}
      <div className="flex items-center justify-between mb-2 text-sm text-gray-600">
        <span>
          <span className="font-semibold text-amber-600">{mappable.length}</span>{' '}
          {mappable.length === 1 ? 'property' : 'properties'} on map
          {unmappedCount > 0 && (
            <span className="ml-2 text-gray-400">
              ({unmappedCount} without location)
            </span>
          )}
        </span>
        <span className="text-xs text-gray-400">Click a pin for details</span>
      </div>

      <div className="w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '560px', isolation: 'isolate' }}>
        <MapContainer
          center={defaultCenter}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <BoundsController mappable={mappable} />

          {mappable.map((p) => (
            <Marker key={p.id} position={[p.latitude, p.longitude]} icon={indigoIcon}>
              <Popup minWidth={220}>
                <div className="py-1">
                  <p className="font-bold text-sm text-gray-900 mb-1">{p.title || 'Property'}</p>
                  <p className="text-xs text-gray-500 mb-1">{p.city || ''}</p>
                  <p className="text-sm font-semibold text-blue-700 mb-3">
                    ₹{(p.price ?? 0).toLocaleString('en-IN')}
                  </p>
                  <Link
                    to={`/properties/${p.id}`}
                    className="inline-block bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {mappable.length === 0 && (
        <div className="mt-4 text-center text-sm text-gray-400">
          No properties with location data yet. Coordinates are auto-populated when properties are saved.
        </div>
      )}
    </div>
  );
};

export default MapView;

