import { useCallback, useEffect, useRef, useState } from 'react';
import { ChefHat, Plus } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { fmtDate } from '../../lib/format';
import PageTitle from '../../components/PageTitle';
import Notice, { Loading } from '../../components/Notice';

/*
 * Kitchen Manager: the yatras its kitchen service is approved for (by each yatra's District Control
 * Room), and for the chosen one: its kitchens and meals (tokens issued, meals served, quotas).
 * It also asks to serve at another yatra; that yatra's control room decides.
 */

const MEALS = [
  ['BREAKFAST', 'Breakfast'],
  ['LUNCH', 'Lunch'],
  ['DINNER', 'Dinner'],
];
const STATUS = {
  PENDING: ['pill-low', 'Waiting for the District Control Room'],
  APPROVED: ['pill-ok', 'Approved'],
  REJECTED: ['pill-out', 'Not approved'],
};
const dayOf = (d) => fmtDate(`${d}T12:00:00+05:30`, { weekday: 'short', year: undefined });

/** One meal at one kitchen on one day: tokens issued and served, and the quota (editable). */
function Meal({ eventId, kitchen, slot, onSaved }) {
  const [quota, setQuota] = useState(String(slot.capacity));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const label = MEALS.find(([k]) => k === slot.meal)?.[1];
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await API.put(`/kitchens/yatras/${eventId}/kitchens/${kitchen._id}/meals`, { date: slot.date, meal: slot.meal, capacity: Number(quota) });
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  const full = slot.remaining === 0;
  return (
    <li className="rounded-xl border border-line bg-white p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-bold">{label}</span>
        <span className="text-sm text-ink-soft">{slot.startTime} to {slot.endTime}</span>
      </div>
      <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div><dt className="text-sm text-ink-soft">Tokens issued</dt><dd className="text-xl font-extrabold tabular-nums">{slot.issued}</dd></div>
        <div><dt className="text-sm text-ink-soft">Meals served</dt><dd className="text-xl font-extrabold tabular-nums">{slot.served}</dd></div>
        <div><dt className="text-sm text-ink-soft">Left</dt><dd className={`text-xl font-extrabold tabular-nums ${full ? 'text-kumkum' : ''}`}>{full ? 'Full' : slot.remaining}</dd></div>
      </dl>
      <form onSubmit={save} className="mt-2 flex items-end gap-2">
        <div className="flex-1">
          <label className="field-label text-sm" htmlFor={`q-${slot._id}`}>Quota</label>
          <input id={`q-${slot._id}`} className="field" inputMode="numeric" value={quota} onChange={(e) => setQuota(e.target.value.replace(/\D/g, '').slice(0, 5))} />
        </div>
        <button type="submit" className="btn-ghost" disabled={busy || quota === String(slot.capacity)} aria-label={`Save the ${label?.toLowerCase()} quota of ${kitchen.name}`}>Save</button>
      </form>
      <Notice tone="error" className="mt-2">{error}</Notice>
    </li>
  );
}

/** Add a meal (quota) for a day that has none yet. */
function AddMeal({ eventId, kitchen, today, onSaved }) {
  const [form, setForm] = useState({ date: today, meal: 'LUNCH', capacity: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await API.put(`/kitchens/yatras/${eventId}/kitchens/${kitchen._id}/meals`, { ...form, capacity: Number(form.capacity) });
      setForm((f) => ({ ...f, capacity: '' }));
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="mt-3 grid gap-2 rounded-xl bg-mist p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
      <div>
        <label className="field-label text-sm" htmlFor={`d-${kitchen._id}`}>Day</label>
        <input id={`d-${kitchen._id}`} type="date" className="field" min={today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
      </div>
      <div>
        <label className="field-label text-sm" htmlFor={`m-${kitchen._id}`}>Meal</label>
        <select id={`m-${kitchen._id}`} className="field" value={form.meal} onChange={(e) => setForm({ ...form, meal: e.target.value })}>
          {MEALS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>
      <div>
        <label className="field-label text-sm" htmlFor={`c-${kitchen._id}`}>Tokens</label>
        <input id={`c-${kitchen._id}`} className="field" inputMode="numeric" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value.replace(/\D/g, '').slice(0, 5) })} placeholder="e.g. 500" />
      </div>
      <button type="submit" className="btn-ink" disabled={busy || !form.capacity}>Set meal<span className="sr-only"> for {kitchen.name}</span></button>
      <Notice tone="error" className="sm:col-span-4">{error}</Notice>
    </form>
  );
}

