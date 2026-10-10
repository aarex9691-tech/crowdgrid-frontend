import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API, { errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { addDaysIST, DOMAIN_LABELS, fmtDate, todayIST } from '../../lib/format';
import Notice from '../../components/Notice';
import useLoginGate from './useLoginGate';

const DOMAIN_HELP = {
  CROWD_CONTROL: 'Guide queues at ghats and gates',
  LANGAR_SERVING: 'Cook, serve and clean at kitchens',
  SENIOR_ESCORT: 'Help elderly pilgrims move safely',
  FIRST_AID: 'Support medical tents (training needed)',
};

const STATUS = {
  PENDING: { cls: 'pill-low', text: 'Waiting for the trust to approve' },
  APPROVED: { cls: 'pill-ok', text: 'Approved' },
  REJECTED: { cls: 'pill-out', text: 'Not approved' },
};

export default function SevaTab({ event }) {
  const { user, refresh } = useAuth();
  const gate = useLoginGate();
  const [providers, setProviders] = useState([]);
  const [existing, setExisting] = useState(undefined);
  const [form, setForm] = useState({ domain: 'CROWD_CONTROL', providerId: '', sector: '', dates: [], note: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    API.get('/providers/verified', { params: { eventId: event._id } }).then(({ data }) => setProviders(data)).catch(() => {});
  }, [event._id]);

  useEffect(() => {
    if (!user) return setExisting(null);
    API.get('/volunteer/mine')
      .then(({ data }) => setExisting(data.find((a) => (a.eventId?._id || a.eventId) === event._id) || null))
      .catch(() => setExisting(null));
  }, [user, event._id]);

  const days = Array.from({ length: 7 }, (_, i) => addDaysIST(todayIST(), i));
  const toggleDay = (d) => setForm((f) => ({ ...f, dates: f.dates.includes(d) ? f.dates.filter((x) => x !== d) : [...f.dates, d] }));

  const submit = async (e) => {
    e.preventDefault();
    if (!gate()) return;
    setError('');
    if (!form.dates.length) return setError('Pick at least one day you can serve');
    setBusy(true);
    try {
      const { data } = await API.post('/volunteer/apply', { ...form, eventId: event._id, providerId: form.providerId || undefined });
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
      <div className="panel mx-auto max-w-lg space-y-3 p-6">
        <h2 className="text-2xl font-bold">Your seva application</h2>
        <span className={s.cls}>{s.text}</span>
        <p>
          {DOMAIN_LABELS[existing.domain]}
          {existing.providerId?.name ? ` with ${existing.providerId.name}` : ''}
          {existing.sector ? `, ${existing.sector}` : ''}
        </p>
        {existing.status === 'APPROVED' && (
          <p>
            Your Volunteer Digital ID is in your <Link to="/passbook" className="font-semibold underline">passbook</Link>. Log out and back in to open the scanner.
          </p>
        )}
        {existing.status === 'PENDING' && <p className="text-ink-soft">The trust will review it. Check back here for your volunteer ID.</p>}
      </div>
    );
  }

  if (user && user.role !== 'USER') {
    return <Notice>Seva applications are for pilgrim accounts. Staff accounts are already registered with their organisation.</Notice>;
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Join field seva</h2>
        <p className="text-ink-soft">Choose how you'd like to help. Once a trust approves you, you get a digital volunteer ID.</p>
      </div>
      <Notice tone="error">{error}</Notice>

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

      <div>
        <label htmlFor="note" className="field-label">Anything the trust should know (optional)</label>
        <textarea id="note" rows={3} className="field py-3" maxLength={500} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </div>

      <button type="submit" className="btn-primary text-lg" disabled={busy || existing === undefined}>
        {busy ? 'Sending…' : 'Apply for seva badge'}
      </button>
    </form>
  );
}
