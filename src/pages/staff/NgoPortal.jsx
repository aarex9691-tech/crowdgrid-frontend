import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Armchair, Minus, Plus } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { CATEGORY_LABELS, MEAL_LABELS } from '../../lib/format';
import Notice, { Loading } from '../../components/Notice';
import VolunteerReview from './VolunteerReview';

function BedAdjuster({ lodging, onSaved }) {
  const [change, setChange] = useState(10);
  const [error, setError] = useState('');
  const apply = async (sign) => {
    setError('');
    try {
      await API.patch(`/ngo/lodgings/${lodging._id}/beds`, { change: sign * Math.abs(Number(change) || 0) });
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="btn-ghost w-12 px-0" onClick={() => apply(-1)} aria-label={`Remove beds from ${lodging.name}`}><Minus size={18} /></button>
      <input type="number" min="1" className="field w-24 text-center" value={change} onChange={(e) => setChange(e.target.value)} aria-label="Number of beds to add or remove" />
      <button type="button" className="btn-ghost w-12 px-0" onClick={() => apply(1)} aria-label={`Add beds to ${lodging.name}`}><Plus size={18} /></button>
      {error && <span className="text-sm font-semibold text-kumkum">{error}</span>}
    </div>
  );
}

function SlotQuota({ center, slot, meal, date, onSaved }) {
  const [cap, setCap] = useState(slot?.capacity ?? 0);
  const [error, setError] = useState('');
  const save = async () => {
    setError('');
    try {
      await API.put(`/ngo/food-centers/${center._id}/slots`, { date, meal, capacity: Number(cap) });
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  return (
    <div className="rounded-xl bg-mist p-3">
      <p className="font-semibold">{MEAL_LABELS[meal]}</p>
      <p className="text-sm text-ink-soft">{slot ? `${slot.capacity - slot.remaining} issued, ${slot.remaining} left` : 'Not open'}</p>
      <div className="mt-2 flex gap-2">
        <input type="number" min="0" className="field min-h-10 w-24" value={cap} onChange={(e) => setCap(e.target.value)} aria-label={`${MEAL_LABELS[meal]} quota`} />
        <button type="button" className="btn-ghost min-h-10 px-3" onClick={save}>Save</button>
      </div>
      {error && <p className="mt-1 text-sm font-semibold text-kumkum">{error}</p>}
    </div>
  );
}

function AddCamp({ sectors, onSaved }) {
  const [form, setForm] = useState({ name: '', sector: sectors[0] || '', category: 'FREE_CAMP', totalBeds: 50, distanceToGhatKm: 1 });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('/ngo/lodgings', { ...form, totalBeds: Number(form.totalBeds), distanceToGhatKm: Number(form.distanceToGhatKm), amenities: ['Drinking Water'] });
      setForm({ ...form, name: '' });
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  return (
    <form onSubmit={submit} className="panel grid gap-3 p-4 md:grid-cols-[2fr_1.5fr_1.2fr_0.8fr_auto] md:items-end">
      <div>
        <label className="field-label" htmlFor="c-name">New camp name</label>
        <input id="c-name" className="field" value={form.name} onChange={set('name')} required />
      </div>
      <div>
        <label className="field-label" htmlFor="c-sector">Sector</label>
        <select id="c-sector" className="field" value={form.sector} onChange={set('sector')}>{sectors.map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      <div>
        <label className="field-label" htmlFor="c-cat">Type</label>
        <select id="c-cat" className="field" value={form.category} onChange={set('category')}>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor="c-beds">Beds</label>
        <input id="c-beds" type="number" min="1" className="field" value={form.totalBeds} onChange={set('totalBeds')} />
      </div>
      <button type="submit" className="btn-primary">Add camp</button>
      {error && <p className="text-sm font-semibold text-kumkum md:col-span-5">{error}</p>}
    </form>
  );
}

export default function NgoPortal() {
  const [data, setData] = useState(null);
  const [sectors, setSectors] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    API.get('/ngo/dashboard')
      .then(({ data: d }) => {
        setData(d);
        return API.get(`/events/${d.provider.eventId}`);
      })
      .then(({ data: ev }) => setSectors(ev.sectors || []))
      .catch((e) => setError(errorMessage(e)));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (error) return <div className="shell py-10"><Notice tone="error">{error}</Notice></div>;
  if (!data) return <Loading label="Loading your camps" />;
  const { provider, totals } = data;

  return (
    <div className="shell space-y-8 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{provider.name}</h1>
          <p className="text-ink-soft">Camp &amp; kitchen manager</p>
        </div>
        <Link to="/scan" className="btn-ink">Open scanner</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Total beds', totals.beds],
          ['Beds free', totals.available],
          ['Active bookings', totals.bookings],
          ['Check-ins today', totals.checkInsToday],
        ].map(([k, v]) => (
          <div key={k} className="panel p-4">
            <p className="text-ink-soft">{k}</p>
            <p className="text-3xl font-extrabold tabular-nums">{Number(v).toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>

      <section className="space-y-3" aria-labelledby="camps">
        <h2 id="camps" className="text-2xl font-bold">Camps &amp; bed inventory</h2>
        {data.lodgings.length === 0 && <Notice>No camps yet. Add your first one below.</Notice>}
        <ul className="space-y-3">
          {data.lodgings.map((l) => (
            <li key={l._id} className="panel flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
              <div className="flex-1">
                <p className="text-lg font-bold">{l.name}</p>
                <p className="text-ink-soft">{CATEGORY_LABELS[l.category]} · {l.sector}</p>
                <p className="tabular-nums">
                  <strong>{l.availableBeds}</strong> free of {l.totalBeds} beds
                </p>
              </div>
              <Link to={`/camps/${l._id}/map`} className="btn-ink min-h-10 whitespace-nowrap px-4">
                <Armchair size={18} aria-hidden /> Tent map
              </Link>
              <BedAdjuster lodging={l} onSaved={load} />
            </li>
          ))}
        </ul>
        {sectors.length > 0 && <AddCamp sectors={sectors} onSaved={load} />}
      </section>

      <section className="space-y-3" aria-labelledby="kitchens">
        <h2 id="kitchens" className="text-2xl font-bold">Kitchens: today's token quotas</h2>
        {data.foodCenters.length === 0 && <Notice>Your organisation has no kitchens listed.</Notice>}
        {data.foodCenters.map((c) => (
          <div key={c._id} className="panel p-4">
            <p className="text-lg font-bold">{c.name}</p>
            <p className="text-ink-soft">{c.sector}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {Object.keys(MEAL_LABELS).map((m) => (
                <SlotQuota key={m} center={c} meal={m} date={data.today} slot={c.slots.find((s) => s.meal === m)} onSaved={load} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <VolunteerReview />
    </div>
  );
}