function AddKitchen({ eventId, onSaved }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', sector: '', menu: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!open) {
    return (
      <button type="button" className="btn-ghost" onClick={() => setOpen(true)}>
        <Plus size={18} aria-hidden /> Add a kitchen
      </button>
    );
  }
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await API.post(`/kitchens/yatras/${eventId}/kitchens`, form);
      setOpen(false);
      setForm({ name: '', sector: '', menu: '' });
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="panel grid gap-3 p-4 sm:grid-cols-3">
      <h3 className="text-lg font-bold sm:col-span-3">New kitchen</h3>
      <div>
        <label className="field-label" htmlFor="nk-name">Kitchen name</label>
        <input id="nk-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Annapurna Langar 2" />
      </div>
      <div>
        <label className="field-label" htmlFor="nk-sector">Sector or area</label>
        <input id="nk-sector" className="field" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} placeholder="e.g. Sector 2 - Tapovan Sadhugram" />
      </div>
      <div>
        <label className="field-label" htmlFor="nk-menu">Usual menu <span className="font-normal text-ink-soft">(comma separated)</span></label>
        <input id="nk-menu" className="field" value={form.menu} onChange={(e) => setForm({ ...form, menu: e.target.value })} placeholder="Khichdi, Puri-Bhaji, Kadhi" />
      </div>
      <div className="flex gap-2 sm:col-span-3">
        <button type="submit" className="btn-primary" disabled={busy}>Add kitchen</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      <Notice tone="error" className="sm:col-span-3">{error}</Notice>
    </form>
  );
}

function YatraKitchens({ eventId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [day, setDay] = useState('');
  const latest = useRef(0);
  const load = useCallback(() => {
    const ticket = ++latest.current;
    setError('');
    API.get(`/kitchens/yatras/${eventId}/dashboard`)
      .then(({ data: d }) => {
        if (ticket === latest.current) setData({ eventId, ...d });
      })
      .catch((e) => {
        if (ticket === latest.current) setError(errorMessage(e));
      });
  }, [eventId]);
  useEffect(() => {
    load();
  }, [load]);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!data || data.eventId !== eventId) return <Loading label="Loading your kitchens" />;
  const days = [...new Set(data.kitchens.flatMap((k) => k.slots.map((s) => s.date)))].sort();
  const shown = days.includes(day) ? day : days[0] || data.today;
  const totals = data.kitchens.flatMap((k) => k.slots.filter((s) => s.date === shown)).reduce((t, s) => ({ issued: t.issued + s.issued, served: t.served + s.served, quota: t.quota + s.capacity }), { issued: 0, served: 0, quota: 0 });

  return (
    <div className="space-y-5">
      {data.prebooking && <Notice>The yatra has not started yet: tokens can already be booked for its first days.</Notice>}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="field-label" htmlFor="k-day">Day</label>
          <select id="k-day" className="field" value={shown} onChange={(e) => setDay(e.target.value)}>
            {(days.length ? days : [data.today]).map((d) => <option key={d} value={d}>{dayOf(d)}</option>)}
          </select>
        </div>
        <dl className="grid flex-1 grid-cols-3 gap-3">
          {[['Meal tokens', totals.quota], ['Issued', totals.issued], ['Served', totals.served]].map(([l, n]) => (
            <div key={l} className="panel p-3"><dt className="text-sm text-ink-soft">{l}</dt><dd className="text-2xl font-extrabold tabular-nums">{n}</dd></div>
          ))}
        </dl>
      </div>
      {data.kitchens.length === 0 && <Notice>No kitchens yet. Add your first kitchen for this yatra.</Notice>}
      {data.kitchens.map((k) => (
        <section key={k._id} aria-labelledby={`kh-${k._id}`} className="panel p-4 sm:p-5">
          <h3 id={`kh-${k._id}`} className="flex items-center gap-2 text-xl font-bold"><ChefHat size={20} aria-hidden /> {k.name}</h3>
          <p className="text-ink-soft">{k.sector}{k.menu?.length ? `. Usually: ${k.menu.join(', ')}` : ''}</p>
          <ul className="mt-3 grid gap-3 md:grid-cols-3">
            {k.slots.filter((s) => s.date === shown).map((s) => <Meal key={`${s._id}-${s.capacity}`} eventId={eventId} kitchen={k} slot={s} onSaved={load} />)}
          </ul>
          {!k.slots.some((s) => s.date === shown) && <p className="mt-2 text-ink-soft">No meals set for this day.</p>}
          <AddMeal eventId={eventId} kitchen={k} today={data.today} onSaved={load} />
        </section>
      ))}
      <AddKitchen eventId={eventId} onSaved={load} />
    </div>
  );
}

