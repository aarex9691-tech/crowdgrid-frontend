import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Walking-network map (OpenStreetMap tiles, Leaflet).
 * Lanes are coloured by crowd status and closed lanes are dashed, so the
 * status never depends on colour alone (the legend names each one too).
 */
export const LANE_STYLE = {
  NORMAL: { color: '#8f9bb3', weight: 3, label: 'Normal' },
  BUSY: { color: '#e39b00', weight: 5, label: 'Busy' },
  CROWDED: { color: '#c8102e', weight: 6, label: 'Crowded' },
  CLOSED: { color: '#1b2a4a', weight: 4, dashArray: '2 8', label: 'Closed' },
};
const SAFEST = '#1e7f4f';
const SHORTEST = '#2a78d6';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function RouteLegend({ showRoutes = true }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
      {showRoutes && (
        <>
          <li className="flex items-center gap-1.5"><span className="h-1.5 w-6 rounded-full" style={{ background: SAFEST }} aria-hidden /> Safest route</li>
          <li className="flex items-center gap-1.5"><span className="h-0 w-6 border-t-[3px] border-dashed" style={{ borderColor: SHORTEST }} aria-hidden /> Shortest route</li>
        </>
      )}
      {Object.entries(LANE_STYLE).map(([k, s]) => (
        <li key={k} className="flex items-center gap-1.5">
          <span className="h-0 w-6" style={{ borderTop: `${Math.min(s.weight, 5)}px ${s.dashArray ? 'dotted' : 'solid'} ${s.color}` }} aria-hidden /> {s.label} lane
        </li>
      ))}
    </ul>
  );
}

export default function RouteMap({ nodes, lanes, safest, shortest, fromId, toId, selectedLane, onLaneClick, height = 420 }) {
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const fittedRef = useRef('');
  const clickRef = useRef(onLaneClick);
  useEffect(() => {
    clickRef.current = onLaneClick;
  });

  useEffect(() => {
    if (mapRef.current || !boxRef.current) return undefined;
    const map = L.map(boxRef.current, { scrollWheelZoom: false, zoomSnap: 0.25 }).setView([20.0075, 73.795], 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      fittedRef.current = ''; // a new map must be fitted again
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !nodes?.length) return;
    layer.clearLayers();
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

    // All lanes, coloured by status (click to select in the control room)
    for (const l of lanes || []) {
      const a = byId[l.a];
      const b = byId[l.b];
      const s = LANE_STYLE[l.status] || LANE_STYLE.NORMAL;
      const selected = selectedLane === l.id;
      const line = L.polyline([[a.lat, a.lng], [b.lat, b.lng]], { color: s.color, weight: s.weight + (selected ? 4 : 0), dashArray: s.dashArray, opacity: selected ? 1 : 0.85, lineCap: 'round' });
      const why = l.reasons?.length ? `<br>${l.reasons.map(esc).join('<br>')}` : '';
      line.bindTooltip(`<b>${esc(l.name)}</b> · ${s.label}${why}`, { sticky: true });
      if (clickRef.current) line.on('click', () => clickRef.current(l.id));
      line.addTo(layer);
    }

    // Routes on top: shortest dashed, safest solid with a white casing
    if (shortest && safest && shortest.nodes.join() !== safest.nodes.join()) {
      L.polyline(shortest.coords, { color: SHORTEST, weight: 5, dashArray: '10 10', opacity: 0.95, interactive: false }).addTo(layer);
    }
    if (safest) {
      L.polyline(safest.coords, { color: '#ffffff', weight: 12, opacity: 0.9, interactive: false, lineCap: 'round' }).addTo(layer);
      L.polyline(safest.coords, { color: SAFEST, weight: 7, opacity: 1, interactive: false, lineCap: 'round' }).addTo(layer);
    } else if (shortest) {
      L.polyline(shortest.coords, { color: SHORTEST, weight: 5, dashArray: '10 10', interactive: false }).addTo(layer);
    }

    // Ghats, start and destination
    for (const n of nodes) {
      const isEnd = n.id === fromId || n.id === toId;
      if (n.type !== 'GHAT' && !isEnd) {
        L.circleMarker([n.lat, n.lng], { radius: 3, color: '#4a5878', weight: 1, fillColor: '#ffffff', fillOpacity: 1 }).bindTooltip(esc(n.name)).addTo(layer);
        continue;
      }
      const color = n.id === fromId ? '#1b2a4a' : n.id === toId ? SAFEST : '#2e4a7d';
      L.circleMarker([n.lat, n.lng], { radius: isEnd ? 9 : 6, color: '#ffffff', weight: 3, fillColor: color, fillOpacity: 1 })
        .bindTooltip(`${n.id === fromId ? 'Start: ' : n.id === toId ? 'Ghat: ' : ''}${esc(n.name)}`, { permanent: isEnd, direction: 'top', offset: [0, -8] })
        .addTo(layer);
    }

    // Fit the view once per start / ghat pair (not on every live refresh)
    const key = `${fromId || ''}>${toId || ''}>${safest || shortest ? 'route' : 'all'}`;
    if (fittedRef.current !== key) {
      fittedRef.current = key;
      const pts = safest?.coords || shortest?.coords || nodes.map((n) => [n.lat, n.lng]);
      map.invalidateSize();
      map.fitBounds(L.latLngBounds(pts).pad(0.25), { maxZoom: 17 });
    }
  }, [nodes, lanes, safest, shortest, fromId, toId, selectedLane]);

  return <div ref={boxRef} className="z-0 w-full overflow-hidden rounded-xl border border-line" style={{ height }} role="application" aria-label="Walking map" />;
}
