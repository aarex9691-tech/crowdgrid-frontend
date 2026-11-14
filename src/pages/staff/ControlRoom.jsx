import { formatPhone } from '../../lib/phone';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Walking-lane map loads Leaflet, so it is split into its own chunk
const LanePanel = lazy(() => import('./LanePanel'));
import { Armchair, MapPin, RefreshCw } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { fmtDateTime, MEAL_LABELS } from '../../lib/format';
import Notice, { Loading } from '../../components/Notice';
import { LiveBadge, useLive } from '../../lib/realtime';
import PageTitle from '../../components/PageTitle';

const SOS_STATUS = { OPEN: 'pill-out', ACKNOWLEDGED: 'pill-low', RESOLVED: 'pill-quiet' };
const SOS_TYPE_LABEL = { MEDICAL: 'Medical', CROWD: 'Crowd crush', LOST: 'Lost / separated', FIRE: 'Fire or danger', GENERAL: 'General help' };

function Stat({ label, value, tone }) {
  return (
    <div className="cg-stat">
      <p className="cg-stat-label">{label}</p>
      <p className={`cg-stat-value ${tone || ''}`}>{value}</p>
    </div>
  );
}

function SosQueue({ eventId }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    API.get('/sos', { params: { eventId } })
      .then(({ data }) => setItems(data))
      .catch((e) => setError(errorMessage(e)));
  }, [eventId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000); // safety net if the live connection drops
    return () => clearInterval(t);
  }, [load]);
  // New alerts and status changes arrive instantly over the live connection
  useLive('sos', load, { wait: 1000 }); // urgent: kept quick

  const setStatus = async (id, status) => {
    try {
      await API.patch(`/sos/${id}`, { status });
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  // Volunteers that can be sent; assigning also acknowledges the alert (the pilgrim sees their name)
  const [responders, setResponders] = useState([]);
  useEffect(() => {
    API.get('/sos/responders').then(({ data }) => setResponders(data)).catch(() => {});
  }, []);
  const assign = async (incident, volunteerId) => {
    try {
      await API.patch(`/sos/${incident._id}`, { assignedTo: volunteerId || null, ...(incident.status === 'OPEN' && volunteerId ? { status: 'ACKNOWLEDGED' } : {}) });
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const open = items.filter((i) => i.status !== 'RESOLVED');
  return (
    <section aria-labelledby="sos-q" className="space-y-3" data-no-translate>
      <h2 id="sos-q" className="flex items-center gap-2 text-2xl font-bold">
        SOS alerts <span className={open.length ? 'pill-out' : 'pill-quiet'}>{open.length} active</span>
      </h2>
      <p className="flex items-center gap-2 text-sm text-ink-soft"><LiveBadge /> New alerts appear here instantly.</p>
      <Notice tone="error">{error}</Notice>
      <ul className="space-y-3">
        {items.slice(0, 15).map((i) => (
          <li key={i._id} className={`panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center ${i.status === 'OPEN' ? 'border-kumkum' : ''}`}>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={SOS_STATUS[i.status]}>{i.status.toLowerCase()}</span>
                <span className="font-bold">{SOS_TYPE_LABEL[i.type] || i.type.toLowerCase()} alert</span>
                {i.closedByUser && <span className="pill-quiet">pilgrim says safe</span>}
                <span className="text-sm text-ink-soft">{fmtDateTime(i.updatedAt)}</span>
              </div>
              <p className="flex flex-wrap items-center gap-x-3">
                <span>{i.userId?.name}</span>
                <a className="inline-flex min-h-11 items-center font-semibold text-blue underline" href={`tel:+${i.userId?.countryCode || '91'}${i.userId?.phone}`}>{formatPhone(i.userId?.countryCode, i.userId?.phone)}</a>
              </p>
              {i.message && <p className="text-ink-soft">"{i.message}"</p>}
              {i.assignedTo?.name && <p className="text-sm font-semibold">Volunteer: {i.assignedTo.name}</p>}
              {i.location?.lat ? (
                <a className="inline-flex min-h-11 items-center gap-1 font-semibold text-blue underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${i.location.lat},${i.location.lng}`}>
                  <MapPin size={16} aria-hidden /> {i.location.lat.toFixed(5)}, {i.location.lng.toFixed(5)} (±{i.location.accuracy || '?'} m)
                </a>
              ) : (
                <p className="text-sm text-ink-soft">No GPS shared</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {i.status !== 'RESOLVED' && responders.length > 0 && (
                <select
                  className="field min-h-11 w-auto"
                  aria-label="Assign a volunteer"
                  value={i.assignedTo?._id || ''}
                  onChange={(e) => assign(i, e.target.value)}
                >
                  <option value="">Assign volunteer…</option>
                  {responders.map((r) => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
              )}
              {i.status === 'OPEN' && <button type="button" className="btn-ghost" onClick={() => setStatus(i._id, 'ACKNOWLEDGED')}>Acknowledge</button>}
              {i.status !== 'RESOLVED' && <button type="button" className="btn-ink" onClick={() => setStatus(i._id, 'RESOLVED')}>Mark resolved</button>}
            </div>
          </li>
        ))}
      </ul>
      {items.length === 0 && <Notice>No SOS alerts.</Notice>}
    </section>
  );
}

/** What is waiting for a decision, with a link straight to it (the queues live on the Requests page). */
function WaitingRequests() {
  const { user } = useAuth();
  const [counts, setCounts] = useState(null);
  useEffect(() => {
    const asks = [
      API.get('/volunteer/applications', { params: { status: 'PENDING' } }).then(({ data }) => data.length),
      API.get('/volunteer/applications', { params: { status: 'APPROVED' } }).then(({ data }) => data.filter((a) => !a.checks?.idVerified).length),
      API.get('/providers', { params: { status: 'PENDING' } }).then(({ data }) => data.length),
      user.role === 'SUPER_ADMIN' ? API.get('/hosts', { params: { status: 'PENDING' } }).then(({ data }) => data.length) : Promise.resolve(null),
    ];
    Promise.all(asks.map((p) => p.catch(() => null))).then(([volunteers, idChecks, organisations, hosts]) => setCounts({ volunteers, idChecks, organisations, hosts }));
  }, [user.role]);
  if (!counts) return null;
  const rows = [
    ['volunteers', 'Volunteer applications', counts.volunteers],
    ['volunteers', 'ID cards to check in person', counts.idChecks],
    ['organisations', 'NGOs and trusts to verify', counts.organisations],
    ...(counts.hosts != null ? [['hosts', 'Event hosts to verify', counts.hosts]] : []),
  ];
  return (
    <section aria-labelledby="waiting" className="panel p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="waiting" className="text-2xl font-bold">Waiting for you</h2>
        <Link to="/requests" className="font-semibold text-blue underline-offset-4 hover:underline">Open requests</Link>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map(([tab, label, n]) => (
          <li key={label}>
            <Link to={`/requests?tab=${tab}`} className={`block rounded-xl p-3 ring-1 transition-colors hover:bg-mist ${n ? 'bg-marigold-wash ring-marigold' : 'bg-white ring-line'}`}>
              <span className="block text-3xl font-extrabold tabular-nums">{n ?? '-'}</span>
              <span className="text-[15px] text-ink-soft">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecentActivity() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    API.get('/admin/audit', { params: { limit: 25 } })
      .then(({ data }) => setItems(data))
      .catch((e) => setError(errorMessage(e)));
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);
  useLive(['sos', 'beds', 'sales', 'tickets'], load, { wait: 10000 });

  return (
    <section aria-labelledby="audit" className="space-y-3">
      <h2 id="audit" className="text-2xl font-bold">Recent activity</h2>
      <p className="text-sm text-ink-soft">Audit trail of approvals, scans and other sensitive actions. Entries can't be edited.</p>
      <Notice tone="error">{error}</Notice>
      {items.length === 0 ? (
        <Notice>No activity recorded yet.</Notice>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
          {items.map((a) => (
            <li key={a._id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
              <span className="w-36 shrink-0 text-sm text-ink-soft">{fmtDateTime(a.createdAt)}</span>
              <span className="flex-1">{a.summary}</span>
              <span className={a.action.includes('REJECTED') || a.action.includes('LOCKED') ? 'pill-out' : 'pill-quiet'}>
                {a.action.toLowerCase().replace(/_/g, ' ')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Every verified camp in the yatra, each opening its theatre-style tent map. */
function CampMaps({ eventId }) {
  const [camps, setCamps] = useState(null);
  const load = useCallback(() => {
    API.get('/lodgings', { params: { eventId } })
      .then(({ data }) => setCamps(data))
      .catch(() => setCamps([]));
  }, [eventId]);
  useEffect(() => {
    load();
  }, [load]);
  useLive('beds', load);
  if (!camps || camps.length === 0) return null;
  return (
    <section aria-labelledby="maps" className="panel p-5">
      <h2 id="maps" className="flex items-center gap-2 text-2xl font-bold"><Armchair size={22} aria-hidden /> Tent maps</h2>
      <p className="text-ink-soft">Open a camp to see every tent and bed, like seats in a theatre.</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {camps.map((c) => {
          const pct = c.totalBeds ? Math.round(((c.totalBeds - c.availableBeds) / c.totalBeds) * 100) : 0;
          return (
            <li key={c._id}>
              <Link to={`/camps/${c._id}/map`} className="flex items-center gap-3 rounded-xl border border-line p-3 hover:border-ink-faint">
                <div className="flex-1">
                  <p className="font-bold">{c.name}</p>
                  <p className="text-sm text-ink-soft">{c.sector} · {c.availableBeds} of {c.totalBeds} free</p>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-mist" aria-hidden>
                    <div className={`h-full rounded-full ${pct >= 90 ? 'bg-kumkum' : pct >= 70 ? 'bg-marigold' : 'bg-tulsi'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="text-sm font-semibold underline">Open map</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function ControlRoom() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/events', { params: { kind: 'YATRA' } }).then(({ data: list }) => {
      setEvents(list);
      setEventId((list.find((e) => e.isFlagship) || list[0])?._id || '');
    });
  }, []);

  const load = useCallback(() => {
    if (!eventId) return;
    API.get('/admin/overview', { params: { eventId } })
      .then(({ data: d }) => setData(d))
      .catch((e) => setError(errorMessage(e)));
  }, [eventId]);
  useEffect(() => {
    load();
  }, [load]);
  // Occupancy, scans, meals and SOS counters follow what happens on the ground
  useLive(['beds', 'meals', 'scan', 'sos', 'passes'], load);

  return (
    <div className="shell space-y-8 py-6">
      <div className="cg-pagehead">
        <PageTitle kicker={user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'District Control Room'} tone="blue" title={<>Control room <LiveBadge /></>} lead={user.name} />
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="ev" className="field-label">Event</label>
            <select id="ev" className="field" value={eventId} onChange={(e) => setEventId(e.target.value)}>
              {events.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
            </select>
          </div>
          <button type="button" className="btn-ghost" onClick={load} aria-label="Refresh"><RefreshCw size={18} /></button>
        </div>
      </div>
      <Notice tone="error">{error}</Notice>
      <WaitingRequests />

      {!data ? (
        <Loading label="Loading city-wide figures" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Bed occupancy" value={`${data.beds.occupancyPct}%`} />
            <Stat label="Beds free" value={data.beds.available.toLocaleString('en-IN')} tone="text-tulsi" />
            <Stat label="Passes scanned today" value={Number(data.scansToday || 0).toLocaleString('en-IN')} />
            <Stat label="Active SOS" value={data.alerts.openSos} tone={data.alerts.openSos ? 'text-kumkum' : ''} />
          </div>

          <section aria-labelledby="occ" className="panel p-5">
            <h2 id="occ" className="text-2xl font-bold">Occupancy by sector</h2>
            <ul className="mt-4 space-y-3">
              {data.sectors.map((s) => (
                <li key={s.sector}>
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-semibold">{s.sector}</span>
                    <span className="tabular-nums text-ink-soft">
                      {(s.totalBeds - s.availableBeds).toLocaleString('en-IN')} / {s.totalBeds.toLocaleString('en-IN')} beds · {s.camps} {s.camps === 1 ? 'camp' : 'camps'}
                    </span>
                  </div>
                  <div className="mt-1 h-3 overflow-hidden rounded-full bg-mist" role="img" aria-label={`${s.occupancyPct}% occupied`}>
                    <div className={`h-full rounded-full ${s.occupancyPct >= 90 ? 'bg-kumkum' : s.occupancyPct >= 70 ? 'bg-marigold' : 'bg-tulsi'}`} style={{ width: `${s.occupancyPct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {data.meals.map((m) => (
                <div key={m.meal} className="rounded-xl bg-mist p-3">
                  <p className="text-ink-soft">{MEAL_LABELS[m.meal]} tokens today</p>
                  <p className="text-xl font-bold tabular-nums">
                    {m.issued.toLocaleString('en-IN')} <span className="text-base font-normal text-ink-soft">of {m.capacity.toLocaleString('en-IN')}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {eventId && <CampMaps eventId={eventId} />}
      {eventId && <Suspense fallback={null}><LanePanel eventId={eventId} /></Suspense>}
      {eventId && <SosQueue eventId={eventId} />}
      <RecentActivity />
    </div>
  );
}
