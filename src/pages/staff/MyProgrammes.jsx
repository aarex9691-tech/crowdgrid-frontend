import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarHeart, Users } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { fmtDate, fmtDateTime } from '../../lib/format';
import PageTitle from '../../components/PageTitle';
import Notice, { Loading } from '../../components/Notice';
import { PROGRAMME_TYPES } from '../hub/ProgrammesTab';

/*
 * Programmes for pilgrims, for the organisation holding them: ask to hold one at a yatra (the
 * yatra's District Control Room approves), follow the decision, and see who reserved a place.
 * Kitchen services can ask only at yatras they are approved for; approved event hosts at any yatra.
 */

const STATUS = {
  PENDING: ['pill-low', 'Waiting for the District Control Room'],
  APPROVED: ['pill-ok', 'Approved: shown to pilgrims'],
  REJECTED: ['pill-out', 'Not approved'],
};
const EMPTY = { eventId: '', title: '', type: 'BHANDARA', date: '', startTime: '12:00', endTime: '14:00', venue: '', sector: '', capacity: '', description: '' };

function Attendees({ id, title }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    API.get(`/programmes/${id}/attendees`)
      .then(({ data }) => setRows(data))
      .catch((e) => setError(errorMessage(e)));
  }, [id]);
  if (error) return <Notice tone="error">{error}</Notice>;
  if (!rows) return <Loading label="Loading registrations" />;
  if (!rows.length) return <Notice>Nobody has reserved a place yet.</Notice>;
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white" data-no-translate>
      <table className="w-full min-w-[480px] text-left text-[15px]">
        <caption className="sr-only">People registered for {title}</caption>
        <thead className="bg-mist text-ink-soft">
          <tr>
            <th scope="col" className="px-4 py-2 font-semibold">Name</th>
            <th scope="col" className="px-4 py-2 font-semibold">Mobile</th>
            <th scope="col" className="px-4 py-2 text-right font-semibold">People</th>
            <th scope="col" className="px-4 py-2 font-semibold">Reserved</th>
            <th scope="col" className="px-4 py-2 font-semibold">At the gate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r._id}>
              <td className="px-4 py-2 font-medium">{r.name}</td>
              <td className="px-4 py-2 tabular-nums">{r.phone}</td>
              <td className="px-4 py-2 text-right tabular-nums">{r.people}</td>
              <td className="px-4 py-2 text-ink-soft">{fmtDateTime(r.bookedAt)}</td>
              <td className="px-4 py-2">{r.status === 'CHECKED_IN' ? <span className="pill-ok">Checked in</span> : r.status === 'CANCELLED' ? <span className="pill-out">Cancelled</span> : <span className="pill-quiet">Not yet</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Mine({ p }) {
  const [open, setOpen] = useState(false);
  const [cls, text] = STATUS[p.status];
  return (
    <li className="panel space-y-2 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-terracotta-dark">{PROGRAMME_TYPES[p.type]}</p>
          <h3 className="text-lg font-bold">{p.title}</h3>
          <p className="text-ink-soft">{p.eventId?.title}: {fmtDate(`${p.date}T12:00:00+05:30`, { weekday: 'short' })}, {p.startTime} to {p.endTime}, {p.venue}</p>
        </div>
        <span className={cls}>{text}</span>
      </div>
      {p.status === 'REJECTED' && p.rejectionReason && <p className="text-[15px]"><b>Reason:</b> {p.rejectionReason}</p>}
      {p.status === 'APPROVED' && (
        <>
          <p className="text-[15px]"><b className="tabular-nums">{p.registered}</b> of {p.capacity} places reserved</p>
          <button type="button" className={open ? 'btn-ink' : 'btn-ghost'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <Users size={18} aria-hidden /> Who registered<span className="sr-only"> for {p.title}</span>
          </button>
          {open && <Attendees id={p._id} title={p.title} />}
        </>
      )}
    </li>
  );
}

function AskForm({ yatras, onSent }) {
  const [form, setForm] = useState({ ...EMPTY, eventId: yatras[0]?._id || '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const put = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await API.post('/programmes', { ...form, capacity: Number(form.capacity) });
      setForm({ ...EMPTY, eventId: form.eventId });
      onSent();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="panel grid gap-3 p-5 sm:grid-cols-2" noValidate>
      <h2 className="text-2xl font-bold sm:col-span-2">Ask to hold a programme</h2>
      <p className="text-ink-soft sm:col-span-2">The yatra's District Control Room checks the place and time against the crowd plan. Once approved, pilgrims can reserve free places.</p>
      <div>
        <label className="field-label" htmlFor="pg-yatra">Yatra</label>
        <select id="pg-yatra" className="field" value={form.eventId} onChange={put('eventId')}>
          {yatras.map((y) => <option key={y._id} value={y._id}>{y.title}</option>)}
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor="pg-type">Kind of programme</label>
        <select id="pg-type" className="field" value={form.type} onChange={put('type')}>
          {Object.entries(PROGRAMME_TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="pg-title">Title</label>
        <input id="pg-title" className="field" maxLength={100} value={form.title} onChange={put('title')} placeholder="e.g. Maha Bhandara at Tapovan" />
      </div>
      <div>
        <label className="field-label" htmlFor="pg-date">Day</label>
        <input id="pg-date" type="date" className="field" value={form.date} onChange={put('date')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label" htmlFor="pg-from">Starts</label>
          <input id="pg-from" type="time" className="field" value={form.startTime} onChange={put('startTime')} />
        </div>
        <div>
          <label className="field-label" htmlFor="pg-to">Ends</label>
          <input id="pg-to" type="time" className="field" value={form.endTime} onChange={put('endTime')} />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="pg-venue">Place</label>
        <input id="pg-venue" className="field" maxLength={120} value={form.venue} onChange={put('venue')} placeholder="e.g. Langar ground, Tapovan" />
      </div>
      <div>
        <label className="field-label" htmlFor="pg-sector">Sector <span className="font-normal text-ink-soft">(optional)</span></label>
        <input id="pg-sector" className="field" maxLength={80} value={form.sector} onChange={put('sector')} placeholder="e.g. Sector 2 - Tapovan Sadhugram" />
      </div>
      <div>
        <label className="field-label" htmlFor="pg-cap">Free places for pilgrims</label>
        <input id="pg-cap" className="field" inputMode="numeric" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="e.g. 300" />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="pg-about">About it <span className="font-normal text-ink-soft">(optional)</span></label>
        <textarea id="pg-about" rows={2} maxLength={500} className="field py-3" value={form.description} onChange={put('description')} placeholder="What pilgrims will find, what to bring." />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Send to the District Control Room'}</button>
      </div>
      <Notice tone="error" className="sm:col-span-2">{error}</Notice>
    </form>
  );
}

export default function MyProgrammes() {
  const { user } = useAuth();
  const [list, setList] = useState(null);
  const [yatras, setYatras] = useState(null);
  const [error, setError] = useState('');
  const kitchen = user?.role === 'KITCHEN_MANAGER';
  const load = useCallback(() => {
    setError('');
    // kitchens hold programmes only where they are approved; event hosts may ask at any yatra
    const where = kitchen
      ? API.get('/kitchens/yatras').then(({ data }) => data.map((r) => r.eventId).filter(Boolean))
      : API.get('/events', { params: { kind: 'YATRA' } }).then(({ data }) => data);
    Promise.all([API.get('/programmes/mine'), where])
      .then(([m, y]) => {
        setList(m.data);
        setYatras(y);
      })
      .catch((e) => setError(errorMessage(e)));
  }, [kitchen]);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="shell space-y-6 py-6">
      <PageTitle kicker={user?.organisationName || 'Your organisation'} tone="green" title="Programmes for pilgrims" lead="Bhandaras, satsangs, free health camps and bhajan evenings inside a yatra. Each one is approved by that yatra's District Control Room." />
      <Notice tone="error">{error}</Notice>
      {(!list || !yatras) && !error && <Loading />}
      {list && yatras && (
        <>
          {yatras.length ? (
            <AskForm key={yatras.map((y) => y._id).join()} yatras={yatras} onSent={load} />
          ) : (
            <Notice>
              {kitchen ? <>Your kitchen is not approved at any yatra yet. Ask a District Control Room from <Link to="/kitchen" className="font-semibold underline">Kitchens at yatras</Link>.</> : 'No yatra is open right now.'}
            </Notice>
          )}
          <section aria-labelledby="pg-mine" className="space-y-3">
            <h2 id="pg-mine" className="flex items-center gap-2 text-2xl font-bold"><CalendarHeart size={22} aria-hidden /> Your programmes</h2>
            {list.length ? <ul className="space-y-3">{list.map((p) => <Mine key={p._id} p={p} />)}</ul> : <p className="text-ink-soft">None yet.</p>}
          </section>
        </>
      )}
    </div>
  );
}
