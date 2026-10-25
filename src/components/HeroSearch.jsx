import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BedDouble, BusFront, Search, Ticket, UtensilsCrossed } from 'lucide-react';
import { addDaysIST, EVENT_CATEGORIES, fmtDate, todayIST } from '../lib/format';

const TABS = [
  { id: 'stay', label: 'Stays', icon: BedDouble },
  { id: 'food', label: 'Food', icon: UtensilsCrossed },
  { id: 'transit', label: 'Transit', icon: BusFront },
  { id: 'events', label: 'Events', icon: Ticket },
];

/** One labelled box in the search bar, like the fields on a travel site. */
function Field({ id, label, children }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-line bg-white px-3.5 py-2 transition-all focus-within:border-[#bd5338] focus-within:shadow-xs hover:border-ink-faint">
      <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">{label}</label>
      {children}
    </div>
  );
}
const inputCls = 'w-full bg-transparent py-0.5 text-base sm:text-lg font-bold text-ink outline-none';

/**
 * Travel-site style search: pick a service tab, fill two or three fields and
 * jump straight to filtered results in the yatra portal.
 */
export default function HeroSearch({ event }) {
  const navigate = useNavigate();
  const today = todayIST();
  const [tab, setTab] = useState('stay');
  const [sector, setSector] = useState('');
  const [checkIn, setCheckIn] = useState(today);
  const [beds, setBeds] = useState(2);
  const [date, setDate] = useState(today);
  const [meal, setMeal] = useState('LUNCH');
  const [category, setCategory] = useState('');
  const base = `/yatra/${event.slug}`;

  const go = (e) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (tab === 'stay') {
      q.set('tab', 'lodging');
      if (sector) q.set('sector', sector);
      q.set('checkIn', checkIn);
      q.set('beds', String(beds));
      navigate(`${base}?${q}`);
    } else if (tab === 'food') {
      q.set('tab', 'food');
      q.set('date', date);
      q.set('meal', meal);
      navigate(`${base}?${q}`);
    } else if (tab === 'transit') {
      navigate(`${base}?tab=transit`);
    } else {
      navigate(category ? `/events?tab=public&category=${category}` : '/events?tab=public');
    }
  };

  const days = Array.from({ length: 4 }, (_, i) => addDaysIST(today, i));

  return (
    <form onSubmit={go} className="relative z-10 mx-auto -mt-6 sm:-mt-8 w-[calc(100%-1.5rem)] max-w-4xl rounded-2xl sm:rounded-3xl border border-[#e4d8c8] bg-[#fbf9f5] p-4 sm:p-5 shadow-sm">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3" role="tablist" aria-label="What are you looking for?">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              tab === t.id
                ? 'bg-[#bd5338] text-white shadow-xs'
                : 'border border-line bg-white text-ink-soft hover:bg-mist hover:text-ink'
            }`}
          >
            <t.icon size={17} aria-hidden /> {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5 md:flex-row md:items-stretch">
        {tab === 'stay' && (
          <>
            <Field id="hs-sector" label="Sector / ghat">
              <select id="hs-sector" className={inputCls} value={sector} onChange={(e) => setSector(e.target.value)}>
                <option value="">Any sector</option>
                {(event.sectors || []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field id="hs-in" label="Check-in">
              <input id="hs-in" type="date" className={inputCls} min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </Field>
            <Field id="hs-beds" label="Beds">
              <select id="hs-beds" className={inputCls} value={beds} onChange={(e) => setBeds(Number(e.target.value))}>
                {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} {n > 1 ? 'beds' : 'bed'}</option>)}
              </select>
            </Field>
          </>
        )}
        {tab === 'food' && (
          <>
            <Field id="hs-date" label="Day">
              <select id="hs-date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)}>
                {days.map((d, i) => <option key={d} value={d}>{i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : fmtDate(d, { weekday: 'short', year: undefined })}</option>)}
              </select>
            </Field>
            <Field id="hs-meal" label="Meal">
              <select id="hs-meal" className={inputCls} value={meal} onChange={(e) => setMeal(e.target.value)}>
                <option value="BREAKFAST">Breakfast · 7–9 am</option>
                <option value="LUNCH">Lunch · 12–3 pm</option>
                <option value="DINNER">Dinner · 7–10 pm</option>
              </select>
            </Field>
          </>
        )}
        {tab === 'transit' && (
          <Field id="hs-transit" label="Shuttles & buses">
            <p id="hs-transit" className="py-1 text-lg font-bold text-ink">E-rickshaws and feeder buses to every ghat</p>
          </Field>
        )}
        {tab === 'events' && (
          <Field id="hs-cat" label="Kind of event">
            <select id="hs-cat" className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All public events</option>
              {Object.entries(EVENT_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
        )}
        <button type="submit" className="btn-primary min-h-14 px-8 text-lg md:self-stretch">
          <Search size={20} aria-hidden /> Search
        </button>
      </div>
    </form>
  );
}
