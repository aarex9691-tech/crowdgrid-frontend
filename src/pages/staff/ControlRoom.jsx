import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, RefreshCw } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { fmtDateTime, MEAL_LABELS } from '../../lib/format';
import Notice, { Loading } from '../../components/Notice';
import VolunteerReview from './VolunteerReview';

const SOS_STATUS = { OPEN: 'pill-out', ACKNOWLEDGED: 'pill-low', RESOLVED: 'pill-quiet' };

function Stat({ label, value, tone }) {
  return (
    <div className="panel p-4">
      <p className="text-ink-soft">{label}</p>
      <p className={`text-3xl font-extrabold tabular-nums ${tone || ''}`}>{value}</p>
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
    const t = setInterval(load, 10000); // live-ish refresh for the control room
    return () => clearInterval(t);
  }, [load]);

  const setStatus = async (id, status) => {
    try {
      await API.patch(`/sos/${id}`, { status });
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const open = items.filter((i) => i.status !== 'RESOLVED');
  return (
    <section aria-labelledby="sos-q" className="space-y-3">
      <h2 id="sos-q" className="flex items-center gap-2 text-2xl font-bold">
        SOS alerts <span className={open.length ? 'pill-out' : 'pill-quiet'}>{open.length} active</span>
      </h2>
      <p className="text-sm text-ink-soft">Refreshes every 10 seconds.</p>
      <Notice tone="error">{error}</Notice>
      <ul className="space-y-3">
        {items.slice(0, 15).map((i) => (
          <li key={i._id} className={`panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center ${i.status === 'OPEN' ? 'border-kumkum' : ''}`}>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={SOS_STATUS[i.status]}>{i.status.toLowerCase()}</span>
                <span className="font-bold">{i.type.toLowerCase()} alert</span>
                <span className="text-sm text-ink-soft">{fmtDateTime(i.updatedAt)}</span>
              </div>
              <p className="mt-1">
                {i.userId?.name} · <a className="font-semibold underline" href={`tel:${i.userId?.phone}`}>{i.userId?.phone}</a>
              </p>
              {i.message && <p className="text-ink-soft">"{i.message}"</p>}
              {i.location?.lat ? (
                <a className="mt-1 inline-flex items-center gap-1 font-semibold text-dusk underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${i.location.lat},${i.location.lng}`}>
                  <MapPin size={16} aria-hidden /> {i.location.lat.toFixed(5)}, {i.location.lng.toFixed(5)} (±{i.location.accuracy || '?'} m)
                </a>
              ) : (
                <p className="text-sm text-ink-soft">No GPS shared</p>
              )}
            </div>
            <div className="flex gap-2">
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

function ProviderQueue({ onChange }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    API.get('/providers', { params: { status: 'PENDING' } })
      .then(({ data }) => setItems(data))
      .catch((e) => setError(errorMessage(e)));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const decide = async (id, decision) => {
    try {
      await API.post(`/providers/${id}/decision`, { decision, reason: decision === 'REJECTED' ? 'Documents could not be verified' : undefined });
      load();
      onChange();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <section aria-labelledby="ngo-q" className="space-y-3">
      <h2 id="ngo-q" className="text-2xl font-bold">NGO &amp; camp verification</h2>
      <Notice tone="error">{error}</Notice>
      {items.length === 0 ? (
        <Notice>No organisations waiting for verification.</Notice>
      ) : (
        <ul className="space-y-3">
          {items.map((p) => (
            <li key={p._id} className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="text-lg font-bold">{p.name}</p>
                <p className="text-ink-soft">
                  {p.type} · Reg. no. {p.registrationNumber || 'not given'} · {p.eventId?.title}
                </p>
                <p className="text-[15px]">Applicant: {p.adminUserId?.name} ({p.adminUserId?.phone})</p>
                {p.description && <p className="text-[15px] text-ink-soft">{p.description}</p>}
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-ink" onClick={() => decide(p._id, 'VERIFIED')}>Verify</button>
                <button type="button" className="btn-ghost" onClick={() => decide(p._id, 'REJECTED')}>Reject</button>
              </div>
            </li>
          ))}
        </ul>
      )}
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
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

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

  return (
    <div className="shell space-y-8 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">District control room</h1>
          <p className="text-ink-soft">{user.name}</p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label htmlFor="ev" className="field-label">Yatra</label>
            <select id="ev" className="field" value={eventId} onChange={(e) => setEventId(e.target.value)}>
              {events.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
            </select>
          </div>
          <button type="button" className="btn-ghost" onClick={load} aria-label="Refresh"><RefreshCw size={18} /></button>
          {user.role === 'SUPER_ADMIN' && <Link to="/corporate-admin" className="btn-ghost">Corporate events</Link>}
          <Link to="/scan" className="btn-ink">Scanner</Link>
        </div>
      </div>
      <Notice tone="error">{error}</Notice>

      {!data ? (
        <Loading label="Loading city-wide figures" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Bed occupancy" value={`${data.beds.occupancyPct}%`} />
            <Stat label="Beds free" value={data.beds.available.toLocaleString('en-IN')} tone="text-tulsi" />
            <Stat label="Passes scanned today" value={data.scansToday} />
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

      {eventId && <SosQueue eventId={eventId} />}
      <ProviderQueue onChange={load} />
      <VolunteerReview />
      <RecentActivity />
    </div>
  );
}
