import { useEffect, useState } from 'react';
import { Baby, Phone, Search, ShieldAlert, Siren, Stethoscope, Upload } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { fmtDateTime } from '../../lib/format';
import Notice from '../../components/Notice';
import useLoginGate from './useLoginGate';

const HELPLINES = [
  { label: 'District disaster control', number: '1077', icon: ShieldAlert },
  { label: 'Medical emergency', number: '108', icon: Stethoscope },
  { label: 'Police', number: '112', icon: Phone },
  { label: 'Child helpline', number: '1098', icon: Baby },
];

const getPosition = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });

function SosBeacon({ event }) {
  const gate = useLoginGate();
  const [state, setState] = useState({ phase: 'idle' });

  const trigger = async () => {
    if (!gate()) return;
    setState({ phase: 'locating' });
    const pos = await getPosition();
    setState({ phase: 'sending', pos });
    try {
      const { data } = await API.post('/sos', { eventId: event._id, ...(pos || {}) });
      setState({ phase: 'sent', pos, incident: data.incident, updated: data.updated });
    } catch (e) {
      setState({ phase: 'error', error: errorMessage(e) });
    }
  };

  const busy = state.phase === 'locating' || state.phase === 'sending';
  return (
    <section className="rounded-3xl border-2 border-kumkum bg-white p-6 text-center" aria-labelledby="sos-title">
      <h2 id="sos-title" className="text-2xl font-bold text-kumkum">Need help right now?</h2>
      <p className="mx-auto mt-1 max-w-md text-ink-soft">Press the button. We send your live location to the police and volunteer control room.</p>
      <button
        type="button"
        onClick={trigger}
        disabled={busy}
        className="mx-auto mt-5 flex h-44 w-44 flex-col items-center justify-center gap-1 rounded-full bg-kumkum text-2xl font-extrabold text-white shadow-[0_0_0_10px_var(--color-kumkum-wash)] transition-transform active:scale-95 disabled:opacity-80"
      >
        <Siren size={44} aria-hidden />
        {busy ? (state.phase === 'locating' ? 'Finding you…' : 'Sending…') : 'SOS'}
      </button>
      <div className="mx-auto mt-5 max-w-md text-left" aria-live="assertive">
        {state.phase === 'sent' && (
          <Notice tone="success">
            {state.updated ? 'Your location was updated on your open alert.' : 'Alert sent to the control room.'}{' '}
            {state.pos ? `Location shared (accurate to about ${state.pos.accuracy} m).` : 'We could not get your GPS location. If you can, call 112 and tell them where you are.'}{' '}
            Stay where you are if it's safe. Press again to update your location.
          </Notice>
        )}
        {state.phase === 'error' && <Notice tone="error">{state.error} Call 112 directly.</Notice>}
      </div>
    </section>
  );
}

function ReportForm({ event, onDone }) {
  const [form, setForm] = useState({ personName: '', age: '', gender: 'UNKNOWN', clothes: '', description: '', lastSeenAt: '', contactPhone: '' });
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const body = new FormData();
    Object.entries({ ...form, kind: 'MISSING', eventId: event._id }).forEach(([k, v]) => v !== '' && body.append(k, v));
    if (photo) body.append('photo', photo);
    try {
      await API.post('/lost-found', body);
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="panel space-y-4 p-5">
      <h3 className="text-xl font-bold">Report a missing person</h3>
      <Notice tone="error">{error}</Notice>
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
        <div>
          <label className="field-label" htmlFor="mp-name">Name</label>
          <input id="mp-name" className="field" value={form.personName} onChange={set('personName')} required />
        </div>
        <div>
          <label className="field-label" htmlFor="mp-age">Age</label>
          <input id="mp-age" type="number" min="0" max="120" className="field" value={form.age} onChange={set('age')} />
        </div>
        <div>
          <label className="field-label" htmlFor="mp-gender">Gender</label>
          <select id="mp-gender" className="field" value={form.gender} onChange={set('gender')}>
            <option value="UNKNOWN">Not sure</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="mp-clothes">Clothes worn</label>
        <input id="mp-clothes" className="field" value={form.clothes} onChange={set('clothes')} placeholder="e.g. white dhoti, orange gamcha" />
      </div>
      <div>
        <label className="field-label" htmlFor="mp-desc">How to recognise them</label>
        <textarea id="mp-desc" rows={2} className="field py-3" value={form.description} onChange={set('description')} placeholder="Height, build, language spoken, anything distinctive" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="mp-last">Last seen at</label>
          <input id="mp-last" className="field" value={form.lastSeenAt} onChange={set('lastSeenAt')} required />
        </div>
        <div>
          <label className="field-label" htmlFor="mp-phone">Your contact number</label>
          <input id="mp-phone" className="field" inputMode="tel" value={form.contactPhone} onChange={set('contactPhone')} placeholder="Defaults to your account number" />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="mp-photo">Photo (optional, up to 3 MB)</label>
        <input id="mp-photo" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-ink-soft file:mr-3 file:min-h-12 file:rounded-xl file:border-0 file:bg-ink file:px-4 file:font-semibold file:text-white" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
      </div>
      <button type="submit" className="btn-primary" disabled={busy}>
        <Upload size={18} aria-hidden /> {busy ? 'Posting…' : 'Post missing person report'}
      </button>
    </form>
  );
}

