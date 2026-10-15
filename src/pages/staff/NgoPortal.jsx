import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Armchair, Minus, Plus } from 'lucide-react';
import API, { errorMessage } from '../../lib/api';
import { CATEGORY_LABELS, MEAL_LABELS } from '../../lib/format';
import Notice, { Loading } from '../../components/Notice';
import VolunteerReview from './VolunteerReview';
import { NumberField, TextField } from '../../components/Fields';
import { firstError, intError, textError } from '../../lib/validate';

// Small digits-only box for inline controls (no e, +, -, decimals)
const digitsUpTo = (raw, max) => raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, String(max).length);

function BedAdjuster({ lodging, onSaved }) {
  const [change, setChange] = useState('10');
  const [error, setError] = useState('');
  const apply = async (sign) => {
    setError('');
    const problem = intError(change, 'Beds to add or remove', { min: 1, max: 1000, required: true });
    if (problem) return setError(problem);
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
      <input type="text" inputMode="numeric" pattern="[0-9]*" className="field w-24 text-center tabular-nums" value={change} onChange={(e) => setChange(digitsUpTo(e.target.value, 1000))} aria-label="Number of beds to add or remove (1 to 1,000)" />
      <button type="button" className="btn-ghost w-12 px-0" onClick={() => apply(1)} aria-label={`Add beds to ${lodging.name}`}><Plus size={18} /></button>
      {error && <span className="text-sm font-semibold text-kumkum">{error}</span>}
    </div>
  );
}

function SlotQuota({ center, slot, meal, date, onSaved }) {
  const [cap, setCap] = useState(String(slot?.capacity ?? 0));
  const [error, setError] = useState('');
  const save = async () => {
    setError('');
    const problem = intError(cap, 'Meal tokens', { min: 0, max: 20000, required: true });
    if (problem) return setError(problem);
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
        <input type="text" inputMode="numeric" pattern="[0-9]*" className="field min-h-10 w-24 tabular-nums" value={cap} onChange={(e) => setCap(digitsUpTo(e.target.value, 20000))} aria-label={`${MEAL_LABELS[meal]} tokens (0 to 20,000)`} />
        <button type="button" className="btn-ghost min-h-10 px-3" onClick={save}>Save</button>
      </div>
      {error && <p className="mt-1 text-sm font-semibold text-kumkum">{error}</p>}
    </div>
  );
}

function AddCamp({ sectors, onSaved }) {
  const [form, setForm] = useState({ name: '', sector: sectors[0] || '', category: 'FREE_CAMP', totalBeds: '50', distanceToGhatKm: 1 });
  const [error, setError] = useState('');
  const [tried, setTried] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const put = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setTried(true);
    const problem = firstError(
      textError(form.name, 'Camp name', 'campName', { required: true }),
      intError(form.totalBeds, 'Beds', { min: 1, max: 5000, required: true }),
    );
    if (problem) return; // the fields show their own messages
    try {
      await API.post('/ngo/lodgings', { ...form, totalBeds: Number(form.totalBeds), distanceToGhatKm: Number(form.distanceToGhatKm), amenities: ['Drinking Water'] });
      setForm({ ...form, name: '' });
      setTried(false);
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  return (
    <form onSubmit={submit} noValidate className="panel grid gap-3 p-4 md:grid-cols-[2fr_1.5fr_1.2fr_1fr_auto] md:items-start">
      <TextField id="c-name" label="New camp name" rule="campName" required value={form.name} onChange={put('name')} showErrors={tried} placeholder="e.g. Tapovan Seva Camp B" />
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
      <NumberField id="c-beds" label="Beds" min={1} max={5000} required value={form.totalBeds} onChange={put('totalBeds')} showErrors={tried} />
      <button type="submit" className="btn-primary md:mt-7">Add camp</button>
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
