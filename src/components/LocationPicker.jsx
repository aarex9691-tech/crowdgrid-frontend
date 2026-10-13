import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search } from 'lucide-react';

const NASHIK = { lat: 20.0059, lng: 73.7897 };
const NOMINATIM = 'https://nominatim.openstreetmap.org';

/** Turns a Nominatim result into our address fields. */
const toAddress = (r) => {
  const a = r.address || {};
  const street = [a.house_number, a.road, a.neighbourhood || a.suburb].filter(Boolean).join(', ');
  return {
    address: (street || r.display_name || '').slice(0, 200),
    city: (a.city || a.town || a.village || a.county || '').slice(0, 60),
    pincode: /^\d{6}$/.test(a.postcode || '') ? a.postcode : '',
  };
};

/**
 * Pick the venue on a map (OpenStreetMap, free, no API key): search a place or
 * click the map; the address fields are filled in and can still be edited by
 * hand. `value` = { lat, lng } or null.
 */
export default function LocationPicker({ value, onPick }) {
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const placeMarker = (lat, lng) => {
    const map = mapRef.current;
    if (!map) return;
    if (!markerRef.current) {
      markerRef.current = L.circleMarker([lat, lng], { radius: 10, color: '#c8102e', weight: 3, fillColor: '#f2a900', fillOpacity: 0.9 }).addTo(map);
    } else markerRef.current.setLatLng([lat, lng]);
  };

  const reverse = async (lat, lng) => {
    try {
      const r = await fetch(`${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`, { headers: { 'Accept-Language': 'en' } });
      const data = await r.json();
      onPick({ location: { lat, lng }, ...toAddress(data) });
    } catch {
      onPick({ location: { lat, lng } });
    }
  };

  useEffect(() => {
    if (mapRef.current || !boxRef.current) return;
    const start = value || NASHIK;
    const map = L.map(boxRef.current, { scrollWheelZoom: false }).setView([start.lat, start.lng], value ? 16 : 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    map.on('click', (e) => {
      const lat = Number(e.latlng.lat.toFixed(6));
      const lng = Number(e.latlng.lng.toFixed(6));
      placeMarker(lat, lng);
      reverse(lat, lng);
    });
    mapRef.current = map;
    if (value) placeMarker(value.lat, value.lng);
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = async (e) => {
    e?.preventDefault();
    if (query.trim().length < 3) return;
    setBusy(true);
    setError('');
    try {
      const r = await fetch(`${NOMINATIM}/search?format=jsonv2&addressdetails=1&countrycodes=in&limit=5&q=${encodeURIComponent(query)}`, {
        headers: { 'Accept-Language': 'en' },
      });
      const data = await r.json();
      setResults(data);
      if (!data.length) setError('No place found. Try a landmark and city, or click the map.');
    } catch {
      setError('Map search is unavailable right now. Click the map or type the address below.');
    } finally {
      setBusy(false);
    }
  };

  const choose = (r) => {
    const lat = Number(Number(r.lat).toFixed(6));
    const lng = Number(Number(r.lon).toFixed(6));
    mapRef.current?.setView([lat, lng], 16);
    placeMarker(lat, lng);
    setResults([]);
    onPick({ location: { lat, lng }, ...toAddress(r) });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <label htmlFor="map-search" className="sr-only">Search a place</label>
        <input
          id="map-search"
          className="field"
          placeholder="Search a place, e.g. Ramkund Nashik"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search(e)}
        />
        <button type="button" className="btn-ink shrink-0" onClick={search} disabled={busy}>
          <Search size={18} aria-hidden /> {busy ? 'Searching…' : 'Search'}
        </button>
      </div>
      {results.length > 0 && (
        <ul className="panel max-h-56 divide-y divide-line overflow-auto">
          {results.map((r) => (
            <li key={r.place_id}>
              <button type="button" className="flex w-full items-start gap-2 p-3 text-left hover:bg-mist" onClick={() => choose(r)}>
                <MapPin size={18} className="mt-0.5 shrink-0 text-kumkum" aria-hidden /> <span className="text-[15px]">{r.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-sm font-semibold text-kumkum">{error}</p>}
      <div ref={boxRef} className="h-72 overflow-hidden rounded-xl border border-line bg-mist" role="application" aria-label="Map: click to place the venue" />
      <p className="text-sm text-ink-soft">
        {value ? `Pinned at ${value.lat}, ${value.lng}. ` : 'Click the map to pin the venue. '}
        Map data © OpenStreetMap. Visitors get an "Open in Google Maps" link.
      </p>
    </div>
  );
}