function LostAndFound({ event }) {
  const { user } = useAuth();
  const gate = useLoginGate();
  const [kind, setKind] = useState('FOUND');
  const [q, setQ] = useState('');
  const [reports, setReports] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [posted, setPosted] = useState(false);

  const load = () =>
    API.get('/lost-found', { params: { eventId: event._id, kind, q: q || undefined } })
      .then(({ data }) => setReports(data))
      .catch(() => setReports([]));

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, q, event._id]);

  const canReportMissing = !user || ['USER', 'SUPER_ADMIN'].includes(user.role);

  return (
    <section aria-labelledby="lf-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="lf-title" className="text-2xl font-bold">Lost &amp; found</h2>
          <p className="text-ink-soft">People found safe are listed by police and volunteers with where they are now.</p>
        </div>
        {canReportMissing && !showForm && (
          <button type="button" className="btn-ghost" onClick={() => gate() && setShowForm(true)}>
            Report a missing person
          </button>
        )}
      </div>

      {posted && <Notice tone="success">Report posted. Police and volunteers can now see it.</Notice>}
      {showForm && <ReportForm event={event} onDone={() => { setShowForm(false); setPosted(true); setKind('MISSING'); load(); }} />}

      <div className="flex flex-wrap gap-2">
        <div className="flex gap-2" role="group" aria-label="Show">
          <button type="button" aria-pressed={kind === 'FOUND'} className={kind === 'FOUND' ? 'btn-ink' : 'btn-ghost'} onClick={() => setKind('FOUND')}>Found persons</button>
          <button type="button" aria-pressed={kind === 'MISSING'} className={kind === 'MISSING' ? 'btn-ink' : 'btn-ghost'} onClick={() => setKind('MISSING')}>Missing reports</button>
        </div>
        <label className="relative min-w-60 flex-1">
          <span className="sr-only">Search by name, clothes or place</span>
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden />
          <input className="field pl-10" placeholder="Search by name, clothes or place" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {reports.map((r) => (
          <li key={r._id} className="panel flex gap-4 p-4">
            {r.photoUrl ? (
              <img src={r.photoUrl} alt={`Photo of ${r.personName || 'person'}`} className="h-24 w-24 shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-mist text-3xl font-bold text-ink-faint" aria-hidden>
                {(r.personName || '?').charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-lg font-bold">{r.personName || 'Name unknown'}</h3>
              <p className="text-ink-soft">{[r.age && `${r.age} yrs`, r.gender !== 'UNKNOWN' && r.gender?.toLowerCase()].filter(Boolean).join(', ')}</p>
              {r.clothes && <p className="text-[15px]">Wearing: {r.clothes}</p>}
              {r.description && <p className="text-[15px] text-ink-soft">{r.description}</p>}
              {r.kind === 'FOUND' && r.currentlyAt && <p className="mt-1 font-semibold text-tulsi">Safe at: {r.currentlyAt}</p>}
              {r.kind === 'MISSING' && r.lastSeenAt && <p className="mt-1 font-semibold">Last seen: {r.lastSeenAt}</p>}
              {r.contactPhone && <a href={`tel:${r.contactPhone}`} className="text-[15px] font-semibold underline">Call {r.contactPhone}</a>}
              <p className="text-sm text-ink-faint">Posted {fmtDateTime(r.createdAt)}</p>
            </div>
          </li>
        ))}
      </ul>
      {reports.length === 0 && <Notice>No {kind === 'FOUND' ? 'found persons' : 'missing reports'} match your search.</Notice>}
    </section>
  );
}

export default function SosTab({ event }) {
  return (
    <div className="space-y-10">
      <SosBeacon event={event} />
      <section aria-labelledby="helplines">
        <h2 id="helplines" className="text-2xl font-bold">Helplines</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {HELPLINES.map((h) => (
            <li key={h.number}>
              <a href={`tel:${h.number}`} className="panel flex min-h-24 flex-col justify-center gap-1 p-4 hover:border-kumkum">
                <h.icon size={22} className="text-kumkum" aria-hidden />
                <span className="text-2xl font-extrabold">{h.number}</span>
                <span className="text-[15px] text-ink-soft">{h.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
      <LostAndFound event={event} />
    </div>
  );
}