function AskToServe({ yatras, onSent }) {
  const [form, setForm] = useState({ eventId: '', sector: '', mealsPerDay: '', note: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    if (!form.eventId) return setError('Choose the yatra');
    setBusy(true);
    setError('');
    try {
      await API.post('/kitchens/service-requests', form);
      setForm({ eventId: '', sector: '', mealsPerDay: '', note: '' });
      onSent();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  if (!yatras.length) return <p className="text-ink-soft">You have asked to serve at every yatra open now.</p>;
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="field-label" htmlFor="as-yatra">Yatra</label>
        <select id="as-yatra" className="field" value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })}>
          <option value="">Choose</option>
          {yatras.map((y) => <option key={y._id} value={y._id}>{y.title}</option>)}
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor="as-sector">Where you want to cook <span className="font-normal text-ink-soft">(optional)</span></label>
        <input id="as-sector" className="field" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} placeholder="e.g. Tapovan" />
      </div>
      <div>
        <label className="field-label" htmlFor="as-meals">Meals a day <span className="font-normal text-ink-soft">(optional)</span></label>
        <input id="as-meals" className="field" inputMode="numeric" value={form.mealsPerDay} onChange={(e) => setForm({ ...form, mealsPerDay: e.target.value.replace(/\D/g, '').slice(0, 7) })} placeholder="e.g. 800" />
      </div>
      <div>
        <label className="field-label" htmlFor="as-note">Note for the control room <span className="font-normal text-ink-soft">(optional)</span></label>
        <input id="as-note" className="field" maxLength={300} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Two langar lines, our own water tanker" />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Ask the District Control Room'}</button>
      </div>
      <Notice tone="error" className="sm:col-span-2">{error}</Notice>
    </form>
  );
}

export default function KitchenDashboard() {
  const { user } = useAuth();
  const [mine, setMine] = useState(null);
  const [allYatras, setAllYatras] = useState([]);
  const [chosen, setChosen] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setError('');
    Promise.all([API.get('/kitchens/mine'), API.get('/events', { params: { kind: 'YATRA' } })])
      .then(([m, ev]) => {
        setMine(m.data.yatras);
        setAllYatras(ev.data);
      })
      .catch((e) => setError(errorMessage(e)));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const approved = (mine || []).filter((r) => r.status === 'APPROVED' && r.eventId);
  const yatraId = approved.some((r) => r.eventId._id === chosen) ? chosen : approved[0]?.eventId._id || '';
  const asked = new Set((mine || []).filter((r) => r.status !== 'REJECTED').map((r) => r.eventId?._id));
  return (
    <div className="shell space-y-6 py-6">
      <PageTitle kicker={user?.organisationName || 'Kitchen service'} tone="green" title="Kitchens at yatras" lead="Each yatra's District Control Room approves where you serve. Set meal tokens per kitchen and see how many were served." />
      <Notice tone="error">{error}</Notice>
      {!mine && !error && <Loading />}
      {mine && (
        <>
          {approved.length > 0 ? (
            <section aria-labelledby="k-serve" className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 id="k-serve" className="text-2xl font-bold">Your kitchens</h2>
                {approved.length > 1 && (
                  <div>
                    <label className="field-label" htmlFor="k-yatra">Yatra</label>
                    <select id="k-yatra" className="field" value={yatraId} onChange={(e) => setChosen(e.target.value)}>
                      {approved.map((r) => <option key={r._id} value={r.eventId._id}>{r.eventId.title}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {approved.length === 1 && <p className="text-ink-soft">{approved[0].eventId.title}</p>}
              <YatraKitchens eventId={yatraId} />
            </section>
          ) : (
            <Notice>No yatra has approved your kitchen yet. Ask a yatra's District Control Room below.</Notice>
          )}

          <section aria-labelledby="k-asks" className="panel space-y-4 p-5" data-no-translate>
            <h2 id="k-asks" className="text-2xl font-bold">Serve at a yatra</h2>
            {mine.length > 0 && (
              <ul className="divide-y divide-line">
                {mine.map((r) => (
                  <li key={r._id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span>
                      <span className="font-semibold">{r.eventId?.title}</span>
                      {r.status === 'REJECTED' && r.rejectionReason && <span className="block text-[15px]"><b>Reason:</b> {r.rejectionReason} You can ask again.</span>}
                    </span>
                    <span className={STATUS[r.status][0]}>{STATUS[r.status][1]}</span>
                  </li>
                ))}
              </ul>
            )}
            <AskToServe yatras={allYatras.filter((y) => !asked.has(y._id))} onSent={load} />
          </section>
        </>
      )}
    </div>
  );
}
