import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui';

// Fix Leaflet default marker icons broken by Vite's asset bundling
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) return '';
    const data = await res.json() as {
      name?: string;
      display_name?: string;
      address?: Record<string, string>;
    };
    const addr = data.address ?? {};
    const name = data.name || addr.amenity || addr.tourism || addr.historic || addr.shop || addr.leisure;
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.county;
    const road = addr.road;
    if (name && city) return `${name}, ${city}`;
    if (name) return name;
    if (road && city) return `${road}, ${city}`;
    if (city) return city;
    return data.display_name?.split(',').slice(0, 2).join(',').trim() ?? '';
  } catch {
    return '';
  }
}

interface LocationPickerProps {
  initialLocation?: { latitude: number; longitude: number; locationName: string };
  onSave: (location: { latitude: number; longitude: number; locationName: string }) => void;
  onCancel: () => void;
}

function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (!isNaN(lat) && !isNaN(lng)) {
      map.setView([lat, lng], map.getZoom(), { animate: true, duration: 0.15 });
    }
  }, [lat, lng, map]);
  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({ initialLocation, onSave, onCancel }: LocationPickerProps) {
  const { t } = useTranslation();
  const [lat, setLat] = useState(initialLocation?.latitude ?? 0);
  const [lng, setLng] = useState(initialLocation?.longitude ?? 0);
  const [locationName, setLocationName] = useState(initialLocation?.locationName ?? '');
  const [latInput, setLatInput] = useState(String(initialLocation?.latitude ?? ''));
  const [lngInput, setLngInput] = useState(String(initialLocation?.longitude ?? ''));
  const [isGeocoding, setIsGeocoding] = useState(false);

  const applyCoords = useCallback(async (latitude: number, longitude: number) => {
    setLat(latitude);
    setLng(longitude);
    setLatInput(String(latitude));
    setLngInput(String(longitude));
    setIsGeocoding(true);
    const name = await reverseGeocode(latitude, longitude);
    if (name) setLocationName(name);
    setIsGeocoding(false);
  }, []);

  useEffect(() => {
    if (!initialLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          void applyCoords(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Geolocation denied or unavailable — use default coords
        }
      );
    }
  }, [initialLocation, applyCoords]);

  const handleLatChange = (value: string) => {
    setLatInput(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) setLat(parsed);
  };

  const handleLngChange = (value: string) => {
    setLngInput(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) setLng(parsed);
  };

  const handleSave = () => {
    onSave({ latitude: lat, longitude: lng, locationName });
  };

  const validCoords = !isNaN(lat) && !isNaN(lng);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white dark:bg-slate-900 shadow-xl transition-colors">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 transition-colors">
            {t('entries.setLocation')}
          </h2>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 transition-colors">
                {t('entries.latitude')}
              </label>
              <input
                type="number"
                value={latInput}
                onChange={(e) => handleLatChange(e.target.value)}
                step="any"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 transition-colors">
                {t('entries.longitude')}
              </label>
              <input
                type="number"
                value={lngInput}
                onChange={(e) => handleLngChange(e.target.value)}
                step="any"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 transition-colors">
              {t('entries.locationName')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                maxLength={200}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {isGeocoding && (
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                </div>
              )}
            </div>
          </div>

          {validCoords && (
            <MapContainer
              center={[lat, lng]}
              zoom={13}
              className="h-48 w-full rounded-md z-0"
              style={{ zIndex: 0 }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[lat, lng]} />
              <MapUpdater lat={lat} lng={lng} />
              <MapClickHandler onMapClick={(clickLat, clickLng) => { void applyCoords(clickLat, clickLng); }} />
            </MapContainer>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
          <Button variant="ghost" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!validCoords}>
            {t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
