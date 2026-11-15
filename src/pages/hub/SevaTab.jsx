import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import API, { errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { DOMAIN_LABELS, fmtDate, nextYatraDays } from '../../lib/format';
import Notice from '../../components/Notice';
import useLoginGate from './useLoginGate';

const DOMAIN_HELP = {
  CROWD_CONTROL: 'Guide queues at ghats and gates',
  LANGAR_SERVING: 'Cook, serve and clean at kitchens',
  SENIOR_ESCORT: 'Help elderly pilgrims move safely',
  FIRST_AID: 'Support medical tents (training needed)',
};

// The photo ID a volunteer will show; only the last 4 characters are sent
const ID_TYPES = [
  ['AADHAAR', 'Aadhaar (masked copy)'],
  ['VOTER', 'Voter ID'],
  ['DL', 'Driving licence'],
  ['PAN', 'PAN card'],
  ['PASSPORT', 'Passport'],
  ['COLLEGE', 'College ID'],
];
const MAX_ID_BYTES = 2 * 1024 * 1024;

const STATUS = {
  PENDING: { cls: 'pill-low', text: 'Waiting for the District Control Room' },
  APPROVED: { cls: 'pill-ok', text: 'Approved' },
  REJECTED: { cls: 'pill-out', text: 'Not approved' },
};

export default function SevaTab({ event }) {
  const { user, refresh } = useAuth();
  const gate = useLoginGate();
  const [providers, setProviders] = useState([]);
  const [existing, setExisting] = useState(undefined);
  const [form, setForm] = useState({ domain: 'CROWD_CONTROL', providerId: '', sector: '', dates: [], note: '', idType: '', idLast4: '' });
  const [idCard, setIdCard] = useState(null);
  // keyboard and screen-reader users are taken to an error (shown at the top of a long form)
  // and, after sending, to the application summary that replaces the form
  const errorRef = useRef(null);
  const summaryRef = useRef(null);
  const justSent = useRef(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  useEffect(() => {
    API.get('/providers/verified', { params: { eventId: event._id } }).then(({ data }) => setProviders(data)).catch(() => {});
  }, [event._id]);

  useEffect(() => {
    if (!user) return setExisting(null);
    API.get('/volunteer/mine')
      .then(({ data }) => setExisting(data.find((a) => (a.eventId?._id || a.eventId) === event._id) || null))
      .catch(() => setExisting(null));
  }, [user, event._id]);

  const days = nextYatraDays(event, 7); // the next 7 days of the yatra (from day 1 if it has not started)
  const toggleDay = (d) => setForm((f) => ({ ...f, dates: f.dates.includes(d) ? f.dates.filter((x) => x !== d) : [...f.dates, d] }));

  const submit = async (e) => {
    e.preventDefault();
    if (!gate()) return;
    setError('');
    if (!form.dates.length) return setError('Pick at least one day you can serve');
    if (!form.idType) return setError('Choose the ID you will show');
    if (!/^[A-Za-z0-9]{4}$/.test(form.idLast4.trim())) return setError('Enter only the last 4 characters of your ID number');
    if (!idCard) return setError('Add a photo of your ID card');
    if (idCard.size > MAX_ID_BYTES) return setError('The ID photo is too large. Use a file under 2 MB.');
    setBusy(true);
    try {
      const body = new FormData();
      body.append('eventId', event._id);
      body.append('eventSlug', event.slug || ''); // finds the yatra even if this page has an old id
      body.append('domain', form.domain);
      if (form.providerId) body.append('providerId', form.providerId);
      if (form.sector) body.append('sector', form.sector);
      body.append('dates', form.dates.join(','));
      if (form.note.trim()) body.append('note', form.note.trim());
      body.append('idType', form.idType);
      body.append('idLast4', form.idLast4.trim());
      body.append('idCard', idCard);
      const { data } = await API.post('/volunteer/apply', body);
      justSent.current = true;
      setExisting({ ...data, providerId: providers.find((p) => p._id === data.providerId) });
      refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (existing) {
    const s = STATUS[existing.status];
    return (
      <div className="panel max-w-lg space-y-3 p-6">
        <h2
          ref={(el) => {
            summaryRef.current = el;
            if (el && justSent.current) {
              justSent.current = false;
              el.focus();
            }
          }}
          tabIndex={-1}
          className="text-2xl font-bold focus:outline-none"
        >
          Your seva application
        </h2>
        <span className={s.cls}>{s.text}</span>
        <p>
          {DOMAIN_LABELS[existing.domain]}
          {existing.providerId?.name ? ` with ${existing.providerId.name}` : ''}
          {existing.sector ? `, ${existing.sector}` : ''}
        </p>
        {existing.status === 'APPROVED' && (
          <>
            <p>
              Your Volunteer Digital ID is in your <Link to="/passbook" className="font-semibold underline">passbook</Link>. Log out and back in to open your duties.
            </p>
            {existing.idVerifiedAt ? (
              <p className="pill-ok">ID card checked: you can start your duties</p>
            ) : (
              <Notice>Before your first duty, take the ID card you registered with to the District Control Room desk. An officer scans your volunteer ID and checks the card; then you can check in.</Notice>
            )}
          </>
        )}
        {existing.status === 'PENDING' && <p className="text-ink-soft">The District Control Room checks your ID and approves volunteers. Check back here for your volunteer ID.</p>}
        {existing.status === 'REJECTED' && existing.rejectionReason && <p><b>Reason:</b> {existing.rejectionReason}</p>}
      </div>
    );
  }

  if (user && user.role !== 'USER') {
    return <Notice>Seva applications are for pilgrim accounts. Staff accounts are already registered with their organisation.</Notice>;
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Join field seva</h2>
        <p className="text-ink-soft">Choose how you'd like to help. The District Control Room checks your ID and approves you; then you get a digital volunteer ID.</p>
      </div>
      <div ref={errorRef} tabIndex={-1} className="focus:outline-none">
        <Notice tone="error">{error}</Notice>
      </div>

      <fieldset>
        <legend className="field-label">Seva domain</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(DOMAIN_LABELS).map(([k, v]) => (
            <label key={k} className={`flex min-h-16 cursor-pointer items-start gap-3 rounded-xl border p-3 ${form.domain === k ? 'border-marigold bg-marigold-wash' : 'border-line bg-white'}`}>
              <input type="radio" name="domain" value={k} checked={form.domain === k} onChange={() => setForm({ ...form, domain: k })} className="mt-1.5 h-4 w-4 accent-ink" />
              <span>
                <span className="font-semibold">{v}</span>
                <span className="block text-sm text-ink-soft">{DOMAIN_HELP[k]}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="trust" className="field-label">Serve with</label>
          <select id="trust" className="field" value={form.providerId} onChange={(e) => setForm({ ...form, providerId: e.target.value })}>
            <option value="">Any trust that needs help</option>
            {providers.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="seva-sector" className="field-label">Preferred sector</label>
          <select id="seva-sector" className="field" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })}>
            <option value="">Anywhere</option>
            {(event.sectors || []).map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="field-label">Days you can serve</legend>
        <div className="flex flex-wrap gap-2">
          {days.map((d) => (
            <button key={d} type="button" aria-pressed={form.dates.includes(d)} onClick={() => toggleDay(d)} className={form.dates.includes(d) ? 'btn-ink' : 'btn-ghost'}>
              {fmtDate(d, { year: undefined, weekday: 'short' })}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="panel space-y-3 p-4" data-no-translate>
        <legend className="px-1 font-bold">Your photo ID</legend>
        <p className="text-[15px] text-ink-soft">
          Every volunteer is verified. We keep only the last 4 characters of the number. For Aadhaar, upload the masked Aadhaar from the UIDAI website. Bring the same card to the control room before your first duty.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="id-type" className="field-label">ID you will show</label>
            <select id="id-type" className="field" value={form.idType} onChange={(e) => setForm({ ...form, idType: e.target.value })}>
              <option value="">Choose…</option>
              {ID_TYPES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="id-last4" className="field-label">Last 4 characters of the number</label>
            <input id="id-last4" className="field font-mono uppercase tracking-widest" inputMode="text" autoComplete="off" maxLength={4} value={form.idLast4} onChange={(e) => setForm({ ...form, idLast4: e.target.value.replace(/[^A-Za-z0-9]/g, '') })} placeholder="e.g. 4821" />
          </div>
        </div>
        <div>
          <label htmlFor="id-card" className="field-label">Photo of the ID card <span className="font-normal text-ink-soft">(photo or PDF, under 2 MB)</span></label>
          <input id="id-card" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="field py-2" onChange={(e) => setIdCard(e.target.files?.[0] || null)} />
        </div>
      </fieldset>

      <div>
        <label htmlFor="note" className="field-label">Anything the control room should know (optional)</label>
        <textarea id="note" rows={3} className="field py-3" maxLength={500} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </div>

      <button type="submit" className="btn-primary text-lg" disabled={busy || existing === undefined}>
        {busy ? 'Sending…' : 'Apply for seva badge'}
      </button>
    </form>
  );
}
