import { useT } from '../../lib/i18n';
import { useCallback, useEffect, useState } from 'react';
import { Baby, Flame, HelpCircle, Phone, Search, ShieldAlert, Siren, Stethoscope, Upload, Users } from 'lucide-react';
import API, { assetUrl, errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { fmtDateTime } from '../../lib/format';
import Notice from '../../components/Notice';
import useLoginGate from './useLoginGate';
import { useLive } from '../../lib/realtime';
import { NumberField, TextField } from '../../components/Fields';
import PhoneField from '../../components/PhoneField';
import { firstError, intError, optionalPhoneError, textError } from '../../lib/validate';
import { phoneError } from '../../lib/phone';

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PHOTO_MAX_MB = 3;

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

// What kind of help: the control room sees it straight away
const SOS_TYPES = [
  { id: 'MEDICAL', icon: Stethoscope },
  { id: 'CROWD', icon: Users },
  { id: 'LOST', icon: Search },
  { id: 'FIRE', icon: Flame },
  { id: 'GENERAL', icon: HelpCircle },
];

const timeOf = (d) => (d ? new Date(d).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' }) : '');

/** Live status of the pilgrim's latest alert: Sent -> Seen -> Help on the way -> Resolved */
function MySosCard({ incident, onUpdateLocation, onSafe, busy }) {
  const t = useT();
  const resolved = incident.status === 'RESOLVED';
  const steps = [
    { label: t('sos.step.sent'), done: true, at: incident.createdAt },
    { label: t('sos.step.seen'), done: !!incident.acknowledgedAt || incident.status !== 'OPEN', at: incident.acknowledgedAt },
    { label: incident.assignedTo?.name ? t('sos.step.helper', { name: incident.assignedTo.name }) : t('sos.step.helperWait'), done: !!incident.assignedTo },
    { label: incident.closedByUser ? t('sos.step.safe') : t('sos.step.resolved'), done: resolved, at: incident.resolvedAt },
  ];
  return (
    <div className="rounded-2xl border-2 border-kumkum/30 bg-white p-4 text-left" aria-live="polite">
      <p className="text-sm font-semibold uppercase tracking-wide text-kumkum">{t('sos.my')}</p>
      <p className="text-lg font-bold">
        {t(`sos.type.${incident.type}`)} · {t(`sos.status.${incident.status}`)}
      </p>
      {incident.message && <p className="text-ink-soft">"{incident.message}"</p>}
      <ol className="mt-3 space-y-2">
        {steps.map((st, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${st.done ? 'bg-tulsi' : 'border-2 border-line bg-white'}`} aria-hidden />
            <span className={st.done ? 'font-semibold' : 'text-ink-soft'}>
              {st.label}
              {st.done && st.at ? <span className="font-normal text-ink-soft"> · {timeOf(st.at)}</span> : null}
            </span>
          </li>
        ))}
      </ol>
      {!resolved && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-ghost min-h-11" disabled={busy} onClick={onUpdateLocation}>{t('sos.updateLocation')}</button>
          <button type="button" className="btn-ink min-h-11" disabled={busy} onClick={onSafe}>{t('sos.safe')}</button>
        </div>
      )}
    </div>
  );
}

function SosBeacon({ event }) {
  const gate = useLoginGate();
  const { user } = useAuth();
  const t = useT();
  const [state, setState] = useState({ phase: 'idle' });
  const [type, setType] = useState('MEDICAL');
  const [note, setNote] = useState('');
  const [latest, setLatest] = useState(null);

  // The pilgrim's latest alert (open, or closed in the last hour) stays on screen with its status
  const loadMine = useCallback(() => {
    if (!user) return;
    API.get('/sos/mine')
      .then(({ data }) => {
        const a = data[0];
        const recent = a && (a.status !== 'RESOLVED' || Date.now() - new Date(a.resolvedAt || a.updatedAt) < 3600000);
        setLatest(recent ? a : null);
      })
      .catch(() => {});
  }, [user]);
  useEffect(() => {
    loadMine();
  }, [loadMine]);
  useLive('sos', loadMine, { wait: 500 }); // control room acknowledges / assigns / resolves

  const send = async () => {
    if (!gate()) return;
    setState({ phase: 'locating' });
    const pos = await getPosition();
    setState({ phase: 'sending', pos });
    try {
      const { data } = await API.post('/sos', { eventId: event._id, type, ...(note.trim() ? { message: note.trim() } : {}), ...(pos || {}) });
      setState({ phase: 'sent', pos, updated: data.updated });
      setLatest(data.incident);
      loadMine();
    } catch (e) {
      setState({ phase: 'error', error: errorMessage(e) });
    }
  };

  const safe = async () => {
    if (!latest) return;
    setState({ phase: 'sending' });
    try {
      const { data } = await API.post(`/sos/${latest._id}/safe`);
      setLatest(data);
      setState({ phase: 'idle' });
    } catch (e) {
      setState({ phase: 'error', error: errorMessage(e) });
    }
  };

  const busy = state.phase === 'locating' || state.phase === 'sending';
  const open = latest && latest.status !== 'RESOLVED';
  return (
    <section className="rounded-3xl border-2 border-kumkum bg-white p-6 text-center" aria-labelledby="sos-title">
      <h2 id="sos-title" className="text-2xl font-bold text-kumkum">{t('sos.title')}</h2>
      <p className="mx-auto mt-1 max-w-md text-ink-soft">{t('sos.lead')}</p>

      <fieldset className="mx-auto mt-4 max-w-xl">
        <legend className="mb-2 font-semibold">{t('sos.whatHelp')}</legend>
        <div className="flex flex-wrap justify-center gap-2">
          {SOS_TYPES.map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={type === id}
              onClick={() => setType(id)}
              className={`flex min-h-11 items-center gap-2 rounded-full border-2 px-4 font-semibold ${type === id ? 'border-kumkum bg-kumkum text-white' : 'border-line bg-white text-ink'}`}
            >
              <Icon size={18} aria-hidden /> {t(`sos.type.${id}`)}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="sos-note">{t('sos.notePlaceholder')}</label>
        <input id="sos-note" className="field mt-3" maxLength={300} placeholder={t('sos.notePlaceholder')} value={note} onChange={(e) => setNote(e.target.value)} />
      </fieldset>

      <button
        type="button"
        onClick={send}
        disabled={busy}
        className="mx-auto mt-5 flex h-44 w-44 flex-col items-center justify-center gap-1 rounded-full bg-kumkum text-2xl font-extrabold text-white shadow-[0_0_0_10px_var(--color-kumkum-wash)] transition-transform active:scale-95 disabled:opacity-80"
      >
        <Siren size={44} aria-hidden />
        {busy ? (state.phase === 'locating' ? t('sos.finding') : t('sos.sending')) : open ? t('sos.sendAgain') : 'SOS'}
      </button>
      <div className="mx-auto mt-5 max-w-md space-y-3 text-left" aria-live="assertive">
        {state.phase === 'sent' && (
          <Notice tone="success">
            {state.updated ? t('sos.updated') : t('sos.sent')} {state.pos ? t('sos.located', { m: state.pos.accuracy }) : t('sos.noGps')}
          </Notice>
        )}
        {state.phase === 'error' && <Notice tone="error">{state.error} {t('sos.call112')}</Notice>}
        {latest && <MySosCard incident={latest} busy={busy} onUpdateLocation={send} onSafe={safe} />}
      </div>
    </section>
  );
}

function ReportForm({ event, onDone }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ personName: '', age: '', gender: '', clothes: '', description: '', lastSeenAt: '', contactCountryCode: user?.countryCode || '91', contactPhone: user?.phone || '', personCountryCode: '91', personPhone: '' });
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const put = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const pickPhoto = (file) => {
    setPhotoError('');
    if (!file) return setPhoto(null);
    if (!PHOTO_TYPES.includes(file.type)) { setPhoto(null); return setPhotoError('Choose a photo (JPG or PNG; phone WebP photos also work)'); }
    if (file.size > PHOTO_MAX_MB * 1024 * 1024) { setPhoto(null); return setPhotoError(`Photo is too large (${(file.size / 1048576).toFixed(1)} MB). The limit is ${PHOTO_MAX_MB} MB.`); }
    setPhoto(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setTried(true);
    const problem = firstError(
      textError(form.personName, "Person's name", 'personName', { required: true }),
      intError(form.age, 'Approx. age', { min: 0, max: 120 }),
      !form.gender && 'Choose male or female.',
      textError(form.clothes, 'Clothes worn', 'shortText'),
      textError(form.description, 'How to recognise them', 'longText'),
      textError(form.lastSeenAt, 'Last seen at', 'venue', { required: true }),
      phoneError(form.contactCountryCode, form.contactPhone) && `Your contact number: ${phoneError(form.contactCountryCode, form.contactPhone)}`,
      optionalPhoneError(form.personCountryCode, form.personPhone) && `Their mobile: ${optionalPhoneError(form.personCountryCode, form.personPhone)}`,
      photoError,
    );
    if (problem) return setError(`Please fix the highlighted fields. ${problem}`);
    setBusy(true);
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
    <form onSubmit={submit} noValidate className="panel space-y-4 p-5">
      <h3 className="text-xl font-bold">Report a missing person</h3>
      <Notice tone="error">{error}</Notice>
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
        <TextField id="mp-name" label="Name" rule="personName" required value={form.personName} onChange={put('personName')} showErrors={tried} />
        <NumberField id="mp-age" label="Approx. age" min={0} max={120} value={form.age} onChange={put('age')} showErrors={tried} hint="Years, a guess is fine" />
        <div>
          <label className="field-label" htmlFor="mp-gender">Gender <span className="text-kumkum" aria-hidden>*</span></label>
          <select id="mp-gender" className="field" required value={form.gender} onChange={set('gender')} aria-invalid={tried && !form.gender}>
            <option value="" disabled>Choose</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>
      </div>
      <TextField id="mp-clothes" label="Clothes worn" rule="shortText" value={form.clothes} onChange={put('clothes')} showErrors={tried} placeholder="e.g. white dhoti, orange gamcha" />
      <TextField id="mp-desc" label="How to recognise them" rule="longText" multiline rows={2} value={form.description} onChange={put('description')} showErrors={tried} placeholder="Height, build, language spoken, anything distinctive" />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField id="mp-last" label="Last seen at" rule="venue" required value={form.lastSeenAt} onChange={put('lastSeenAt')} showErrors={tried} placeholder="e.g. Ramkund Ghat, near Gate 2" />
        <PhoneField
          id="mp-phone"
          label="Your contact number"
          required
          showErrors={tried}
          hint="Volunteers call this number when they find them"
          countryCode={form.contactCountryCode}
          phone={form.contactPhone}
          onChange={({ countryCode, phone }) => setForm((f) => ({ ...f, contactCountryCode: countryCode, contactPhone: phone }))}
        />
      </div>
      <PhoneField
        id="mp-person-phone"
        label="Their mobile number"
        required={false}
        showErrors={tried}
        hint="If they carry a phone"
        countryCode={form.personCountryCode}
        phone={form.personPhone}
        onChange={({ countryCode, phone }) => setForm((f) => ({ ...f, personCountryCode: countryCode, personPhone: phone }))}
      />
      <div>
        <label className="field-label" htmlFor="mp-photo">Photo <span className="font-normal text-ink-soft">(optional: a clear phone photo, up to {PHOTO_MAX_MB} MB)</span></label>
        <input id="mp-photo" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-ink-soft file:mr-3 file:min-h-12 file:rounded-xl file:border-0 file:bg-ink file:px-4 file:font-semibold file:text-white" onChange={(e) => pickPhoto(e.target.files?.[0] || null)} aria-describedby="mp-photo-help" />
        <p id="mp-photo-help" className={`mt-1 text-sm ${photoError ? 'font-semibold text-kumkum' : 'text-ink-soft'}`} role={photoError ? 'alert' : undefined}>{photoError || (photo ? `${photo.name} (${(photo.size / 1048576).toFixed(1)} MB)` : 'A clear face photo helps volunteers most')}</p>
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
              <img src={assetUrl(r.photoUrl)} alt={`Photo of ${r.personName || 'person'}`} className="h-24 w-24 shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-mist text-3xl font-bold text-ink-faint" aria-hidden>
                {(r.personName || '?').charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-lg font-bold">{r.personName || 'Name unknown'}</h3>
              <p className="text-ink-soft">{[r.age && `About ${r.age} yrs`, r.gender && r.gender !== 'UNKNOWN' && r.gender !== 'OTHER' && (r.gender === 'MALE' ? 'Male' : 'Female')].filter(Boolean).join(', ')}</p>
              {r.clothes && <p className="text-[15px]">Wearing: {r.clothes}</p>}
              {r.description && <p className="text-[15px] text-ink-soft">{r.description}</p>}
              {r.kind === 'FOUND' && r.currentlyAt && <p className="mt-1 font-semibold text-tulsi">Safe at: {r.currentlyAt}</p>}
              {r.kind === 'MISSING' && r.lastSeenAt && <p className="mt-1 font-semibold">Last seen: {r.lastSeenAt}</p>}
              {r.contactPhone && <a href={`tel:${r.contactPhone}`} className="block text-[15px] font-semibold underline">Call the family: {r.contactPhone}</a>}
              {r.personPhone && <a href={`tel:${r.personPhone}`} className="block text-[15px] font-semibold underline">Call them: {r.personPhone}</a>}
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
