import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Crosshair, Footprints, Info, ShieldCheck, Waves } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { LiveBadge, useLive } from '../../lib/realtime';
import Notice, { Loading } from '../../components/Notice';
import RouteMap, { LANE_STYLE, RouteLegend } from '../../components/RouteMap';

const TYPE_LABEL = { CAMP: 'Camps', KITCHEN: 'Kitchens', BUS: 'Bus and shuttle stops', TEMPLE: 'Temples' };
const km = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`);

function StatusChip({ status }) {
  const tone = { NORMAL: 'pill-quiet', BUSY: 'pill-low', CROWDED: 'pill-out', CLOSED: 'pill bg-ink text-white' }[status];
  return <span className={`${tone} text-xs`}>{LANE_STYLE[status].label}</span>;
}

function RouteCard({ title, icon: Icon, route, tone, note }) {
  return (
    <div className={`rounded-2xl border-2 p-4 ${tone}`}>
      <p className="flex items-center gap-2 font-bold"><Icon size={18} aria-hidden /> {title}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums">
        {route.minutes} min <span className="text-base font-semibold text-ink-soft">· {km(route.distanceM)}</span>
      </p>
      <p className="text-sm text-ink-soft">
        {route.busyLanes === 0 ? 'No busy or crowded lanes' : `${route.busyLanes} busy or crowded ${route.busyLanes === 1 ? 'lane' : 'lanes'}`}
        {note ? ` · ${note}` : ''}
      </p>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer font-semibold">Step by step ({route.lanes.length} lanes)</summary>
        <ol className="mt-2 space-y-1">
          {route.lanes.map((l, i) => (
            <li key={l.id} className="flex items-start justify-between gap-2">
              <span>{i + 1}. {l.name} <span className="text-ink-soft">({l.lengthM} m)</span></span>
              <StatusChip status={l.status} />
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}

/** Safest walking route to a ghat: avoids crowded and closed lanes, updates live. */
export default function RouteTab({ event }) {
  const [net, setNet] = useState(null);
  const [from, setFrom] = useState('tent-city-a');
  const [to, setTo] = useState('ramkund');
  const [here, setHere] = useState(null); // { lat, lng } when "use my location" is on
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [changed, setChanged] = useState(false);
  const lastRoute = useRef('');

  const loadNetwork = useCallback(
    () =>
      API.get('/route/network', { params: { eventId: event._id } })
        .then(({ data }) => setNet(data))
        .catch((e) => setError(errorMessage(e))),
    [event._id]
  );

  const replan = useCallback(
    (quiet) => {
      const params = here ? { eventId: event._id, from: 'here', lat: here.lat, lng: here.lng, to } : { eventId: event._id, from, to };
      return API.get('/route/plan', { params })
        .then(({ data }) => {
          const key = data.safest ? data.safest.nodes.join() : 'none';
          if (quiet && lastRoute.current && key !== lastRoute.current) setChanged(true);
          lastRoute.current = key;
          setPlan(data);
          setError('');
        })
        .catch((e) => setError(errorMessage(e)));
    },
    [event._id, from, to, here]
  );

  useEffect(() => {
    loadNetwork();
  }, [loadNetwork]);
  useEffect(() => {
    setChanged(false);
    replan(false);
  }, [replan]);
  // Lane closed or crowd alert raised: re-plan by itself
  useLive('route', () => {
    loadNetwork();
    replan(true);
  }, { wait: 3000 });

  const starts = useMemo(() => {
    if (!net) return [];
    const groups = {};
    net.nodes.filter((n) => n.start).forEach((n) => (groups[n.type] ||= []).push(n));
    return Object.entries(groups);
  }, [net]);
  const ghats = net ? net.nodes.filter((n) => n.type === 'GHAT') : [];

  const locateMe = () => {
    if (!navigator.geolocation) return setError('This browser cannot share your location. Choose a starting point instead.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setHere({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        setError('Location permission was not given. Choose a starting point instead.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (!net && !error) return <Loading label="Loading the walking map" />;
  if (!net) return <Notice tone="error">{error}</Notice>;

  const startId = plan?.from?.id || from;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-bold">Walk to a ghat <LiveBadge /></h2>
          <p className="text-ink-soft">The safest route avoids crowded and closed lanes, even if it is a little longer.</p>
        </div>
      </div>

      <div className="panel grid gap-4 p-4">
        <div>
          <label htmlFor="rt-from" className="field-label">Starting from</label>
          <div className="flex flex-wrap gap-2">
            <select
              id="rt-from"
              className="field min-w-0 basis-full sm:max-w-md sm:basis-0 sm:flex-1"
              value={here ? 'here' : from}
              onChange={(e) => {
                if (e.target.value === 'here') return locateMe();
                setHere(null);
                setFrom(e.target.value);
              }}
            >
              {here && <option value="here">My location</option>}
              {starts.map(([type, list]) => (
                <optgroup key={type} label={TYPE_LABEL[type] || type}>
                  {list.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                </optgroup>
              ))}
            </select>
            <button type="button" className="btn-ghost" onClick={locateMe} disabled={locating}>
              <Crosshair size={18} aria-hidden /> {locating ? 'Finding you…' : 'Use my location'}
            </button>
          </div>
          {here && plan?.from && <p className="mt-1 text-sm text-ink-soft">Starting from the nearest point: {plan.from.name} ({plan.from.snappedM} m from you)</p>}
        </div>
        <div>
          <span className="field-label" id="rt-to">Ghat</span>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="rt-to">
            {ghats.map((g) => (
              <button key={g.id} type="button" aria-pressed={to === g.id} className={`flex min-h-12 items-center gap-1.5 rounded-xl px-3 font-semibold ${to === g.id ? 'bg-ink text-white' : 'border border-line bg-white text-ink-soft hover:text-ink'}`} onClick={() => setTo(g.id)}>
                <Waves size={16} aria-hidden /> {g.name.replace(', Tapovan', '')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Notice tone="error">{error}</Notice>
      {changed && (
        <Notice tone="warning">
          Conditions changed on the way, so your safest route has been updated.{' '}
          <button type="button" className="font-bold underline" onClick={() => setChanged(false)}>OK</button>
        </Notice>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-2">
          <RouteMap nodes={net.nodes} lanes={net.lanes} safest={plan?.safest} shortest={plan?.shortest} fromId={startId} toId={to} height={460} />
          <RouteLegend />
        </div>

        <div className="space-y-3">
          {!plan ? (
            <Loading label="Finding the safest way" />
          ) : !plan.reachable ? (
            <Notice tone="error">No open route to {plan.to.name} right now: lanes on the way are closed. Ask the nearest volunteer or choose another ghat.</Notice>
          ) : (
            <>
              <RouteCard title="Safest route (recommended)" icon={ShieldCheck} route={plan.safest} tone="border-tulsi bg-tulsi-wash/40" note={plan.same ? 'also the shortest' : ''} />
              {plan.avoided.length > 0 && (
                <p className="flex items-start gap-2 rounded-xl bg-marigold-wash p-3 text-sm">
                  <Info size={16} className="mt-0.5 flex-none" aria-hidden />
                  <span>Avoids {plan.avoided.map((l) => `${l.name} (${LANE_STYLE[l.status].label.toLowerCase()})`).join(', ')}.</span>
                </p>
              )}
              {!plan.same && <RouteCard title="Shortest route" icon={Footprints} route={plan.shortest} tone="border-line bg-white" />}
              <details className="panel p-3 text-sm">
                <summary className="flex cursor-pointer items-center gap-2 font-semibold"><Clock size={16} aria-hidden /> How the route was worked out</summary>
                <p className="mt-2 text-ink-soft">
                  The walking map has {plan.algorithms.graph.junctions} junctions and {plan.algorithms.graph.lanes} lanes. Each lane costs its length,
                  multiplied by 1.6 when busy and 4 when crowded; closed lanes are left out. Walking speed drops on busy and crowded lanes.
                </p>
                <ul className="mt-2 space-y-1">
                  <li>Dijkstra's algorithm checked <b>{plan.algorithms.dijkstra.visited}</b> junctions.</li>
                  <li>A* search (guided by straight-line distance) checked <b>{plan.algorithms.astar.visited}</b> junctions.</li>
                  <li>{plan.algorithms.sameCost ? 'Both found the same best route.' : 'The two searches disagreed (please report this).'}</li>
                </ul>
              </details>
            </>
          )}
          <p className="text-xs text-ink-soft">Simplified walking map of Panchavati for the demo. Follow volunteers and police barricades on the ground.</p>
        </div>
      </div>
    </div>
  );
}
